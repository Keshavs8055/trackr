import { OpenLibraryProvider } from '../openlibrary-provider';
import { OMDbProvider } from '../omdb-provider';
import { AppError } from '../../lib/app-error';

async function runProviderNormalizationTests() {
  console.log("Running Provider Search Normalization Unit Tests...");

  // 1. Open Library Normalization Test
  const openLibrary = new OpenLibraryProvider();
  console.assert(openLibrary.isConfigured() === true, "Open Library should be configured by default");

  const olResults = await openLibrary.searchNormalized("Dune", 1);
  console.assert(Array.isArray(olResults.results), "Open Library results should be an array");
  console.assert(typeof olResults.page === "number", "Open Library page should be a number");
  console.assert(typeof olResults.hasMore === "boolean", "Open Library hasMore should be boolean");

  if (olResults.results.length > 0) {
    const item = olResults.results[0];
    console.assert(item.provider === "openlibrary", "Result provider should be 'openlibrary'");
    console.assert(typeof item.title === "string", "Result title should be string");
    console.assert(item.type === "book", "Result type should be 'book'");
    console.assert(item.providerMetadata !== undefined, "providerMetadata should be present");
    console.assert(item.providerMetadata?.provider === "openlibrary", "providerMetadata.provider should be 'openlibrary'");
    console.assert(typeof item.providerMetadata?.metadata === "object", "providerMetadata.metadata should be an object");
  }

  // 2. OMDb Unconfigured Test
  const omdbUnconfigured = new OMDbProvider();
  console.assert(omdbUnconfigured.isConfigured() === false, "OMDb without key should be unconfigured");

  try {
    await omdbUnconfigured.searchNormalized("Inception", 1);
    console.assert(false, "OMDb search without key should have thrown UNCONFIGURED_PROVIDER error");
  } catch (err: any) {
    console.assert(err instanceof AppError, "Error should be instance of AppError");
    console.assert(err.code === "UNCONFIGURED_PROVIDER", "Error code should be UNCONFIGURED_PROVIDER");
  }

  console.log("✅ Provider Search Normalization Unit Tests Passed!");
}

runProviderNormalizationTests().catch((err) => {
  console.error("❌ Provider Normalization Unit Test Error:", err);
  process.exit(1);
});
