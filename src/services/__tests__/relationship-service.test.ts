import { RelationshipService } from '../relationship-service';
import { EventBus } from '@/domain/events/event-bus';

async function runRelationshipServiceTests() {
  console.log("Running RelationshipService Knowledge Graph Unit Tests...");

  const relService = RelationshipService.getInstance();
  const userId = 'mock-user-id';
  const res1 = 'res_dune_book';
  const res2 = 'res_dune_movie';
  const res3 = 'res_dune_part2';

  // 1. Add Relationship
  const rel1 = await relService.addRelationship(
    userId,
    {
      sourceResourceId: res2,
      targetResourceId: res1,
      type: 'adaptation_of',
      notes: '2021 film adaptation of the 1965 novel',
    },
    'Dune (Movie)',
    'Dune (Book)'
  );

  console.assert(rel1.id.startsWith('rel_'), "Test Failed: Relationship ID should start with rel_");
  console.assert(rel1.type === 'adaptation_of', "Test Failed: Type should be adaptation_of");

  // 2. Add Sequel Relationship
  const rel2 = await relService.addRelationship(
    userId,
    {
      sourceResourceId: res3,
      targetResourceId: res2,
      type: 'sequel_to',
      notes: 'Part Two sequel to Part One movie',
    },
    'Dune: Part Two',
    'Dune (Movie)'
  );

  // 3. Query Relationships for res2 (Dune Movie)
  // res2 is source in rel1 (outgoing: res2 -> res1)
  // res2 is target in rel2 (incoming: res3 -> res2)
  const relsForRes2 = await relService.getRelationshipsForResource(userId, res2);

  console.assert(relsForRes2.outgoing.length === 1, `Test Failed: Expected 1 outgoing rel, got ${relsForRes2.outgoing.length}`);
  console.assert(relsForRes2.outgoing[0].targetResourceId === res1, "Test Failed: Outgoing target should be res1 (Dune Book)");

  console.assert(relsForRes2.incoming.length === 1, `Test Failed: Expected 1 incoming rel, got ${relsForRes2.incoming.length}`);
  console.assert(relsForRes2.incoming[0].sourceResourceId === res3, "Test Failed: Incoming source should be res3 (Dune Part Two)");

  console.assert(relsForRes2.all.length === 2, `Test Failed: Expected 2 total relationships for res2, got ${relsForRes2.all.length}`);

  // 4. Remove Relationship
  await relService.removeRelationship(userId, rel1.id);
  const relsAfterDelete = await relService.getRelationshipsForResource(userId, res2);

  console.assert(relsAfterDelete.outgoing.length === 0, "Test Failed: Outgoing relationship should be deleted");
  console.assert(relsAfterDelete.all.length === 1, "Test Failed: Total relationships after deletion should be 1");

  console.log("✅ RelationshipService Knowledge Graph Unit Tests Passed!");
}

runRelationshipServiceTests().catch((err) => {
  console.error("❌ RelationshipService Unit Tests Failed:", err);
  process.exit(1);
});
