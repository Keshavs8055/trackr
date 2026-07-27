# TRACKR V2 - Data & Architecture Migration Guide

## Overview
Trackr V2 transitions the application architecture from an `Item`-centric model to a scalable **`Resource` platform**. This document details the data migration strategy, backward-compatibility measures, condition for deprecating legacy fallbacks, and strict field ownership definitions.

---

## 1. Data Schema Evolution

### Legacy `Item` Schema
```ts
export interface Item {
  id: string;
  userId: string;
  title: string;
  tags: string[];
  rawInput?: string;
  image?: string;
  notes?: string;
  archived?: boolean;
  createdAt: number;
  updatedAt: number;
}
```

### V2 `Resource` Schema
```ts
export interface Resource {
  id: string;
  userId: string;
  title: string;
  type: ResourceType; // 'movie' | 'book' | 'tv' | 'note' | etc.
  provider: ProviderName | string; // 'manual' | 'omdb' | 'openlibrary' | etc.
  providerId?: string;
  status?: string;
  progress?: ResourceProgress; // Dedicated progress model ({ current, total, unit, percentage })
  searchIndex?: string; // Pre-calculated searchable text index
  notes?: string;
  tags: string[];
  metadata: Record<string, unknown>; // Flexible JSON metadata
  providerMetadata?: ResourceProviderMetadata; // Structured Provider sub-object with typed metadata
  metadataVersion?: number;
  metadataSource?: {
    provider: string;
    version: string;
    schemaVersion: number;
  };
  image?: string;
  rawInput?: string;
  createdAt: number;
  updatedAt: number;
  lastSynced?: number;
  providerUpdatedAt?: number;
}
```

---

## 2. Strict Field Ownership Definitions

To prevent accidental overwrites during metadata refresh or future provider migrations, Trackr V2 enforces explicit field boundaries:

### User-Managed Fields (IMMUTABLE on metadata refresh)
* `title` (User custom title or raw input)
* `tags` (User-assigned hashtags)
* `notes` (Personal reflections and thoughts)
* `createdAt` / `updatedAt`
* `rawInput`

### Provider-Managed Fields (UPDATED on manual metadata refresh)
* `metadata` (Lightweight provider dictionary, e.g. director, runtime, ISBN, year, rating)
* `image` (Poster or cover URL)
* `providerUpdatedAt` (Timestamp of provider refresh)
* `metadataVersion` & `metadataSource`
* `lastSynced`

---

## 3. Lazy Firestore Migration Path

Rather than executing a blocking batch script on app start, Trackr V2 uses a **lazy migration strategy** in `src/services/resource-service.ts`:

1. **Primary Collection**: Reads and writes target `users/{uid}/resources`.
2. **Lazy Migration Check**: When fetching resources, if `resources` subcollection is empty AND the local flag `trackr_migrated_resources_${userId}` is missing:
   - Queries legacy `users/{uid}/items` subcollection.
   - Converts each legacy `Item` into a `Resource` by populating default fields:
     - `type` = `RESOURCE_TYPES.NOTE`
     - `provider` = `PROVIDERS.MANUAL`
     - `metadata` = `{}`
   - Batch-writes converted resources to `users/{uid}/resources`.
   - Sets `trackr_migrated_resources_${userId} = "true"` in `localStorage`.
3. **Query Optimization**: On all subsequent loads, `resources` is queried directly without hitting `items`.

---

## 4. Backward Compatibility Wrappers

To avoid breaking existing components during the transition:

- **Type Alias**: `export type Item = Resource;` in `src/types/index.ts`.
- **Hook Alias**: `src/hooks/use-items.ts` re-exports `useResources`, `useAddResource`, `useUpdateResource`, `useDeleteResource` with `@deprecated` docstrings.
- **Component Aliases**: `src/components/item-card.tsx` and `src/components/item-details.tsx` forward props to `ResourceCard` and `ResourceDetails`.

---

## 5. Sunset Conditions (When to Remove Fallbacks)

Legacy compatibility layers (`use-items.ts`, `item-card.tsx`, `item-details.tsx`, and lazy `items` migration code in `resource-service.ts`) can be safely removed when:

1. 100% of active users have logged in and completed the lazy migration pass to the `resources` Firestore collection.
2. All imports across secondary branches/features have been updated from `@/hooks/use-items` to `@/hooks/use-resources`.
3. Database backups of legacy `items` subcollections are completed.
