# Graph data contracts

## Canonical artifacts

- `entities.parquet`
- `relationships.parquet`
- `communities.parquet`
- `community_reports.parquet`
- `text_units.parquet`

JSON files beside them are derived presentation artifacts. Conversion must be deterministic and tolerate an artifact that has not been produced yet during live indexing.

## Change impact

When adding, renaming, or removing a graph field, inspect all of:

- `lib/server/converters.ts`
- `app/api/data/[name]/route.ts`
- `lib/graphData.ts`
- `components/GraphVisualizer.tsx`
- `components/Inspector.tsx`
- `components/ChatPanel.tsx` and chat routes when relevant

Entity and relationship identifiers must remain stable within one published build. Partial build output must never replace the last successful project unless publication succeeds.
