# Trackr (Archive V2) - Comprehensive Implementation Plan & Prompts

## 1. System Overview & Roadmap Strategy

Trackr is an offline-first, generic, provider-agnostic personal resource management platform built with Next.js 16+ (App Router), React 19, Firebase Firestore, `@tanstack/react-query`, `zustand`, and Tailwind CSS v4.

This plan details the transition from initial provider infrastructure into a feature-rich, high-polish product across **12 distinct phases**. Each phase is broken down into actionable, sequential steps complete with **copy-paste prompts** that you can use to direct implementation step-by-step.

---

## 2. Phase Index & Roadmap Summary

- [x] **Phase 2.5 — Architecture Prep**: Core Resource & ProviderMetadata Separation
- [x] **Phase 2.6 — Domain Layer**: Separation of Business Logic (`src/domain/resource/`), Validation/Factories, & Domain Events (`EventBus`)
- [x] **Phase 2.7 — Metadata Normalization**: Typed Metadata Models (`MovieMetadata`, `BookMetadata`), Provider Adapters (`OMDbAdapter`, `OpenLibraryAdapter`, `GithubAdapter`), & `SearchIndexBuilder`
- [x] **Phase 3 — Resource Experience**: Type-Specific UI Cards (`movie-details-card`, `book-details-card`, `github-details-card`, `website-details-card`), Poster Image Shimmer Loading (`resource-image-poster`), Watch Runtime & Book Pages Stats Calculation, Legacy Archive Removal, Inline Quick-Add Provider Suggestions, and Firestore `addDoc` Undefined Value Sanitation.
- [x] **Phase 4 — Search & Discovery**: Global Multi-Field Search, Search Index Cache, Advanced Filters (`advanced-filter-drawer.tsx`) & Saved Views (`saved-searches-bar.tsx`)
- [x] **Phase 5 — Collections Engine**: Dynamic & Smart Rule Collections (`collection-service.ts`, `evaluateSmartCollectionRules`, `CollectionBuilderModal`, `CollectionGrid`, `CollectionDetailView`)
- [x] **Phase 6 — Pure Tag-Based Status Tracking**: Typed Lifecycle Statuses, Tag Normalization (`#planto`, `#currentlyreading`, `#completed`), & Provider Capabilities Matrix (Single-resource progress meters removed)
- [x] **Phase 7 — Activity & Event Log**: Event-Sourced Timelines, History & Analytics
- [x] **Phase 8 — Advanced Notes System**: Multi-Notes, Markdown & Internal Wiki-Links (`[[Title]]`)
- [x] **Pre-Phase 9 Audit — Tag Normalization & Link Integration**: Reserved Tag Normalization (`normalizeTag`), Plan-To Tag Simplification (`#planto`), Automatic Link Detection (`extractUrl`), and First-Class Link UI Components.
- [x] **Phase 9 — Resource Relationships**: Knowledge Graph & Bi-directional Links (`ResourceRelationship`, `RelationshipService`, `use-relationships.ts`, `RelationshipSelectorModal`, `RelationshipGraphCard`)
- [x] **Phase 9.5 — Provider Platform & Secure Credentials (BYOK Security Hardening)**: Production BYOK Infrastructure, Web Crypto AES-GCM 256-bit Credential Engine (`CredentialService`), IndexedDB Vault Storage (`secureStorage`), Cryptographic Device Master Keys (`enc:v2:`), SHA-256 Fingerprint Integrity Verification, Single Source of Truth for Provider Enable/Disable in Vault Records (`schemaVersion: 2`), Credential Rotation, Inactivity & Session Memory Cache Clearing, Periodic Revalidation, Provider Capability Matrix & Health Metrics (`ProviderHealth`, `ProviderManager`), Connection Diagnostics, and AI Abstraction Stubs (`BaseAIProvider`, `GeminiProvider`).
- [x] **Phase 9.6 — Status Tag Synchronization & Text-First Priority**: Bidirectional status hashtag mapping (`#planto`, `#wishlist`, `#watching`, `#reading`, `#read`, `#dropped`, `#fav`, `#favorite`), text-first input priority over secondary status dropdowns, tag filter synonym matching, and clean edit mode UI in `ResourceDetails`.
- [x] **Codebase Audit & Refactor Pass**: Elimination of dead/unused code (`loading-state`, `empty-state`, `input.tsx`), component deduplication (`ConnectionStatus`), React memoization optimizations (`ResourceImagePoster`, `StatusBadge`), Domain Adapter integration (`MetadataService`), and code quality standardization.
- [x] **Phase 10 — Content-First AI Layer & Intelligence Engine**: On-demand AI header menu (`AIActionPopover`), Auto-Tagging with archive taxonomy reuse & user tag freedom (`AutoTagModal`), internal archive similarity search (`SimilarResourcesModal`), natural language archive search (`AICommandModal`), BYOK security, token efficiency warnings, and complete removal of low-value inline summary widgets.
- [ ] **Phase 11 — Scalability, Virtualization & Extension Architecture**: Virtualized Feeds, IndexedDB Caching, Plugin Adapter Architecture

---

## Step-by-Step Milestones & Copy-Paste Prompts

---

### Milestone 1: Phase 2.5 — Core Resource vs. ProviderMetadata Separation
*(COMPLETED)*

Decouple provider metadata from core user-owned resource properties (`title`, `notes`, `tags`, `status`, `image`). Encapsulate external provider metadata into a clean `providerMetadata` sub-object.

---

### Milestone 1.5: Phase 2.6 — Domain Layer & Event System
*(COMPLETED)*

Separate business logic from persistence services by introducing a pure domain layer in `src/domain/*`.

---

### Milestone 1.6: Phase 2.7 — Typed Metadata Models, Provider Adapters & Search Index
*(COMPLETED)*

Replace generic `Record<string, unknown>` metadata dictionaries with strongly-typed domain metadata models (`MovieMetadata`, `BookMetadata`, `GithubMetadata`, `WebsiteMetadata`). Introduce Provider Adapters to convert raw provider responses into normalized metadata. Add an indexed text field (`searchIndex`) to resources for high-performance search filtering.

---

### Milestone 2: Phase 3 — Resource Experience
*(COMPLETED)*

Build type-specific visual cards (`movie-details-card`, `book-details-card`, `github-details-card`, `website-details-card`), lazy cover poster loading (`resource-image-poster`), runtime/page count stats calculation (`resource-stats-bar`), and Firestore `addDoc` undefined payload sanitation.

---

### Milestone 3: Phase 4 — Search & Discovery
*(COMPLETED)*

Global multi-field search, multi-select chip filters (`advanced-filter-drawer.tsx`), and saved filter presets (`saved-searches-bar.tsx`).

---

### Milestone 4: Phase 5 — Collections Engine
*(COMPLETED)*

Dynamic & smart rule-based collections (`collection-service.ts`), rule evaluator engine (`evaluateSmartCollectionRules`), `CollectionBuilderModal`, `CollectionGrid`, and `CollectionDetailView`.

---

### Milestone 5: Phase 6 — Typed Status, Dedicated Progress & Provider Capabilities

#### Goal
Implement strongly-typed lifecycle status transitions per resource type, separate progress tracking into a dedicated `ResourceProgress` model (`current`, `total`, `unit`, `percentage`), and establish an explicit Provider Capabilities matrix where providers declare supported features (`search`, `metadata`, `refresh`, `images`, `auth`).

#### Files Affected / Created
- `src/types/index.ts` (Add `ResourceProgress`, `ProviderCapabilities`)
- `src/domain/status/status-lifecycles.ts`
- `src/domain/progress/progress-calculator.ts`
- `src/providers/provider-capabilities.ts`
- `src/components/resources/status-badge.tsx`
- `src/components/resources/progress-tracker.tsx`
- `src/components/resource-card.tsx`
- `src/components/resource-details.tsx`

#### Copy-Paste Prompt 6.1: Status Lifecycles, Progress Model & Provider Capabilities Matrix
```text
Build typed lifecycle status models, dedicated progress tracking, and provider capabilities declarations.

1. Progress & Status Schemas (`src/types/index.ts` & `src/domain/`):
   - Add `ResourceProgress` interface: `{ current: number; total?: number; unit: 'pages' | 'minutes' | 'episodes' | 'percent' | 'items'; percentage: number; lastUpdated: number }`.
   - Create `src/domain/status/status-lifecycles.ts`: Type-specific status workflows (e.g., Movie: `wishlist` | `planned` | `watching` | `completed` | `dropped`; Book: `wishlist` | `planned` | `reading` | `completed` | `dropped`).
   - Create `src/domain/progress/progress-calculator.ts`: Helper functions to calculate completion percentage and remaining metrics.

2. Provider Capabilities Matrix (`src/providers/provider-capabilities.ts`):
   - Define `ProviderCapability` flags: `canSearch`, `canFetchMetadata`, `canRefresh`, `hasPosterImages`, `requiresAuthKey`.
   - Map capabilities to each provider (`OMDbProvider`, `OpenLibraryProvider`, `GithubProvider`, `ManualProvider`).

3. UI Components (`src/components/resources/`):
   - `status-badge.tsx`: Interactive lifecycle status transition button & dropdown badge.
   - `progress-tracker.tsx`: Progress bar and numeric input (e.g., "Page 140 of 320" or "45 min of 120 min") with quick +10 / completion buttons.
   - Integrate into `resource-card.tsx` and `resource-details.tsx`.
```

---

### Milestone 6: Phase 7 — Activity & Event Log System

#### Goal
Build an event-sourced activity log (`resources/{id}/activities`) consuming Domain Events (`ResourceCreated`, `StatusChanged`, `ProgressUpdated`, `MetadataRefreshed`) to present chronological activity timelines and analytics.

#### Files Affected / Created
- `src/types/index.ts` (Define `ResourceActivity`)
- `src/services/activity-service.ts`
- `src/components/activity/activity-timeline.tsx`
- `src/components/activity/user-activity-feed.tsx`
- `src/components/resource-details.tsx`

#### Copy-Paste Prompt 7.1: Event-Sourced Activity Log & Timeline UI
```text
Build the Activity Event Log system for granular tracking and resource update history.

1. Define `ResourceActivity` in `src/types/index.ts`:
   - `id`: string, `userId`: string, `resourceId`: string
   - `action`: 'created' | 'status_changed' | 'rated' | 'progress_updated' | 'note_added' | 'metadata_refreshed' | 'relationship_added'
   - `payload`: Record<string, unknown> (e.g. `{ oldStatus: 'planned', newStatus: 'in_progress' }`)
   - `timestamp`: number

2. Create `src/services/activity-service.ts`:
   - `logActivity(activity)`: Logs events to Firestore `resources/{resourceId}/activities`.
   - Subscribe `activity-service` to domain events from `EventBus`.
   - `getResourceActivities(resourceId)`: Fetches chronological activity timeline for a resource.

3. Build UI Components:
   - `activity-timeline.tsx`: Render a visual vertical timeline inside `resource-details.tsx`.
   - `user-activity-feed.tsx`: Global activity feed for dashboard showing recent user interactions.
```

---

### Milestone 7: Phase 8 — Advanced Notes & Knowledge Engine

#### Goal
Expand resource notes into a rich Markdown editor with multi-note support per resource (`ResourceNote`), image attachments, internal wiki links (`[[Resource Title]]`), and automatic backlink detection.

#### Files Affected / Created
- `src/types/index.ts` (Add `ResourceNote` model)
- `src/services/note-service.ts`
- `src/components/notes/markdown-editor.tsx`
- `src/components/notes/wiki-link-autocomplete.tsx`
- `src/components/notes/resource-notes-tab.tsx`
- `src/components/resource-details.tsx`

#### Copy-Paste Prompt 8.1: Multi-Note & Wiki-Link Markdown Engine
```text
Implement multi-note support and wiki-style internal linking (`[[Title]]`) for resources.

1. Schema & Service (`src/types/index.ts` & `src/services/note-service.ts`):
   - Define `ResourceNote`: `{ id, resourceId, userId, title, content, format: 'markdown', createdAt, updatedAt }`.
   - Store notes in Firestore subcollection `resources/{resourceId}/notes`.
   - Provide helper `parseWikiLinks(content)` to detect `[[Resource Name]]` patterns.

2. Components (`src/components/notes/`):
   - `markdown-editor.tsx`: Clean Markdown editor with live preview toggle, formatting toolbar (bold, italic, code block, checklist), and `[[Title]]` autocompletion popup.
   - `wiki-link-autocomplete.tsx`: Shows search popup when user types `[[` in notes to pick from existing resources.
   - `resource-notes-tab.tsx`: Tab inside `resource-details.tsx` showing all notes, backlinks (other resources referencing this resource), and quick note creation.
```

---

### Milestone 8: Phase 9 — Resource Relationships (Knowledge Graph)

#### Goal
Transform Trackr into a connected knowledge graph by linking resources (e.g., Book → Movie adaptation, Course → Repo, Sequel relationships, Book → Author).

#### Files Affected / Created
- `src/types/index.ts` (Define `ResourceRelationship`)
- `src/services/relationship-service.ts`
- `src/components/relationships/relationship-selector-modal.tsx`
- `src/components/relationships/relationship-graph-card.tsx`
- `src/components/resource-details.tsx`

#### Copy-Paste Prompt 9.1: Resource Relationships Data Layer & UI
```text
Build the Resource Relationship system to connect resources into a knowledge graph.

1. Add `ResourceRelationship` in `src/types/index.ts`:
   - `id`: string, `userId`: string, `sourceResourceId`: string, `targetResourceId`: string
   - `type`: 'adaptation_of' | 'sequel_to' | 'prequel_to' | 'repository_for' | 'article_for' | 'author_of' | 'related_to'
   - `notes`?: string, `createdAt`: number

2. Create `src/services/relationship-service.ts`:
   - Firestore subcollection or top-level `relationships` collection.
   - `addRelationship(rel)`, `removeRelationship(id)`, `getRelationshipsForResource(resourceId)`.

3. Create `src/components/relationships/`:
   - `relationship-selector-modal.tsx`: Modal to pick target resource and select relationship type.
   - `relationship-graph-card.tsx`: Display linked cards with badges directly inside `resource-details.tsx`.
```

---

### Milestone 9: [/] Phase 10 — AI Layer & Intelligence Engine (In Progress / Testing Pending)


#### Goal
Integrate an AI service layer (Gemini API) to provide semantic search, similarity recommendations, automatic tag generation, note summarization, and natural language queries.

#### Files Affected / Created
- `src/services/ai-service.ts`
- `src/hooks/use-ai-assistant.ts`
- `src/components/ai/ai-command-modal.tsx`
- `src/components/ai/similar-resources-card.tsx`
- `src/app/api/ai/route.ts`

#### Copy-Paste Prompt 10.1: AI Service Integration & Smart Tools
```text
Implement the AI Layer in `src/services/ai-service.ts` and UI tools using the Gemini API.

1. API & Service (`src/app/api/ai/route.ts` & `src/services/ai-service.ts`):
   - Secure server-side route calling Gemini API.
   - Capabilities: `generateAutoTags`, `summarizeResource`, `findSimilarResources`, `naturalLanguageQuery`.

2. UI Components (`src/components/ai/`):
   - `ai-command-modal.tsx`: Interactive AI prompt modal (cmd+k / ai button) for natural language queries and insights.
   - `similar-resources-card.tsx`: Display "Recommended / Similar items in your archive" card inside resource details.
```

- **[COMPLETED] BYOK Provider Integration & Key Flow Verification**:
  - Dynamically resolved and passed credentials from secure client-side IndexedDB vaults on the fly to external providers (OMDb, OpenLibrary) for both search and detail-enrichment fetches.
  - Implemented full metadata retrieval and database persistence during Quick Add provider matching.
  - Integrated custom error handling and UI notifications block inside the command drawer if metadata enrichment fails.

---

### Milestone 10: Phase 11 — Scalability, Virtualization & Extension Architecture

#### Goal
Optimize Trackr for large user libraries (10,000+ resources) with windowed list virtualization, IndexedDB client caching, and a modular plugin adapter architecture for third-party provider integrations.

#### Files Affected / Created
- `src/cache/indexed-db-cache.ts`
- `src/components/virtualized-resource-feed.tsx`
- `src/domain/plugins/plugin-registry.ts`
- `src/domain/plugins/plugin-adapter.interface.ts`

#### Copy-Paste Prompt 11.1: Virtualization, Caching & Plugin Architecture
```text
Implement scalability optimizations and a extensible plugin architecture.

1. List Virtualization (`src/components/virtualized-resource-feed.tsx`):
   - Integrate windowing/virtualization (e.g., `@tanstack/react-virtual` or `react-window`) into the main resource feed to render large datasets smoothly.

2. Client-side IndexedDB Caching (`src/cache/indexed-db-cache.ts`):
   - Add IndexedDB storage for offline resource caching and fast instantaneous cold start hydration.

3. Plugin Adapter Architecture (`src/domain/plugins/`):
   - Create `plugin-registry.ts` and `plugin-adapter.interface.ts` allowing dynamic registration of third-party provider adapters at runtime.
```

---

## 3. Recommended Implementation Order

1. **Phase 2.5, 2.6 & 2.7 (Architecture, Domain & Metadata Normalization)** — Establishes pure domain logic, typed metadata models, provider adapters, search indexing, and domain event dispatching.
2. **Phase 3, Phase 4 & Phase 5 (Resource Experience, Search & Collections)** — *(COMPLETED)* High-impact cards, search drawer, poster shimmer, and smart collections.
3. **Phase 6 (Status & Progress)** — Typed status lifecycles, dedicated progress model (`current`/`total`/`unit`), and provider capabilities matrix.
4. **Phase 7 (Activity Log)** — Event-sourced activity timeline consuming Domain Events.
5. **Phase 8 (Notes Engine)** — Multi-note markdown editor with `[[Wiki-Links]]`.
6. **Phase 9 (Relationships)** — Resource knowledge graph.
7. **Phase 10 (AI Layer)** — Gemini API natural language search, auto-tagging, and recommendations.
8. **Phase 11 (Scalability & Plugins)** — List virtualization, IndexedDB caching, and plugin architecture.
