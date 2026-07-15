# Roadmap

## v1.0 — MVP (Current)

**Goal:** Working single-elimination kata bracket builder with persistence.

### Completed

- [x] Bracket engine (generation, seeding, BYEs, advancement, cascade undo)
- [x] Interactive bracket view with winner selection
- [x] Competitor management (add, edit, remove, bulk add)
- [x] Random draw and manual draw (drag-and-drop)
- [x] Bracket preview (BYE count, round structure)
- [x] Champion determination
- [x] Tournament and category creation forms

### Remaining

- [ ] Supabase database integration (schema, RLS policies)
- [ ] API route handlers (tournaments, categories, competitors, bracket, matches)
- [ ] PIN-based authentication
- [ ] Wire tournament list page to database
- [ ] Wire tournament dashboard to database
- [ ] Wire bracket page to use BracketView
- [ ] Wire public bracket page to use BracketView (read-only)
- [ ] Form validation with zod
- [ ] Error boundaries
- [ ] Loading states

## v1.1 — Repechage

**Goal:** Support repechage format for double-elimination-style brackets.

- [ ] Repechage bracket engine module
- [ ] Repechage-specific UI components
- [ ] Updated bracket view for repechage display

## v1.2 — Round Robin

**Goal:** Support round-robin group stages.

- [ ] Round-robin engine module
- [ ] Round-robin table component
- [ ] Group-to-knockout transition

## v1.3 — Group Stage + Knockout

**Goal:** Combined group stage followed by knockout rounds.

- [ ] Group stage engine module
- [ ] Group standings display
- [ ] Group-to-bracket qualification logic

## v2.0 — Kumite

**Goal:** Support kumite (sparring) tournaments with score tracking.

- [ ] Score tracking logic in bracket engine
- [ ] Score input UI with timer integration
- [ ] Kumite-specific rules (ippon, waza-ari, etc.)

## Future Considerations

- Mobile app (React Native) using the same bracket engine
- Multi-language support (i18n)
- Tournament templates
- Export bracket as PDF/image
- spectator mode with real-time updates
- Tournament statistics and analytics
