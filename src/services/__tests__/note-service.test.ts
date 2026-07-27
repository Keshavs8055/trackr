import { NoteService } from '../note-service';

async function runNoteServiceTests() {
  console.log("Running NoteService & Wiki-Link Parser Unit Tests...");

  const noteService = NoteService.getInstance();
  const userId = 'mock-user-id';
  const resourceId1 = `res_book_${Date.now()}`;

  // 1. Wiki Link Parsing
  const testContent = "Reading this book after watching [[Dune Part 2]] and reading [[Hyperion]].";
  const extractedLinks = noteService.parseWikiLinks(testContent);

  console.assert(extractedLinks.length === 2, `Test Failed: Expected 2 links, got ${extractedLinks.length}`);
  console.assert(extractedLinks.includes('Dune Part 2'), "Test Failed: Link 'Dune Part 2' missing");
  console.assert(extractedLinks.includes('Hyperion'), "Test Failed: Link 'Hyperion' missing");

  // 2. Note Creation
  const newNote = await noteService.addNote(userId, resourceId1, "Chapter 1 Insights", testContent);
  console.assert(newNote.title === "Chapter 1 Insights", "Test Failed: Title mismatch");
  console.assert(newNote.wikiLinks?.length === 2, "Test Failed: Wiki links were not persisted");

  // 3. Fetch Notes for Resource
  const notes = await noteService.getNotes(userId, resourceId1);
  console.assert(notes.length >= 1, `Test Failed: Expected at least 1 note, got ${notes.length}`);

  // 4. Backlinks Discovery
  const backlinks = await noteService.findBacklinks(userId, 'Dune Part 2');
  console.assert(backlinks.length >= 1, `Test Failed: Expected at least 1 backlink for 'Dune Part 2', got ${backlinks.length}`);
  console.assert(backlinks[0].resourceId === resourceId1, "Test Failed: Backlink resourceId mismatch");

  console.log("✅ NoteService & Wiki-Link Parser Unit Tests Passed!");
}

runNoteServiceTests().catch((err) => {
  console.error("❌ NoteService Unit Tests Failed:", err);
  process.exit(1);
});
