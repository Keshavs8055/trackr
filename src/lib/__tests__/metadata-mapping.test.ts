import { metadataService } from '../../services/providers/metadata-service';
import { Resource, RESOURCE_TYPES } from '../../types';

async function runMetadataMappingTests() {
  console.log("Running Metadata Mapping & User Field Preservation Unit Tests...");

  const mockResource: Resource = {
    id: "res-123",
    userId: "user-1",
    title: "Interstellar (User Custom Title)",
    type: RESOURCE_TYPES.MOVIE,
    provider: "openlibrary", // Using openlibrary as public active provider
    providerId: "OL27448W",
    notes: "My personal reflection note that must NEVER be overwritten",
    tags: ["fav", "sci-fi"],
    metadata: { year: 2014, orig: "old" },
    createdAt: 1000000,
    updatedAt: 1000000,
  };

  const updates = await metadataService.refreshResourceMetadata(mockResource);

  // Assert user-managed fields are not present in updates
  console.assert(!('notes' in updates), "Test Failed: 'notes' should not be in metadata refresh updates");
  console.assert(!('tags' in updates), "Test Failed: 'tags' should not be in metadata refresh updates");
  console.assert(!('title' in updates), "Test Failed: 'title' should not be in metadata refresh updates");


  // Assert provider-managed fields are present
  console.assert(updates.metadataVersion === 1, "Test Failed: metadataVersion should be 1");
  console.assert(updates.metadataSource?.provider === "openlibrary", "Test Failed: metadataSource provider should be openlibrary");
  console.assert(typeof updates.providerUpdatedAt === "number", "Test Failed: providerUpdatedAt should be a timestamp");
  console.assert(typeof updates.lastSynced === "number", "Test Failed: lastSynced should be a timestamp");
  console.assert(updates.providerMetadata !== undefined, "Test Failed: providerMetadata should be defined in updates");
  console.assert(updates.providerMetadata?.provider === "openlibrary", "Test Failed: providerMetadata.provider should be openlibrary");
  console.assert(updates.providerMetadata?.version === 1, "Test Failed: providerMetadata.version should be 1");

  console.log("✅ Metadata Mapping Unit Tests Passed!");
}

runMetadataMappingTests().catch((err) => {
  console.error("❌ Metadata Mapping Unit Test Error:", err);
  process.exit(1);
});
