import { ActivityService } from '../activity-service';
import { EventBus } from '@/domain/events/event-bus';

async function runActivityServiceTests() {
  console.log("Running ActivityService & EventBus Integration Unit Tests...");

  const activityService = ActivityService.getInstance();
  const userId = 'mock-user-id';
  const resourceId = `res_test_${Date.now()}`;

  // 1. Direct Activity Logging
  const act1 = await activityService.logActivity(userId, resourceId, 'created', { title: 'Dune Part 2' }, 'Dune Part 2');
  console.assert(act1.action === 'created', "Test Failed: Action should be 'created'");
  console.assert(act1.resourceId === resourceId, "Test Failed: Resource ID mismatch");

  // 2. EventBus Trigger (StatusChanged)
  EventBus.getInstance().publish('StatusChanged', {
    userId,
    resourceId,
    resourceTitle: 'Dune Part 2',
    oldStatus: 'planned',
    newStatus: 'watching',
  });

  // Give EventBus microtask time to settle
  await new Promise(res => setTimeout(res, 50));

  // 3. Fetch Resource Activities
  const activities = await activityService.getResourceActivities(userId, resourceId);
  console.assert(activities.length >= 2, `Test Failed: Expected at least 2 activities, got ${activities.length}`);

  const statusChangeAct = activities.find(a => a.action === 'status_changed');
  console.assert(!!statusChangeAct, "Test Failed: EventBus StatusChanged activity should be automatically logged");
  console.assert(statusChangeAct?.payload?.newStatus === 'watching', "Test Failed: Payload status mismatch");

  console.log("✅ ActivityService & EventBus Integration Unit Tests Passed!");
}

runActivityServiceTests().catch((err) => {
  console.error("❌ ActivityService Unit Tests Failed:", err);
  process.exit(1);
});
