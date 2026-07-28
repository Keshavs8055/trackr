import { credentialService } from '../credential-service';
import { providerManager } from '../provider-manager';
import { SecureCrypto } from '@/lib/secure-crypto';
import { PROVIDERS } from '@/types';

async function runProviderCredentialsTests() {
  console.log("Running Provider Platform & Secure Credentials Unit Tests...");

  const userId = 'mock-user-security-id';
  const testKey = 'test_omdb_secret_key_12345';

  // 1. Validate Web Crypto AES-GCM 256-bit encryption
  const encrypted = await SecureCrypto.encryptApiKey(testKey, userId);
  console.assert(encrypted.startsWith('enc:v2:'), "Test Failed: Encrypted payload should start with enc:v2:");
  console.assert(!encrypted.includes(testKey), "Test Failed: Encrypted string must NOT contain plaintext key!");

  const decrypted = await SecureCrypto.decryptApiKey(encrypted, userId);
  console.assert(decrypted === testKey, "Test Failed: Decrypted key should match original test key");

  // 2. Register and check Gemini Provider
  const gemini = providerManager.getProvider(PROVIDERS.GEMINI);
  console.assert(gemini.name === 'gemini', "Test Failed: Provider name should be gemini");
  console.assert(gemini.capabilities.supportsAI === true, "Test Failed: Gemini should support AI");
  console.assert(gemini.capabilities.supportsCredentials === true, "Test Failed: Gemini should support BYOK credentials");

  // 3. Test Health Tracking & Cooldown
  const healthInitial = providerManager.getHealth('omdb');
  console.assert(healthInitial.consecutiveFailures === 0, "Test Failed: Initial failures should be 0");

  providerManager.recordRequest('omdb');
  providerManager.recordError('omdb', 'Mock rate limit error 1');
  providerManager.recordError('omdb', 'Mock rate limit error 2');
  providerManager.recordError('omdb', 'Mock rate limit error 3');

  const healthError = providerManager.getHealth('omdb');
  console.assert(healthError.consecutiveFailures === 3, "Test Failed: Should have 3 consecutive failures");
  console.assert(healthError.isCoolingDown === true, "Test Failed: Should enter cooling down state after 3 failures");

  providerManager.recordSuccess('omdb');
  const healthSuccess = providerManager.getHealth('omdb');
  console.assert(healthSuccess.consecutiveFailures === 0, "Test Failed: Consecutive failures should reset to 0 after success");
  console.assert(healthSuccess.isCoolingDown === false, "Test Failed: Cooldown should end on success");

  // 4. Test Connection Diagnostic logic
  const testRes = await providerManager.testConnection('manual');
  console.assert(testRes.success === true, "Test Failed: Manual provider test should always succeed");

  console.log("✅ Provider Platform & Secure Credentials Unit Tests Passed!");
}

runProviderCredentialsTests().catch((err) => {
  console.error("❌ Provider Credentials Unit Tests Failed:", err);
  process.exit(1);
});
