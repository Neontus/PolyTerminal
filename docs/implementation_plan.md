# Refactor Project Structure and Documentation

## Goal Description
Refactor the project to eliminate "bloat" by flattening the directory structure (`apps/frontend` -> `frontend`, `apps/backend` -> `backend`) and consolidating documentation. Ensure run/test instructions are updated and accurate.

## Proposed Changes

### Top Level Structure
#### [DELETE] `frontend` (root)
- Remove the existing incomplete `frontend` directory.

#### [MOVE] `apps/frontend` -> `frontend`
- Move the active frontend application to the root level.
- Ensure `vite` configuration and scripts still work.

#### [MOVE] `apps/backend` -> `backend`
- Move the backend application to the root level.
- Keep dependency on `packages/*` working by updating workspaces.

#### [DELETE] `apps`
- Remove the empty `apps` directory `apps/backend` and `apps/frontend`.

### Configuration
#### [MODIFY] [package.json](file:///Users/junokim/Desktop/Code/PolyTerminal/package.json)
- Update `workspaces` to: `["frontend", "backend", "packages/*"]`.
- Update `scripts` to point to new `frontend` and `backend` locations (e.g. `pnpm --filter frontend dev`).

### Documentation
#### [NEW] `docs/`
- Create a `docs` directory.

#### [MOVE] Spec and Features
- Move `solana-spec.md` -> `docs/solana-spec.md`.
- Move `ONCHAIN_FEATURES.md` -> `docs/ONCHAIN_FEATURES.md`.

#### [MODIFY] [NEXT_STEPS.md](file:///Users/junokim/Desktop/Code/PolyTerminal/NEXT_STEPS.md)
- Update paths (e.g., `cd frontend` instead of `cd apps/frontend` or invalid paths).
- Clarify run instructions.

#### [MODIFY] [README.md](file:///Users/junokim/Desktop/Code/PolyTerminal/README.md)
- Update links to documentation.
- Provide clear "Getting Started" for both Frontend and Program.
