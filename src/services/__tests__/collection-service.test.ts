import { CollectionService } from '../../services/collection-service';
import { Collection, Resource } from '../../types';

console.log("Running CollectionService Smart Dynamic Rule Unit Tests...");

const mockResources: Resource[] = [
  {
    id: 'res-1',
    userId: 'user-1',
    title: 'The Matrix',
    type: 'movie',
    tags: ['sci-fi', 'classic'],
    createdAt: 1000,
    updatedAt: 1000,
    providerMetadata: {
      provider: 'omdb',
      metadata: { year: 1999, director: 'Wachowskis' }
    }
  },
  {
    id: 'res-2',
    userId: 'user-1',
    title: 'Dune',
    type: 'book',
    tags: ['sci-fi', 'classic'],
    createdAt: 2000,
    updatedAt: 2000,
    providerMetadata: {
      provider: 'openlibrary',
      metadata: { publishYear: 1965, author: 'Frank Herbert' }
    }
  },
  {
    id: 'res-3',
    userId: 'user-1',
    title: 'Clean Code',
    type: 'book',
    tags: ['tech', 'programming'],
    createdAt: 3000,
    updatedAt: 3000,
    providerMetadata: {
      provider: 'openlibrary',
      metadata: { publishYear: 2008 }
    }
  }
];

// Test 1: Dynamic Rule evaluating tag equals sci-fi
const sciFiCollection: Collection = {
  id: 'col-1',
  userId: 'user-1',
  title: 'Sci-Fi Collection',
  resourceIds: [],
  isDynamic: true,
  rules: [
    { field: 'tag', operator: 'equals', value: 'sci-fi' }
  ],
  createdAt: 1000,
  updatedAt: 1000,
};

const sciFiResult = CollectionService.evaluateSmartCollectionRules(sciFiCollection, mockResources);
if (sciFiResult.length !== 2 || !sciFiResult.includes('res-1') || !sciFiResult.includes('res-2')) {
  console.error("❌ Test 1 Failed: Sci-Fi collection failed to match res-1 and res-2", sciFiResult);
  process.exit(1);
}

// Test 2: Dynamic Rule combining type equals movie AND tag equals sci-fi
const movieSciFiCollection: Collection = {
  id: 'col-2',
  userId: 'user-1',
  title: 'Sci-Fi Movies',
  resourceIds: [],
  isDynamic: true,
  rules: [
    { field: 'type', operator: 'equals', value: 'movie' },
    { field: 'tag', operator: 'equals', value: 'sci-fi' }
  ],
  createdAt: 1000,
  updatedAt: 1000,
};

const movieSciFiResult = CollectionService.evaluateSmartCollectionRules(movieSciFiCollection, mockResources);
if (movieSciFiResult.length !== 1 || movieSciFiResult[0] !== 'res-1') {
  console.error("❌ Test 2 Failed: Sci-Fi movies collection failed to isolate res-1", movieSciFiResult);
  process.exit(1);
}

// Test 3: Manual collection fallback
const manualCollection: Collection = {
  id: 'col-3',
  userId: 'user-1',
  title: 'Manual List',
  resourceIds: ['res-3'],
  isDynamic: false,
  createdAt: 1000,
  updatedAt: 1000,
};

const manualResult = CollectionService.evaluateSmartCollectionRules(manualCollection, mockResources);
if (manualResult.length !== 1 || manualResult[0] !== 'res-3') {
  console.error("❌ Test 3 Failed: Manual collection failed to return resourceIds", manualResult);
  process.exit(1);
}

console.log("✅ CollectionService Smart Dynamic Rule Unit Tests Passed!");
