import { getStatusConfig, getStatusesForType, getDefaultStatusForType } from '../status/status-lifecycles';
import { calculateProgress, getDefaultProgressUnit, updateResourceProgress } from '../progress/progress-calculator';
import { Resource, RESOURCE_TYPES } from '@/types';

async function runStatusProgressTests() {
  console.log("Running Status Lifecycles & Progress Calculator Unit Tests...");

  // 1. Test status lifecycles for Book
  const bookStatuses = getStatusesForType(RESOURCE_TYPES.BOOK);
  console.assert(bookStatuses.some(s => s.value === 'reading'), "Test Failed: Book status lifecycle must include 'reading'");
  console.assert(bookStatuses.some(s => s.value === 'completed'), "Test Failed: Book status lifecycle must include 'completed'");

  const defaultBookStatus = getDefaultStatusForType(RESOURCE_TYPES.BOOK);
  console.assert(defaultBookStatus === 'wishlist', `Test Failed: Default book status should be 'wishlist', got '${defaultBookStatus}'`);

  // 2. Test status config lookup
  const statusConfig = getStatusConfig(RESOURCE_TYPES.MOVIE, 'watching');
  console.assert(statusConfig.label === 'Watching', `Test Failed: Movie 'watching' label mismatch, got '${statusConfig.label}'`);

  // 3. Test default progress units
  console.assert(getDefaultProgressUnit(RESOURCE_TYPES.BOOK) === 'pages', "Test Failed: Book progress unit must be 'pages'");
  console.assert(getDefaultProgressUnit(RESOURCE_TYPES.MOVIE) === 'minutes', "Test Failed: Movie progress unit must be 'minutes'");
  console.assert(getDefaultProgressUnit(RESOURCE_TYPES.COURSE) === 'episodes', "Test Failed: Course progress unit must be 'episodes'");
  console.assert(getDefaultProgressUnit(RESOURCE_TYPES.ARTICLE) === 'percent', "Test Failed: Article progress unit must be 'percent'");

  // 4. Test calculateProgress percentage calculation & clamping
  const progress1 = calculateProgress(150, 300, 'pages');
  console.assert(progress1.percentage === 50, `Test Failed: 150/300 pages should be 50%, got ${progress1.percentage}%`);

  const progressOver = calculateProgress(400, 300, 'pages');
  console.assert(progressOver.percentage === 100, `Test Failed: Clamped percentage should not exceed 100%, got ${progressOver.percentage}%`);

  // 5. Test updateResourceProgress auto-completion trigger
  const sampleResource: Resource = {
    id: 'res_123',
    userId: 'user_1',
    title: 'Dune',
    type: RESOURCE_TYPES.BOOK,
    status: 'reading',
    tags: ['sci-fi'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const updatesPartial = updateResourceProgress(sampleResource, 500, 500, 'pages');
  console.assert(updatesPartial.progress?.percentage === 100, "Test Failed: Progress percentage should be 100%");
  console.assert(updatesPartial.status === 'completed', `Test Failed: 100% progress should auto-transition status to 'completed', got '${updatesPartial.status}'`);

  console.log("✅ Status Lifecycles & Progress Calculator Unit Tests Passed!");
}

runStatusProgressTests().catch((err) => {
  console.error("❌ Status & Progress Unit Tests Failed:", err);
  process.exit(1);
});
