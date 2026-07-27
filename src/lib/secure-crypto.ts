/**
 * Web Crypto API (AES-GCM 256-bit + PBKDF2) encryption utility for client-side API keys.
 */

function getCrypto(): Crypto {
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto;
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto;
  }
  // Node.js fallback for unit test environments
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
  private static PREFIX = 'enc:v1:';

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
   * Encrypts a raw API key using AES-GCM 256-bit with PBKDF2 key derivation.
   */
  public static async encryptApiKey(rawKey: string, userId: string): Promise<string> {
    if (!rawKey || rawKey.trim() === '') return '';

    const crypto = getCrypto();
    const encoder = new TextEncoder();

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const masterSecret = `trackr_secret_key_${userId}_v1`;
    const derivedKey = await this.deriveKey(crypto, masterSecret, salt);

    const ciphertextBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv as BufferSource },
      derivedKey,
      encoder.encode(rawKey.trim())
    );

    const saltHex = bufferToHex(salt.buffer);
    const ivHex = bufferToHex(iv.buffer);
    const ciphertextHex = bufferToHex(ciphertextBuffer);

    return `${this.PREFIX}${saltHex}:${ivHex}:${ciphertextHex}`;
  }

  /**
   * Decrypts an AES-GCM encrypted API key payload. 
   * Provides automatic legacy base64 fallback migration support.
   */
  public static async decryptApiKey(encryptedPayload: string, userId: string): Promise<string> {
    if (!encryptedPayload) return '';

    // Handle legacy Base64 salt encryption fallback
    if (!encryptedPayload.startsWith(this.PREFIX)) {
      try {
        let decoded = '';
        if (typeof window !== 'undefined') {
          decoded = atob(encryptedPayload);
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

    try {
      const crypto = getCrypto();
      const decoder = new TextDecoder();
      
      const payloadWithoutPrefix = encryptedPayload.substring(this.PREFIX.length);
      const parts = payloadWithoutPrefix.split(':');
      if (parts.length !== 3) return '';

      const [saltHex, ivHex, ciphertextHex] = parts;
      const salt = hexToBuffer(saltHex);
      const iv = hexToBuffer(ivHex);
      const ciphertext = hexToBuffer(ciphertextHex);

      const masterSecret = `trackr_secret_key_${userId}_v1`;
      const derivedKey = await this.deriveKey(crypto, masterSecret, salt);

      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv as BufferSource },
        derivedKey,
        ciphertext as BufferSource
      );

      return decoder.decode(decryptedBuffer);
    } catch (err) {
      console.error('Failed to decrypt API key:', err);
      return '';
    }
  }
}
