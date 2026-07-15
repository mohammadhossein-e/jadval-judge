# ADR-006: Client-Side State Management with React Hooks

**Status:** Accepted  
**Date:** 2026-07-10  
**Decision Makers:** Project Lead

## Context

The bracket system requires state management for:
- Competitor list (add, edit, remove, reorder)
- Draw state (random order or manual placement)
- Bracket data (generated bracket, match results)
- UI state (selected match, dialog open/close)

## Decision

Use React `useState` and `useCallback`/`useMemo` hooks for all client-side state. No external state management library (Redux, Zustand, Jotai, etc.).

### State Architecture

| State | Location | Mechanism |
|---|---|---|
| Competitor list | `CategoryCompetitorsManager` | `useState<LocalCompetitor[]>` |
| Draw type | `CategoryCompetitorsManager` | `useState<'random' \| 'manual'>` |
| Random draw status | `CategoryCompetitorsManager` | `useState<DrawStatus>` |
| Manual draw status | `CategoryCompetitorsManager` | `useState<PlacementStatus>` |
| Bracket data | `useBracketGeneration` hook | `useState<GenerationResult \| null>` |
| Match resolution | `useMatchResolution` hook | `useState<EngineBracket \| null>` |
| Selected match | `CategoryCompetitorsManager` | `useState<string \| null>` |

### Hook Pattern

Custom hooks encapsulate bracket engine interactions:
- `useBracketGeneration` — wraps `generateBracket()` and `getBracketPreview()`
- `useMatchResolution` — wraps `resolveMatch()`, `cascadeUndo()`, `isBracketComplete()`, `getChampion()`
- `useRandomDraw` — wraps `performDraw()`
- `useManualDraw` — manages slot placement state

## Consequences

### Positive

- No external dependencies for state management
- Simple mental model (state in component, lifted to parent when shared)
- Natural React patterns (immutable updates, memoization)
- Easy to test with `renderHook`

### Negative

- State can only be shared by lifting to parent components
- No persistence (state lost on page refresh)
- Complex state logic lives in components rather than independent stores

### Mitigation

- Supabase integration will add persistence
- State is organized into focused hooks to keep components clean
