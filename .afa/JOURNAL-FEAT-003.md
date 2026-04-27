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

## [QualityAgent] 2026-04-27 15:39:07 UTC

Validated the workspace with actual builds and tests: backend solution built cleanly and all 81 .NET tests passed; frontend installed, built, and all 80 Angular/Vitest tests passed. No lint script was defined, so it was a neutral skip. Runtime verification was not available in the toolset, so the verdict is based on successful build/test execution only.

---

## [ReviewAgent] 2026-04-27 15:46:11 UTC

Rejected because the API is still exposed without authorization boundaries: deviation CRUD endpoints are writable by any caller, and the profile slice uses a fixed static user identity that collapses all users into one ownership bucket. This is acceptable only for a local demo, but unsafe for any multi-user deployment. I also noted medium-risk dependency drift in the Angular/tooling stack, though no known critical vulnerabilities were reported.

---

## [CodingAgent] 2026-04-27 15:55:08 UTC

Security fixes for OWASP A01 Broken Access Control and static identity IDOR risk:

1. DELETED StaticCurrentUserContext — hardcoded "employee-001" shared by all callers. Replaced with HttpContextCurrentUserContext (lives in the Api project, not Infrastructure, because IHttpContextAccessor is an ASP.NET Core abstraction; placing it in the pure Infrastructure class library would require an unnecessary framework reference).

2. CREATED RequireUserIdentityFilter (IEndpointFilter) — checks for X-Employee-Id header or HttpContext.User.Identity.Name. Returns 401 Problem if neither is present. Does not depend on DI injection — reads directly from EndpointFilterInvocationContext.HttpContext to stay stateless.

3. Applied RequireUserIdentityFilter to ALL deviation mutation endpoints (POST/PUT/DELETE) and to the ENTIRE profile endpoint group (including GET, because profile data is inherently per-user and the service layer throws if no identity is available).

4. Registered IHttpContextAccessor via AddHttpContextAccessor() in ServiceCollectionExtensions. Changed ICurrentUserContext registration from AddSingleton to AddScoped — mandatory because the implementation wraps a request-scoped IHttpContextAccessor.

5. CREATED IdentityService (Angular signal-based) defaulting to "employee-001" for demo. CREATED authInterceptor (HttpInterceptorFn) that reads employeeId from IdentityService and injects X-Employee-Id on every outgoing HTTP request. Registered in app.config.ts via provideHttpClient(withInterceptors([authInterceptor])). The interceptor is designed to be swapped for a JWT Bearer interceptor when real auth lands.

6. Updated test factory with CreateAuthenticatedClient(employeeId) helper. Updated all integration test constructors to use authenticated client. Added 7 new 401 tests (3 for deviations, 4 for profile). All 89 backend + 80 frontend tests green.

---

## [QualityAgent] 2026-04-27 15:56:16 UTC

Verified the workspace builds and tests cleanly: backend solution build passed, backend API and application tests passed (89 total), frontend install/build passed, and frontend unit tests passed (80 total). No lint script was defined, so lint was a neutral skip. Runtime verification was not available in this environment.

---

