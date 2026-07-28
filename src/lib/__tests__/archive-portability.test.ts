import { archivePortabilityService } from '../../services/archive-portability-service';

if (typeof globalThis.localStorage === 'undefined') {
  const store: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { for (const k in store) delete store[k]; },
  };
}

async function runArchivePortabilityTests() {
  console.log('Running Archive Portability Unit Tests...');

  // 1. Test Export Data Payload
  const payload = await archivePortabilityService.exportArchiveData('mock-user-id');
  if (payload.app !== 'trackr' || payload.version !== '2.0') {
    throw new Error('Export payload header invalid');
  }

  // 2. Secret Stripping Verification
  const jsonString = JSON.stringify(payload);
  if (jsonString.includes('apiKey') || jsonString.includes('secret')) {
    throw new Error('FAILED: API keys or secrets detected in export JSON payload!');
  }

  // 3. Test Import JSON
  const mockImportJSON = JSON.stringify({
    version: '2.0',
    app: 'trackr',
    resources: [
      {
        title: 'Test Import Book',
        type: 'book',
        tags: ['books', 'fav'],
        notes: 'Imported test book notes',
      },
    ],
  });

  const importResult = await archivePortabilityService.importArchiveJSON(mockImportJSON, 'mock-user-id');
  if (!importResult.success || importResult.importedCounts.resources < 1) {
    throw new Error(`Import failed: ${importResult.errors.join(', ')}`);
  }

  console.log('✅ Archive Portability Unit Tests Passed!');
}

runArchivePortabilityTests().catch(err => {
  console.error('❌ Archive Portability Unit Tests Failed:', err);
  process.exit(1);
});
