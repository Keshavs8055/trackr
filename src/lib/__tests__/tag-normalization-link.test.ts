import { normalizeTag, extractTags, cleanTitle, extractUrl } from '../parser';
import { RESERVED_TYPE_TAGS, RESOURCE_TYPES } from '@/types';
import { ResourceFactory } from '@/domain/resource/resource-factory';

async function runTagNormalizationAndLinkTests() {
  console.log("Running Tag Normalization & Link Resource Unit Tests...");

  // 1. Singular/Plural Reserved Tag Normalization
  console.assert(normalizeTag('#movies') === 'movie', "Test Failed: #movies should normalize to movie");
  console.assert(normalizeTag('books') === 'book', "Test Failed: books should normalize to book");
  console.assert(normalizeTag('#articles') === 'article', "Test Failed: #articles should normalize to article");
  console.assert(normalizeTag('shows') === 'tv', "Test Failed: shows should normalize to tv");
  console.assert(normalizeTag('#repos') === 'github', "Test Failed: #repos should normalize to github");
  console.assert(normalizeTag('#podcasts') === 'podcast', "Test Failed: #podcasts should normalize to podcast");

  // 2. Plan-To Tags Simplification
  console.assert(normalizeTag('#plantowatch') === 'planto', "Test Failed: #plantowatch should normalize to planto");
  console.assert(normalizeTag('plantoread') === 'planto', "Test Failed: plantoread should normalize to planto");
  console.assert(normalizeTag('#plan-to-check') === 'planto', "Test Failed: #plan-to-check should normalize to planto");
  console.assert(normalizeTag('#planto') === 'planto', "Test Failed: #planto should remain planto");

  // 3. Status Tag Normalization
  console.assert(normalizeTag('#watched') === 'completed', "Test Failed: #watched should normalize to completed");
  console.assert(normalizeTag('#over') === 'completed', "Test Failed: #over should normalize to completed");
  console.assert(normalizeTag('#finished') === 'completed', "Test Failed: #finished should normalize to completed");
  console.assert(normalizeTag('#read') === 'completed', "Test Failed: #read should normalize to completed");
  console.assert(normalizeTag('currentlyreading') === 'in-progress', "Test Failed: currentlyreading should normalize to in-progress");

  // 3. Type Inference from Normalized Tags
  const extractedTags = extractTags("Dune #movies #plantowatch");
  console.assert(extractedTags.includes('movie'), "Test Failed: extractedTags should contain normalized 'movie'");
  console.assert(extractedTags.includes('planto'), "Test Failed: extractedTags should contain normalized 'planto'");
  console.assert(RESERVED_TYPE_TAGS[extractedTags[0]] === RESOURCE_TYPES.MOVIE, "Test Failed: Type inference for 'movie' tag should be MOVIE");

  // 4. URL Extraction & Link Resource Creation
  const rawUrlInput = "https://github.com/facebook/react #react #planto";
  const urlMatch = extractUrl(rawUrlInput);
  console.assert(urlMatch === "https://github.com/facebook/react", `Test Failed: Expected URL match, got ${urlMatch}`);

  const title = cleanTitle(rawUrlInput);
  console.assert(title === "github.com/facebook/react", `Test Failed: Expected formatted title 'github.com/facebook/react', got '${title}'`);

  const resource = ResourceFactory.createResource({
    userId: 'test-user',
    title,
    tags: extractTags(rawUrlInput),
    rawInput: rawUrlInput,
  });

  console.assert(resource.url === "https://github.com/facebook/react", "Test Failed: Resource url field should be populated");
  console.assert(resource.tags.includes('link'), "Test Failed: Link resource should automatically receive 'link' tag");
  console.assert(resource.tags.includes('planto'), "Test Failed: Resource tags should contain 'planto'");
  console.assert(resource.type === RESOURCE_TYPES.GITHUB, "Test Failed: github.com URL should resolve type to GITHUB");

  console.log("✅ Tag Normalization & Link Resource Unit Tests Passed!");
}

runTagNormalizationAndLinkTests().catch((err) => {
  console.error("❌ Unit Tests Failed:", err);
  process.exit(1);
});
