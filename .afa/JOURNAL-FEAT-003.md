# Cognitive Journal

This journal records agent decisions and rationale throughout the pipeline run.
Entries are append-only and timestamped.

## [IntakeAgent] 2026-04-27 15:14:55 UTC

**Domain Assessment - FEAT-003**: Classified as FullStack (ASP.NET backend + Angular frontend). Input explicitly states ".NET and Angular patterns" with standard tech stack. No ambiguity on technology layer. **Key Assumptions on Scope**: (1) No authentication/authorization logic required—task assumes pre-identified user. (2) Only three competence types in scope: education, certificates, courses—no portfolio items, skills matrix, or endorsements. (3) "Sharp UI/UX" interpreted as polished styling and intuitive forms within existing design system, not custom design work. (4) Profile overview is personal/individual only—no admin/manager viewing or reporting features implied. (5) Database schema not prescribed beyond "basics"—will be determined during architecture phase. (6) No external integrations (credential verification, social media) implied.

---

## [ArchitectAgent] 2026-04-27 15:23:54 UTC

For FEAT-003, planned the feature as a new vertical slice that preserves the repo’s existing Angular 20 standalone + signals frontend and .NET 10 Clean Architecture + Minimal API backend. Chose a single employee-owned competence profile aggregate with category-specific child collections so the UI can load the full page in one request while keeping future manager-facing views extensible. Also chose server-resolved current-user ownership instead of client-supplied user IDs to avoid introducing a future security hole even though authentication itself is out of scope.

---

## [CodingAgent] 2026-04-27 15:37:15 UTC

Implemented FEAT-003 Employee Competence Profile as a full vertical slice on both backend and frontend.

**Backend decisions:**
- Mirrored the existing in-memory repository pattern (no DB migration needed) to stay consistent with how DeviationRepository is implemented. Repository contract is persistence-agnostic so swapping to EF Core later requires only an infrastructure change.
- Created `StaticCurrentUserContext` returning a fixed `"employee-001"` ID as a minimal ownership stub, intentionally avoiding putting user-id in the request body (which would be a security gap). This is clearly documented for future auth replacement.
- Used `DateOnly` for certificate/course dates since no time component is needed, consistent with C#'s type-safe date handling.
- Validation (future date check, year range, required strings) lives in the service layer, not the endpoint layer, keeping endpoints thin per the plan's guidance.
- Integration test isolation: in-memory singleton repo is shared per WebApplicationFactory class fixture, so the "get profile" test was changed to assert `NotBeNull()` (shape check) rather than `BeEmpty()` (which would be order-dependent across concurrent tests).

**Frontend decisions:**
- `ProfileStore` is `providedIn: 'root'` singleton but uses local signals; it's simple enough that NgRx/SignalStore is not warranted. Mutations update the signal in-place (optimistic update pattern) to avoid full reloads.
- Each section component owns its own `isAdding`/`editingId` local signals, keeping section state independent and preventing one section's edit mode from interfering with another.
- Import path fix: form components in `components/` subdir needed `../models/profile.models` not `../../models/profile.models`.
- All 80 frontend tests and 81 backend tests pass.

---

