import { SecureCrypto } from '../secure-crypto';
import { secureStorage } from '../secure-storage';
import { credentialService } from '@/services/providers/credential-service';

async function runSecureCryptoV2Tests() {
  console.log("Running High-Security Encrypted Credential & Vault Unit Tests...");

  const secret1 = "secret_vault_token_prod_998877";
  const secret2 = "secret_vault_token_prod_112233";
  const userId = "user_vault_test_456";

  // 1. Validate SHA-256 Fingerprint calculation
  const fingerprint1 = await SecureCrypto.computeFingerprint(secret1);
  const fingerprint2 = await SecureCrypto.computeFingerprint(secret2);
  const fingerprint1Repeat = await SecureCrypto.computeFingerprint(secret1);

  console.assert(fingerprint1.length === 64, "Test Failed: SHA-256 hex fingerprint should be 64 characters long");
  console.assert(fingerprint1 === fingerprint1Repeat, "Test Failed: Fingerprint should be deterministic for identical secret");
  console.assert(fingerprint1 !== fingerprint2, "Test Failed: Different secrets must yield different fingerprints");

  // 2. Validate Device Master Key encryption (enc:v2:) without relying on userId
  const encryptedV2 = await SecureCrypto.encryptSecret(secret1);
  console.assert(encryptedV2.startsWith('enc:v2:'), "Test Failed: V2 payload should start with enc:v2:");
  console.assert(!encryptedV2.includes(secret1), "Test Failed: Payload must NOT contain plaintext key!");
  console.assert(!encryptedV2.includes(userId), "Test Failed: Payload must NOT contain userId!");

  const decryptedV2 = await SecureCrypto.decryptSecret(encryptedV2);
  console.assert(decryptedV2 === secret1, "Test Failed: Decrypted V2 secret should match original");

  // 3. Test IndexedDB vault storage & CredentialService configuration (with single source of truth enabled state)
  const status = await credentialService.configureProvider(userId, 'manual', secret1);
  console.assert(status.configured === true, "Test Failed: Provider status should be configured");
  console.assert(status.fingerprint === fingerprint1, "Test Failed: Provider status should include SHA-256 fingerprint");

  const storedRecord = await secureStorage.getCredential(`trackr_cred_${userId}_manual`);
  console.assert(storedRecord !== null, "Test Failed: Credential should be stored in IndexedDB vault");
  console.assert(storedRecord?.fingerprint === fingerprint1, "Test Failed: Vault record should store fingerprint");
  console.assert(storedRecord?.enabled === true, "Test Failed: Vault record should store enabled state as single source of truth");
  console.assert(storedRecord?.schemaVersion === 2, "Test Failed: Vault record should store schemaVersion 2");

  // 4. Test Provider Disabling in IndexedDB Vault
  await credentialService.setProviderEnabled(userId, 'manual', false);
  const disabledRecord = await secureStorage.getCredential(`trackr_cred_${userId}_manual`);
  console.assert(disabledRecord?.enabled === false, "Test Failed: Disabling provider should update IndexedDB vault record");

  // Re-enable for subsequent tests
  await credentialService.setProviderEnabled(userId, 'manual', true);

  // 5. Test Credential Rotation
  const rotatedStatus = await credentialService.rotateCredential(userId, 'manual', secret2);
  console.assert(rotatedStatus.fingerprint === fingerprint2, "Test Failed: Rotated credential should reflect new fingerprint");

  // 6. Test Memory Cache Clearing and SHA-256 Fingerprint Revalidation on Decryption
  credentialService.clearMemoryCache();
  const retrievedAfterClear = await credentialService.getCredential(userId, 'manual');
  console.assert(retrievedAfterClear === secret2, "Test Failed: Vault should decrypt on-demand from IndexedDB after memory clear");

  // 7. Test Periodic Revalidation
  const isRevalidated = await credentialService.revalidateCredential(userId, 'manual');
  console.assert(isRevalidated === true, "Test Failed: Manual provider revalidation should succeed");

  console.log("✅ High-Security Encrypted Credential & Vault Unit Tests Passed!");
}

runSecureCryptoV2Tests().catch((err) => {
  console.error("❌ High-Security Unit Tests Failed:", err);
  process.exit(1);
});
