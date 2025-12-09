# Email Client

A Gmail-like email client using **React 19**, **Next.js 15 App Router**, and **Parallel Routes**.

## Tech Stack

Next.js 15 | React 19 | Drizzle ORM | SQLite | Jotai | React Query | MUI v7 | Zod | TypeScript

## What This Demonstrates

- **Parallel Routes** — Independent panels that update without affecting each other
- **Server Components** — Data fetching at the edge, hydrated to client
- **Async Route Params** — React 19's Promise-based params/searchParams
- **Split-view UX** — Gmail-like layout with list + detail panes
- **Full-text Search** — SQLite FTS5 with debounced input
- **Multi-instance UI** — Multiple composers managed via Jotai atoms
- **Type-safe Stack** — Drizzle ORM + Zod validation end-to-end

## React 19 & Next.js 15 Highlights

### Parallel Routes

Split-view UI using `@list` and `@thread` slots that render independently:

```
src/app/
├── layout.tsx          # Consumes both slots
├── @list/              # Email list (always visible)
│   └── default.tsx
└── @thread/            # Thread view (dynamic)
    ├── default.tsx     # "Select an email" fallback
    └── thread/[threadId]/
        └── page.tsx
```

Each slot has its own loading states and can update without affecting the other.

### Server Components + Client Hydration

Server Components fetch initial data, pass it to Client Components for hydration:

```tsx
// Server Component (page.tsx)
const emails = await emailService.getEmails(params);
return <EmailListClient initialData={emails} />;

// Client Component uses React Query with initialData
useQuery({ queryKey: [...], initialData });
```

## Architecture Decisions

| Area             | Choice           | Rationale                                                                                    |
| ---------------- | ---------------- | -------------------------------------------------------------------------------------------- |
| **State**        | Jotai            | Primitive atoms prevent re-rendering all composers when one updates                          |
| **Server State** | React Query      | Cache management, background refetch, optimistic updates                                     |
| **Database**     | Drizzle + SQLite | Type-safe queries, zero config, portable                                                     |
| **Search**       | FTS5             | Inverted index vs LIKE's O(n) table scan; supports ranking, prefix search, boolean operators |
| **Validation**   | Zod v4           | Runtime type safety, schema inference                                                        |

## Database Design

### Index Strategy

Indexes are designed around actual query patterns:

```ts
// Single-column indexes for WHERE clauses
index('thread_id_idx').on(table.threadId),
index('is_deleted_idx').on(table.isDeleted),

// Composite indexes for filtered + sorted queries
index('filter_idx').on(table.isDeleted, table.direction, table.createdAt),
index('important_filter_idx').on(table.isDeleted, table.isImportant, table.createdAt),
index('thread_agg_idx').on(table.threadId, table.createdAt),
```

### FTS5 Search with Graceful Fallback

Search uses a two-tier strategy:

1. **FTS5** (primary): Inverted index with prefix matching (`term*`), O(1) lookup
2. **LIKE** (fallback): If FTS table doesn't exist, falls back to `%term%` patterns

### Thread-Grouped Queries

Email list view shows one email per thread (latest). This uses CTEs for clarity:

```sql
WITH
  filtered AS (SELECT * FROM emails WHERE ...),
  ranked AS (
    SELECT *, ROW_NUMBER() OVER (
      PARTITION BY thread_id ORDER BY created_at DESC
    ) as rn FROM filtered
  ),
  latest_per_thread AS (SELECT * FROM ranked WHERE rn = 1)
SELECT * FROM latest_per_thread ORDER BY created_at DESC
```

Thread importance is computed globally (any non-deleted email marked important makes the thread important).

### Other Decisions

- **Soft deletes**: `isDeleted` flag preserves data, enables trash/restore.

## Project Structure

```
src/
├── app/
│   ├── @list/           # Parallel route: email list
│   ├── @thread/         # Parallel route: thread view
│   └── api/emails/      # REST endpoints
├── components/          # Shared UI components
├── hooks/               # Custom hooks (useEmails, useSendEmail, etc.)
├── store/               # Jotai atoms (composer state)
├── services/            # Business logic (emailService)
└── lib/
    ├── schema.ts        # Drizzle schema
    └── validations/     # Zod schemas
```

## Installation

### Prerequisites

- **Node.js** 20.x or higher
- **npm** 10.x or higher

### Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/samuelfarkas/nextjs-email-client
   cd nextjs-email-client 
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Initialize the database**

   This creates the SQLite database, runs migrations, and seeds sample data:

   ```bash
   npm run db:init
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Open the app**

   Navigate to [http://localhost:3000](http://localhost:3000)

### Database Commands

| Command              | Description                        |
| -------------------- | ---------------------------------- |
| `npm run db:init`    | Run migrations + seed sample data  |
| `npm run db:migrate` | Run database migrations only       |
| `npm run db:seed`    | Seed/re-seed sample data           |
| `npm run db:push`    | Push schema changes (development)  |

## Scripts

| Command           | Description              |
| ----------------- | ------------------------ |
| `npm run dev`     | Start development server |
| `npm run build`   | Production build         |
| `npm test`        | Run all tests            |
| `npm run db:seed` | Re-seed sample data      |
| `npm run lint`    | ESLint check             |

## Testing

Tests use **in-memory SQLite databases** for isolation. Each Jest worker gets its own database instance, enabling parallel test execution without race conditions. Drizzle migrations are applied automatically in `beforeAll`.
