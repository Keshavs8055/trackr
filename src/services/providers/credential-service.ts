import { providerManager } from './provider-manager';
import { auditLogService } from './audit-log-service';
import { ProviderCredentialStatus, ProviderName } from '@/types';
import { AppError } from '@/lib/app-error';
import { SecureCrypto } from '@/lib/secure-crypto';
import { secureStorage, StoredCredentialRecord } from '@/lib/secure-storage';

export class CredentialService {
  // Session-level in-memory cache for decrypted secrets
  private memoryCache: Map<string, { secret: string; decryptedAt: number }> = new Map();
  private inactivityTimeoutMs: number = 15 * 60 * 1000; // 15 minutes
  private isCleanupListenerRegistered: boolean = false;

  constructor() {
    this.registerSessionCleanupListeners();
    this.startPeriodicCachePurge();
  }

  private registerSessionCleanupListeners(): void {
    if (typeof window === 'undefined' || this.isCleanupListenerRegistered) return;
    this.isCleanupListenerRegistered = true;

    window.addEventListener('beforeunload', () => this.clearMemoryCache());
    window.addEventListener('pagehide', () => this.clearMemoryCache());
  }

  private startPeriodicCachePurge(): void {
    if (typeof window === 'undefined') return;
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.memoryCache.entries()) {
        if (now - entry.decryptedAt >= this.inactivityTimeoutMs) {
          this.memoryCache.delete(key);
        }
      }
    }, 60 * 1000);
  }

  /**
   * Clears all decrypted credentials from session memory.
   */
  public clearMemoryCache(): void {
    this.memoryCache.clear();
  }

  /**
   * Validates API key credentials and saves them securely to IndexedDB using AES-GCM 256-bit encryption.
   */
  public async configureProvider(
    userId: string,
    providerName: ProviderName | string,
    apiKey: string,
    passphrase?: string
  ): Promise<ProviderCredentialStatus> {
    if (!apiKey || apiKey.trim() === '') {
      throw AppError.validationFailed('API key cannot be empty.');
    }

    const provider = providerManager.getProvider(providerName);
    const trimmedKey = apiKey.trim();

    // Validate credentials directly
    const isValid = await provider.validateCredentials({ apiKey: trimmedKey });
    if (!isValid) {
      providerManager.setProviderCredentialStatus({
        provider: providerName as ProviderName,
        configured: false,
        enabled: false,
        status: 'INVALID_CREDENTIALS',
        lastError: 'Credential validation failed.',
      });
      throw AppError.invalidApiKey(provider.displayName);
    }

    // Compute SHA-256 fingerprint hash
    const fingerprint = await SecureCrypto.computeFingerprint(trimmedKey);

    // Encrypt secret using Device Master Key (or optional passphrase) via Web Crypto AES-GCM 256-bit
    const encryptedData = await SecureCrypto.encryptSecret(trimmedKey, passphrase);

    const recordId = `trackr_cred_${userId}_${providerName}`;
    const record: StoredCredentialRecord = {
      id: recordId,
      userId,
      provider: providerName,
      encryptedData,
      fingerprint,
      enabled: true,
      updatedAt: Date.now(),
      version: 'v2',
      schemaVersion: 2,
    };

    // Store in IndexedDB vault (single source of truth for credential & enabled state)
    await secureStorage.setCredential(record);

    // Cache in session memory
    this.memoryCache.set(recordId, { secret: trimmedKey, decryptedAt: Date.now() });

    const status: ProviderCredentialStatus = {
      provider: providerName as ProviderName,
      configured: true,
      enabled: true,
      status: 'CONNECTED',
      lastValidated: Date.now(),
      fingerprint,
      connectionHealth: 'HEALTHY',
    };

    providerManager.setProviderCredentialStatus(status);
    await auditLogService.logAction(userId, 'connect', providerName, { status: 'CONNECTED', fingerprint });

    return status;
  }

  /**
   * Rotates credentials for a provider without disconnecting.
   */
  public async rotateCredential(
    userId: string,
    providerName: ProviderName | string,
    newApiKey: string,
    passphrase?: string
  ): Promise<ProviderCredentialStatus> {
    const existingStatus = providerManager.getProviderStatus(providerName);
    const newFingerprint = await SecureCrypto.computeFingerprint(newApiKey.trim());

    if (existingStatus.fingerprint && existingStatus.fingerprint === newFingerprint) {
      throw AppError.validationFailed('New API key is identical to the current key.');
    }

    const updatedStatus = await this.configureProvider(userId, providerName, newApiKey, passphrase);
    await auditLogService.logAction(userId, 'credential_update', providerName, { action: 'rotated', fingerprint: newFingerprint });
    return updatedStatus;
  }

  /**
   * Toggles provider enable/disable state WITHOUT deleting stored credentials.
   * Updates state in IndexedDB vault record as the single source of truth.
   */
  public async setProviderEnabled(
    userId: string,
    providerName: ProviderName | string,
    enabled: boolean
  ): Promise<ProviderCredentialStatus> {
    const current = providerManager.getProviderStatus(providerName);
    if (!current.configured && enabled) {
      throw AppError.validationFailed('Cannot enable unconfigured provider. Please configure credentials first.');
    }

    const recordId = `trackr_cred_${userId}_${providerName}`;
    const record = await secureStorage.getCredential(recordId);
    if (record) {
      record.enabled = enabled;
      record.updatedAt = Date.now();
      await secureStorage.setCredential(record);
    }

    const newStatus: ProviderCredentialStatus = {
      ...current,
      enabled,
      status: enabled ? (current.configured ? 'CONNECTED' : 'NOT_CONFIGURED') : 'DISABLED',
    };

    providerManager.setProviderCredentialStatus(newStatus);
    await auditLogService.logAction(userId, enabled ? 'enable' : 'disable', providerName);

    return newStatus;
  }

  /**
   * Disconnects a provider by deleting stored credentials from IndexedDB and memory.
   */
  public async disconnectProvider(
    userId: string,
    providerName: ProviderName | string
  ): Promise<ProviderCredentialStatus> {
    const recordId = `trackr_cred_${userId}_${providerName}`;
    this.memoryCache.delete(recordId);

    await secureStorage.deleteCredential(recordId);

    const status: ProviderCredentialStatus = {
      provider: providerName as ProviderName,
      configured: false,
      enabled: false,
      status: 'NOT_CONFIGURED',
    };

    providerManager.setProviderCredentialStatus(status);
    await auditLogService.logAction(userId, 'disconnect', providerName);

    return status;
  }

  /**
   * Sole accessor for decrypted API keys / secrets.
   * Providers request credentials on-demand through CredentialService.
   * Verifies SHA-256 fingerprint upon decryption to prevent corrupted credentials.
   */
  public async getCredential(
    userId: string, 
    providerName: string, 
    passphrase?: string
  ): Promise<string | null> {
    const recordId = `trackr_cred_${userId}_${providerName}`;
    const cached = this.memoryCache.get(recordId);

    // Return cached secret if within 15-minute inactivity window
    if (cached && Date.now() - cached.decryptedAt < this.inactivityTimeoutMs) {
      cached.decryptedAt = Date.now(); // Touch timestamp on access
      return cached.secret;
    }

    // Fetch encrypted record from IndexedDB vault
    const record = await secureStorage.getCredential(recordId);
    if (!record || !record.encryptedData) return null;

    // Decrypt using Web Crypto AES-GCM (v2 device key or v1 legacy userId fallback)
    const decrypted = await SecureCrypto.decryptSecret(record.encryptedData, passphrase, userId);
    if (decrypted) {
      // Recompute SHA-256 fingerprint & verify integrity
      const recomputedFingerprint = await SecureCrypto.computeFingerprint(decrypted);
      if (record.fingerprint && recomputedFingerprint !== record.fingerprint) {
        console.error(`[CredentialService] Corrupted credential for ${providerName}! SHA-256 fingerprint mismatch.`);
        this.memoryCache.delete(recordId);
        providerManager.setProviderCredentialStatus({
          provider: providerName as ProviderName,
          configured: false,
          enabled: false,
          status: 'INVALID_CREDENTIALS',
          lastError: 'Credential fingerprint verification failed (corrupted key payload).',
        });
        return null;
      }

      // Auto-migrate legacy v1 format to v2 in IndexedDB
      if (record.encryptedData.startsWith(SecureCrypto.PREFIX_V1)) {
        const upgradedEncrypted = await SecureCrypto.encryptSecret(decrypted, passphrase);
        const upgradedRecord: StoredCredentialRecord = {
          ...record,
          encryptedData: upgradedEncrypted,
          fingerprint: record.fingerprint || recomputedFingerprint,
          enabled: record.enabled !== false,
          updatedAt: Date.now(),
          version: 'v2',
          schemaVersion: 2,
        };
        await secureStorage.setCredential(upgradedRecord);
      }

      this.memoryCache.set(recordId, { secret: decrypted, decryptedAt: Date.now() });
      return decrypted;
    }

    return null;
  }

  /**
   * Revalidates an existing credential live against the provider API to detect revoked keys.
   */
  public async revalidateCredential(
    userId: string, 
    providerName: string, 
    passphrase?: string
  ): Promise<boolean> {
    const key = await this.getCredential(userId, providerName, passphrase);
    if (!key) return false;

    const provider = providerManager.getProvider(providerName);
    const isValid = await provider.validateCredentials({ apiKey: key });

    const currentStatus = providerManager.getProviderStatus(providerName as ProviderName);
    if (isValid) {
      providerManager.recordSuccess(providerName);
      providerManager.setProviderCredentialStatus({
        ...currentStatus,
        configured: true,
        enabled: true,
        status: 'CONNECTED',
        lastValidated: Date.now(),
        connectionHealth: 'HEALTHY',
      });
      return true;
    } else {
      providerManager.recordError(providerName, 'Credential revalidation failed: Key revoked or expired.');
      providerManager.setProviderCredentialStatus({
        ...currentStatus,
        status: 'INVALID_CREDENTIALS',
        lastError: 'Key revoked or expired during revalidation.',
        connectionHealth: 'FAILED',
      });
      await auditLogService.logAction(userId, 'revalidate_failed', providerName);
      return false;
    }
  }

  /**
   * Checks whether a provider has configured credentials in IndexedDB or status manager.
   */
  public hasCredential(userId: string, providerName: string): boolean {
    const status = providerManager.getProviderStatus(providerName);
    return status.configured;
  }

  /**
   * Initializes provider credential statuses on startup from IndexedDB without loading plaintext into memory until needed.
   */
  public async initializeCredentials(userId: string): Promise<void> {
    for (const provider of providerManager.getAllProviders()) {
      if (provider.capabilities.supportsCredentials) {
        const recordId = `trackr_cred_${userId}_${provider.name}`;
        const record = await secureStorage.getCredential(recordId);

        if (record && record.encryptedData) {
          const isEnabled = record.enabled !== false;
          providerManager.setProviderCredentialStatus({
            provider: provider.name as ProviderName,
            configured: true,
            enabled: isEnabled,
            status: isEnabled ? 'CONNECTED' : 'DISABLED',
            lastValidated: record.updatedAt,
            fingerprint: record.fingerprint,
            connectionHealth: 'HEALTHY',
          });
        }
      }
    }
  }
}

export const credentialService = new CredentialService();
