# AI Development Rules

This document defines the permanent development standards for the Karate Tournament Bracket Builder project. Every contribution — human or AI — must follow these rules.

---

## Development Principles

- Write production-ready code only.
- Prefer readability over clever code.
- Keep business logic separate from UI.
- Avoid duplicated code.
- Use reusable components whenever possible.
- Follow SOLID principles where appropriate.
- Keep the project modular.
- Every new feature must be scalable.
- Use strict TypeScript.
- Prefer composition over inheritance.
- Keep files small and focused.
- Do not introduce unnecessary dependencies.
- Use clear and consistent naming conventions.
- Do not break existing functionality when adding new features.
- Document important architectural decisions before implementation.

---

## How AI Should Contribute

When AI assists with development on this project, it must adhere to the following workflow:

### 1. Think Before Writing Code

Before generating any code, AI must:

- Understand the existing architecture and file structure.
- Read relevant existing files to understand conventions and patterns.
- Identify whether the requested feature affects multiple parts of the codebase.
- Consider edge cases and failure scenarios.

### 2. Respect the Architecture

- Business logic must live in the bracket engine package, not in UI components.
- UI components must be presentational or state-managing only — they must not contain domain rules.
- Database queries and data access must be isolated from both UI and business logic.
- When adding a new feature, place it in the correct layer of the architecture.

### 3. Preserve Existing Code

- Never modify existing functionality without being asked to.
- When refactoring, ensure all existing tests still pass.
- When adding a new function alongside an existing one, do not alter the existing function's signature or behavior.
- If a bug fix requires changing a function's behavior, document the change and verify no downstream code depends on the old behavior.

### 4. Write Clean, Strict TypeScript

- Use explicit return types on exported functions.
- Avoid `any` — use `unknown` and narrow with type guards when necessary.
- Prefer interfaces over type aliases for object shapes that may be extended.
- Use discriminated unions for state machines and variant types.
- Name variables and functions descriptively — a reader should understand purpose without a comment.

### 5. Keep Components Reusable and Focused

- Each component should do one thing well.
- Accept data via props, emit events upward — do not reach into external state from presentational components.
- Design component APIs that are easy to extend without modification.
- Extract shared UI patterns into reusable components early.

### 6. Test the Business Logic

- Bracket engine functions must have unit tests covering:
  - All bracket sizes (2, 4, 8, 16, 32, 64, 128)
  - Edge cases (minimum competitors, exact power-of-2 counts, odd counts)
  - BYE distribution correctness
  - Seeding pattern accuracy
  - Cascade undo consistency
- UI components should have integration tests for critical user flows.
- AI must run existing tests before and after changes to verify nothing breaks.

### 7. Document Before Implementing

- If AI identifies an architectural decision that was not previously discussed, it must raise it before writing code.
- If a feature has ambiguity, AI must ask for clarification rather than making assumptions.
- AI should suggest improvements to the PRD or architecture docs when it identifies gaps.

### 8. Avoid Over-Engineering

- Do not add abstractions until they are needed — YAGNI applies.
- Do not create utility functions for single-use cases.
- Do not add configuration options for scenarios that do not exist yet.
- Keep the simplest working solution as the baseline.

### 9. Maintain Consistency

- Follow the existing code style in the file being edited.
- Match import ordering, formatting, and naming patterns of the surrounding code.
- Use the same error handling patterns across the codebase.
- If a pattern does not exist yet, propose one before introducing it.

### 10. Verify Before Delivering

- AI must run `typecheck` and `lint` commands after every code change.
- AI must not introduce new TypeScript errors or lint warnings.
- If a change requires a database migration, AI must generate the migration and verify it.
- AI must summarize what was changed and why at the end of every task.
