import { secureStorage } from './secure-storage';

/**
 * Web Crypto API (AES-GCM 256-bit + PBKDF2) encryption utility for client-side API keys and credentials.
 */

function getCrypto(): Crypto {
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto;
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto;
  }
  try {
    const nodeCrypto = require('crypto');
    return nodeCrypto.webcrypto || nodeCrypto;
  } catch {
    throw new Error('Web Crypto API is not supported in this environment');
  }
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(Math.ceil(hex.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export class SecureCrypto {
  private static ITERATIONS = 100000;
  private static KEY_LEN = 256;
  public static PREFIX_V2 = 'enc:v2:';
  public static PREFIX_V1 = 'enc:v1:';

  private static inMemoryDeviceKey: string | null = null;

  /**
   * Generates or retrieves a cryptographically random device master key (not derived from userId).
   */
  public static async getOrCreateDeviceMasterKey(): Promise<string> {
    if (this.inMemoryDeviceKey) return this.inMemoryDeviceKey;

    let deviceKey = await secureStorage.getSystemKey('device_master_key');
    if (!deviceKey && typeof window !== 'undefined') {
      deviceKey = localStorage.getItem('trackr_sys_device_master_key');
    }

    if (!deviceKey) {
      const crypto = getCrypto();
      const randomBytes = crypto.getRandomValues(new Uint8Array(32));
      deviceKey = bufferToHex(randomBytes.buffer);
      await secureStorage.setSystemKey('device_master_key', deviceKey);
    }

    this.inMemoryDeviceKey = deviceKey;
    return deviceKey;
  }

  /**
   * Computes a SHA-256 fingerprint hash of a secret (without storing or revealing plaintext key).
   */
  public static async computeFingerprint(secret: string): Promise<string> {
    if (!secret) return '';
    const crypto = getCrypto();
    const encoder = new TextEncoder();
    const data = encoder.encode(secret.trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return bufferToHex(hashBuffer);
  }

  private static async deriveKey(crypto: Crypto, secretKey: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secretKey),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as BufferSource,
        iterations: this.ITERATIONS,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: this.KEY_LEN },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypts any raw secret (API key, OAuth token, etc.) using AES-GCM 256-bit with PBKDF2.
   * Uses device master key or an optional user passphrase.
   */
  public static async encryptSecret(plaintext: string, userPassphrase?: string): Promise<string> {
    if (!plaintext || plaintext.trim() === '') return '';

    const crypto = getCrypto();
    const encoder = new TextEncoder();

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const masterSecret = userPassphrase && userPassphrase.trim().length > 0 
      ? userPassphrase.trim() 
      : await this.getOrCreateDeviceMasterKey();

    const derivedKey = await this.deriveKey(crypto, masterSecret, salt);

    const ciphertextBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv as BufferSource },
      derivedKey,
      encoder.encode(plaintext.trim())
    );

    const saltHex = bufferToHex(salt.buffer);
    const ivHex = bufferToHex(iv.buffer);
    const ciphertextHex = bufferToHex(ciphertextBuffer);

    return `${this.PREFIX_V2}${saltHex}:${ivHex}:${ciphertextHex}`;
  }

  /**
   * Decrypts an encrypted secret payload (enc:v2: or enc:v1:).
   */
  public static async decryptSecret(
    encryptedPayload: string, 
    userPassphrase?: string,
    legacyUserId?: string
  ): Promise<string> {
    if (!encryptedPayload) return '';

    const crypto = getCrypto();
    const decoder = new TextDecoder();

    // Handle enc:v2: payload
    if (encryptedPayload.startsWith(this.PREFIX_V2)) {
      try {
        const payloadWithoutPrefix = encryptedPayload.substring(this.PREFIX_V2.length);
        const parts = payloadWithoutPrefix.split(':');
        if (parts.length !== 3) return '';

        const [saltHex, ivHex, ciphertextHex] = parts;
        const salt = hexToBuffer(saltHex);
        const iv = hexToBuffer(ivHex);
        const ciphertext = hexToBuffer(ciphertextHex);

        const masterSecret = userPassphrase && userPassphrase.trim().length > 0 
          ? userPassphrase.trim() 
          : await this.getOrCreateDeviceMasterKey();

        const derivedKey = await this.deriveKey(crypto, masterSecret, salt);

        const decryptedBuffer = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: iv as BufferSource },
          derivedKey,
          ciphertext as BufferSource
        );

        return decoder.decode(decryptedBuffer);
      } catch (err) {
        console.error('Failed to decrypt secret (v2):', err);
        return '';
      }
    }

    // Handle legacy enc:v1: payload (which used userId)
    if (encryptedPayload.startsWith(this.PREFIX_V1)) {
      try {
        const payloadWithoutPrefix = encryptedPayload.substring(this.PREFIX_V1.length);
        const parts = payloadWithoutPrefix.split(':');
        if (parts.length !== 3) return '';

        const [saltHex, ivHex, ciphertextHex] = parts;
        const salt = hexToBuffer(saltHex);
        const iv = hexToBuffer(ivHex);
        const ciphertext = hexToBuffer(ciphertextHex);

        const masterSecret = `trackr_secret_key_${legacyUserId || 'default'}_v1`;
        const derivedKey = await this.deriveKey(crypto, masterSecret, salt);

        const decryptedBuffer = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: iv as BufferSource },
          derivedKey,
          ciphertext as BufferSource
        );

        return decoder.decode(decryptedBuffer);
      } catch (err) {
        console.error('Failed to decrypt legacy secret (v1):', err);
        return '';
      }
    }

    // Handle unencrypted / legacy base64 strings
    try {
      let decoded = '';
      if (typeof window !== 'undefined' && window.atob) {
        decoded = window.atob(encryptedPayload);
      } else {
        decoded = Buffer.from(encryptedPayload, 'base64').toString('utf-8');
      }
      if (decoded.includes('trackr_v2_salt_')) {
        return decoded.replace('trackr_v2_salt_', '');
      }
      return encryptedPayload;
    } catch {
      return encryptedPayload;
    }
  }

  // --- Legacy Alias Accessors ---

  public static async encryptApiKey(rawKey: string, userId: string): Promise<string> {
    return this.encryptSecret(rawKey);
  }

  public static async decryptApiKey(encryptedPayload: string, userId: string): Promise<string> {
    return this.decryptSecret(encryptedPayload, undefined, userId);
  }
}
