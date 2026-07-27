import { providerManager } from './provider-manager';
import { auditLogService } from './audit-log-service';
import { OMDbProvider } from '@/providers/omdb-provider';
import { ProviderCredentialStatus, ProviderName, ProviderStatus } from '@/types';
import { AppError } from '@/lib/app-error';
import { SecureCrypto } from '@/lib/secure-crypto';

export class CredentialService {
  /**
   * Validates API key credentials and saves them securely using AES-GCM 256-bit encryption.
   */
  public async configureProvider(
    userId: string,
    providerName: ProviderName | string,
    apiKey: string
  ): Promise<ProviderCredentialStatus> {
    if (!apiKey || apiKey.trim() === '') {
      throw AppError.validationFailed('API key cannot be empty.');
    }

    const provider = providerManager.getProvider(providerName);
    const isValid = await provider.validateCredentials({ apiKey });

    if (!isValid) {
      providerManager.setProviderCredentialStatus({
        provider: providerName as ProviderName,
        configured: false,
        enabled: false,
        status: 'INVALID_CREDENTIALS',
      });
      throw AppError.invalidApiKey(provider.displayName);
    }

    // Keep in-memory key in provider instance
    if (provider instanceof OMDbProvider) {
      provider.setApiKey(apiKey.trim());
    }

    // Encrypt key with AES-GCM 256-bit + PBKDF2 salt/IV
    const encrypted = await SecureCrypto.encryptApiKey(apiKey.trim(), userId);

    if (typeof window !== 'undefined') {
      localStorage.setItem(`trackr_cred_${userId}_${providerName}`, encrypted);
      localStorage.setItem(`trackr_enabled_${userId}_${providerName}`, 'true');
    }

    const status: ProviderCredentialStatus = {
      provider: providerName as ProviderName,
      configured: true,
      enabled: true,
      status: 'CONNECTED',
      lastValidated: Date.now(),
    };

    providerManager.setProviderCredentialStatus(status);
    await auditLogService.logAction(userId, 'connect', providerName, { status: 'CONNECTED' });

    return status;
  }

  /**
   * Toggles provider enable/disable state WITHOUT deleting stored credentials.
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

    if (typeof window !== 'undefined') {
      localStorage.setItem(`trackr_enabled_${userId}_${providerName}`, enabled ? 'true' : 'false');
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
   * Disconnects a provider by deleting stored credentials.
   */
  public async disconnectProvider(
    userId: string,
    providerName: ProviderName | string
  ): Promise<ProviderCredentialStatus> {
    const provider = providerManager.getProvider(providerName);
    if (provider instanceof OMDbProvider) {
      provider.setApiKey(null);
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem(`trackr_cred_${userId}_${providerName}`);
      localStorage.removeItem(`trackr_enabled_${userId}_${providerName}`);
    }

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
   * Initializes credentials for the active user on startup with auto-migration of legacy keys
   */
  public async initializeCredentials(userId: string): Promise<void> {
    if (typeof window === 'undefined') return;

    for (const provider of providerManager.getAllProviders()) {
      if (provider.capabilities.supportsCredentials) {
        const encrypted = localStorage.getItem(`trackr_cred_${userId}_${provider.name}`);
        const enabledStr = localStorage.getItem(`trackr_enabled_${userId}_${provider.name}`);

        if (encrypted) {
          const decrypted = await SecureCrypto.decryptApiKey(encrypted, userId);
          if (decrypted) {
            if (provider instanceof OMDbProvider) {
              provider.setApiKey(decrypted);
            }
            
            // Auto-migrate legacy key format to AES-GCM if needed
            if (!encrypted.startsWith('enc:v1:')) {
              const upgradedEncrypted = await SecureCrypto.encryptApiKey(decrypted, userId);
              localStorage.setItem(`trackr_cred_${userId}_${provider.name}`, upgradedEncrypted);
            }

            const isEnabled = enabledStr !== 'false';
            providerManager.setProviderCredentialStatus({
              provider: provider.name,
              configured: true,
              enabled: isEnabled,
              status: isEnabled ? 'CONNECTED' : 'DISABLED',
              lastValidated: Date.now(),
            });
          }
        }
      }
    }
  }
}

export const credentialService = new CredentialService();
