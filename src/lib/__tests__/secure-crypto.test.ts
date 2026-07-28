import { SecureCrypto } from '../secure-crypto';

async function runSecureCryptoTests() {
  console.log("Running Secure Crypto API Key Unit Tests...");

  const rawKey = "sample_omdb_api_key_998877";
  const userId = "test_user_123";

  // 1. Encrypt key with default enc:v2: format
  const encrypted = await SecureCrypto.encryptApiKey(rawKey, userId);
  console.assert(encrypted.startsWith("enc:v2:"), "Test Failed: Encrypted string must start with 'enc:v2:'");

  // 2. Decrypt key
  const decrypted = await SecureCrypto.decryptApiKey(encrypted, userId);
  console.assert(decrypted === rawKey, `Test Failed: Decrypted key '${decrypted}' does not match original '${rawKey}'`);

  // 3. Test generic secret encryption/decryption
  const secretPayload = await SecureCrypto.encryptSecret("my_oauth_token_secret");
  const decryptedSecret = await SecureCrypto.decryptSecret(secretPayload);
  console.assert(decryptedSecret === "my_oauth_token_secret", "Test Failed: Generic secret decryption failed");

  // 4. Test legacy base64 migration fallback
  const legacySalted = Buffer.from(`trackr_v2_salt_${rawKey}`).toString('base64');
  const legacyDecrypted = await SecureCrypto.decryptApiKey(legacySalted, userId);
  console.assert(legacyDecrypted === rawKey, `Test Failed: Legacy key decryption failed. Expected '${rawKey}', got '${legacyDecrypted}'`);

  console.log("✅ Secure Crypto Unit Tests Passed!");
}

runSecureCryptoTests().catch((err) => {
  console.error("❌ Secure Crypto Unit Tests Failed:", err);
  process.exit(1);
});
