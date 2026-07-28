import { getStatusConfig, getStatusesForType, getDefaultStatusForType } from '../status/status-lifecycles';
import { RESOURCE_TYPES } from '@/types';

async function runStatusTests() {
  console.log("Running Status Lifecycles Unit Tests...");

  // 1. Test status lifecycles for Book
  const bookStatuses = getStatusesForType(RESOURCE_TYPES.BOOK);
  console.assert(bookStatuses.some(s => s.value === 'reading'), "Test Failed: Book status lifecycle must include 'reading'");
  console.assert(bookStatuses.some(s => s.value === 'completed'), "Test Failed: Book status lifecycle must include 'completed'");

  const defaultBookStatus = getDefaultStatusForType(RESOURCE_TYPES.BOOK);
  console.assert(defaultBookStatus === 'wishlist', `Test Failed: Default book status should be 'wishlist', got '${defaultBookStatus}'`);

  // 2. Test status config lookup
  const statusConfig = getStatusConfig(RESOURCE_TYPES.MOVIE, 'watching');
  console.assert(statusConfig.label === 'Watching', `Test Failed: Movie 'watching' label mismatch, got '${statusConfig.label}'`);

  console.log("✅ Status Lifecycles Unit Tests Passed!");
}

runStatusTests().catch((err) => {
  console.error("❌ Status Unit Tests Failed:", err);
  process.exit(1);
});
