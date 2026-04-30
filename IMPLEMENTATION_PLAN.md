# IMPLEMENTATION_PLAN

## 1. Overview
Implement standards-based OpenAPI generation for the ASP.NET Core minimal API, expose a stable JSON document plus browser documentation endpoint, and eliminate routing mismatches that currently surface as 404s. The work should keep the existing backend contract intact while adding route aliases only where needed for compatibility. The implementation must also add automated route/documentation regression tests and a written audit of every 404 root cause discovered during remediation.

## 2. Folder structure and files to create

### Create
- `backend/src/Greenfield.Api/Endpoints/OpenApiEndpoints.cs` (create)
- `backend/docs/api-routing-audit.md` (create)
- `backend/tests/Greenfield.Api.IntegrationTests/OpenApi/OpenApiDocumentTests.cs` (create)
- `backend/tests/Greenfield.Api.IntegrationTests/OpenApi/ApiDocumentationUiTests.cs` (create)
- `backend/tests/Greenfield.Api.IntegrationTests/Routing/DocumentedEndpointStatusTests.cs` (create)

### Modify
- `backend/src/Greenfield.Api/Program.cs` (modify)
- `backend/src/Greenfield.Api/Endpoints/HealthEndpoints.cs` (modify)
- `backend/src/Greenfield.Api/Endpoints/DashboardEndpoints.cs` (modify)
- `backend/src/Greenfield.Api/Endpoints/DeviationEndpoints.cs` (modify)
- `backend/src/Greenfield.Api/appsettings.json` (modify)
- `backend/tests/Greenfield.Api.IntegrationTests/Health/HealthEndpointsTests.cs` (modify)
- `backend/tests/Greenfield.Api.IntegrationTests/Deviations/DeviationEndpointRouteTests.cs` (modify)
- `backend/tests/Greenfield.Api.IntegrationTests/Deviations/DeviationEndpointsTests.cs` (modify)
- `bootstrap.sh` (modify)
- `bootstrap.ps1` (modify)

## 2a. Application Shell & Navigation
Not applicable for this backend-only feature. No Angular routed pages, shell navigation, or app-shell links are required for acceptance.

## 2b. Visual Requirements
A visual manifest exists, but this feature does not add frontend UI. Preserve these project-wide UI decisions if any incidental frontend/API-link work is later required:
- CSS custom properties already implied by the manifest should remain the source of truth for app theming:
  - `--color-primary`, `--color-primary-hover`
  - `--color-surface`, `--color-surface-raised`, `--color-surface-subtle`
  - `--color-border`
  - `--color-text-primary`, `--color-text-secondary`, `--color-text-placeholder`
  - `--color-danger`, `--color-warning`, `--color-success`
  - `--color-sidebar-bg`, `--color-topbar-bg`, `--color-button-primary-text`, `--color-button-secondary-bg`, `--color-button-ghost-bg`, `--color-button-ghost-text`
- Component-library direction remains: Angular 20 primitives + Tailwind CSS 4 for layout/styling, `chart.js` + `ng2-charts` for charting, native table/form components unless a later feature proves otherwise.
- Layout strategy remains manifest-aligned: flex-based shell (topbar + sidebar + content), grid for dense forms/tables, mobile collapse at `<768px`, tablet at `768-1024px`, desktop at `>1024px`.
- Visual tokens to preserve project-wide: `Inter, system-ui, -apple-system, sans-serif`, medium border radius, normal spacing scale, light theme as default.
- Do **not** invest effort styling the generated API docs UI to match the app shell; keep it isolated as infrastructure tooling.

## 3. Detailed implementation instructions per file

### `backend/src/Greenfield.Api/Program.cs`
- Keep the current minimal-hosting structure and existing service registrations.
- Replace the anonymous OpenAPI registration with a named document, e.g. `v1`, so the JSON route is deterministic.
- Read title/version defaults from existing `AppSettings` values and apply them to the generated OpenAPI document.
- Stop limiting OpenAPI mapping to `Development` only; the current environment guard is one confirmed cause of documentation 404s.
- Call a new endpoint-mapping extension (`MapOpenApiEndpoints`) before the functional endpoint groups.
- Preserve existing endpoint registration order for business APIs.
- Architectural pattern: composition root only; no handler logic in `Program`.

### `backend/src/Greenfield.Api/Endpoints/OpenApiEndpoints.cs`
- Create a static `OpenApiEndpoints` class following the same endpoint-extension style as the existing API.
- Required public method: `MapOpenApiEndpoints(this IEndpointRouteBuilder app)`.
- Responsibilities:
  - Map the OpenAPI JSON document to a stable path such as `/openapi/{documentName}.json`.
  - Expose a browser-based docs UI at `/api/docs`.
  - If the chosen UI helper only supports its own default route, add a lightweight redirect endpoint from `/api/docs` to that route.
  - Exclude redirect/helper routes from the generated schema.
- Keep docs routes infrastructure-only; no business models should live in this file.

### `backend/src/Greenfield.Api/Endpoints/HealthEndpoints.cs`
- Preserve the existing health payload behavior and 200/503 branching.
- Introduce a canonical `/api/health` route so health follows the same `/api/*` namespace as the rest of the backend.
- Keep `/health` as a backward-compatible alias unless implementation testing proves no caller depends on it.
- Add explicit metadata:
  - `WithName("GetHealth")`
  - `WithSummary(...)`
  - `WithDescription(...)`
  - `Produces(...200...)` and `Produces(...503...)`
  - `WithOpenApi()`
- Root cause to document in the audit: route prefix inconsistency (`/health` vs `/api/*`) caused proxy/client confusion and 404s for `/api/health` callers.

### `backend/src/Greenfield.Api/Endpoints/DashboardEndpoints.cs`
- Keep `/api/dashboard/summary` as the canonical route.
- Enrich the endpoint with complete OpenAPI metadata: summary, description, operation name, tags, and `Produces<DashboardSummaryDto>(200)`.
- Ensure the response contract in the schema matches the DTO returned by `TypedResults.Ok`.
- No new dashboard routes should be introduced unless testing finds a genuine missing contract route.

### `backend/src/Greenfield.Api/Endpoints/DeviationEndpoints.cs`
- Keep `/api/deviations` as the canonical group prefix.
- Normalize group-root mappings to `string.Empty` instead of `"/"` for collection GET/POST so the documented canonical path is `/api/deviations` rather than a trailing-slash variant.
- Add endpoint metadata to **every** mapped operation:
  - stable `WithName(...)`
  - `WithSummary(...)`
  - `WithDescription(...)`
  - `Produces<T>(...)` / `Produces(...)`
  - `Accepts<T>(...)` for body-based endpoints where helpful
  - `WithOpenApi()`
- Verify that route ordering still keeps `/export` above `/{id:guid}`.
- During remediation, explicitly test all documented deviation routes with valid inputs; if any currently expected consumer path is missing, add a backward-compatible alias rather than silently changing the contract.
- Root causes to watch for in the audit:
  - missing OpenAPI metadata causing inaccurate docs,
  - possible canonical-path ambiguity for group-root routes,
  - any verb/path mismatch discovered during integration testing.

### `backend/src/Greenfield.Api/appsettings.json`
- Add an `OpenApi` section for stable document configuration, e.g. document name, JSON route, and UI route.
- Keep defaults environment-agnostic so local/test environments do not hide docs.
- Do not add auth/security settings here; that is outside scope.

### `backend/docs/api-routing-audit.md`
- Create a plain markdown audit artifact with a table containing:
  - endpoint/path,
  - HTTP verb,
  - before-fix observed result,
  - root cause,
  - remediation,
  - after-fix expected status,
  - automated test that covers it.
- Seed the document with the confirmed baseline issues:
  - docs JSON unavailable outside Development,
  - no browser docs UI route,
  - `/api/health` missing while `/health` exists.
- Extend the document with any additional 404 findings discovered while implementing deviation/dashboard route verification.

### `backend/tests/Greenfield.Api.IntegrationTests/OpenApi/OpenApiDocumentTests.cs`
- Create `OpenApiDocumentTests` using `WebApplicationFactory<Program>`.
- Required assertions:
  - `GET /openapi/v1.json` returns 200 and JSON.
  - document contains the expected OpenAPI version and `info` fields.
  - document includes `/api/health`, `/api/dashboard/summary`, and the full deviation route set.
  - each operation exposes the expected HTTP verb, operationId/name, tags, and response codes.
- Add schema assertions only for contracts already surfaced by the API; do not snapshot the entire document blindly.

### `backend/tests/Greenfield.Api.IntegrationTests/OpenApi/ApiDocumentationUiTests.cs`
- Create `ApiDocumentationUiTests`.
- Required assertions:
  - `/api/docs` returns a successful HTML response or an expected redirect to the actual UI endpoint.
  - the UI references the generated OpenAPI JSON route.
  - the docs endpoint no longer returns 404 in the default integration-test environment.

### `backend/tests/Greenfield.Api.IntegrationTests/Routing/DocumentedEndpointStatusTests.cs`
- Create a route-smoke test suite that verifies every documented endpoint can be called with valid parameters and does **not** return 404.
- Use seeded data where possible; when no seeded ID is available, create a deviation first and reuse its identifier through the test flow.
- Cover at minimum:
  - `GET /api/health`
  - `GET /api/dashboard/summary`
  - `GET /api/deviations`
  - `GET /api/deviations/export`
  - `GET /api/deviations/{id}`
  - `PUT /api/deviations/{id}`
  - `POST /api/deviations/{id}/transition`
  - `GET /api/deviations/{id}/timeline`
  - `POST /api/deviations/{id}/comments`
  - attachment endpoints with a valid seeded or created deviation
- Assert intended status codes for valid inputs, not just non-404.

### `backend/tests/Greenfield.Api.IntegrationTests/Health/HealthEndpointsTests.cs`
- Extend the existing suite to verify the canonical `/api/health` route.
- If `/health` is retained as an alias, add an alias-regression assertion so future cleanup does not accidentally break legacy callers.
- Keep payload-shape and enum-string assertions.

### `backend/tests/Greenfield.Api.IntegrationTests/Deviations/DeviationEndpointRouteTests.cs`
- Keep the current list-route regression purpose, but update it to reflect the canonical non-trailing-slash route.
- Add route assertions for `/api/deviations/export` and any alias path introduced during remediation.
- Ensure the tests fail clearly on routing regressions rather than on business validation failures.

### `backend/tests/Greenfield.Api.IntegrationTests/Deviations/DeviationEndpointsTests.cs`
- Add or adjust happy-path integration tests for deviation operations that previously masked routing problems.
- Ensure tests create/use valid IDs and payloads so failures identify routing issues, not invalid request bodies.
- Prefer scenario-based coverage over duplicating all assertions from the new route-smoke suite.

### `bootstrap.sh`
- Keep the script focused on local environment setup.
- Ensure it restores `backend/Greenfield.sln` and installs frontend dependencies exactly as today.
- Update the post-setup output so it prints the documentation URLs (`/api/docs`, `/openapi/v1.json`) and the recommended verification test command for the integration suite.
- Preserve the note about using the Angular proxy so `/api/*` routes remain unchanged end-to-end.

### `bootstrap.ps1`
- Mirror the shell-script behavior and output.
- Print the same docs URLs and verification commands as the POSIX script.
- Keep command checks for `dotnet` and `npm`.

## 4. Dependencies
- **NuGet (existing, keep pinned):**
  - `Microsoft.AspNetCore.OpenApi` `10.0.7` in `backend/src/Greenfield.Api/Greenfield.Api.csproj`
  - `Microsoft.AspNetCore.Mvc.Testing` `10.0.7` in `backend/tests/Greenfield.Api.IntegrationTests/Greenfield.Api.IntegrationTests.csproj`
  - `xunit` `2.9.3` in `backend/tests/Greenfield.Api.IntegrationTests/Greenfield.Api.IntegrationTests.csproj`
  - `FluentAssertions` `7.2.0` in `backend/tests/Greenfield.Api.IntegrationTests/Greenfield.Api.IntegrationTests.csproj`
- **NuGet additions:** none required if the .NET 10 built-in OpenAPI JSON + UI mapping APIs compile successfully.
- **npm:** no package changes required for this feature.

## 5. Automated tests
Create or modify the following test files:
- `backend/tests/Greenfield.Api.IntegrationTests/OpenApi/OpenApiDocumentTests.cs` (create)
- `backend/tests/Greenfield.Api.IntegrationTests/OpenApi/ApiDocumentationUiTests.cs` (create)
- `backend/tests/Greenfield.Api.IntegrationTests/Routing/DocumentedEndpointStatusTests.cs` (create)
- `backend/tests/Greenfield.Api.IntegrationTests/Health/HealthEndpointsTests.cs` (modify)
- `backend/tests/Greenfield.Api.IntegrationTests/Deviations/DeviationEndpointRouteTests.cs` (modify)
- `backend/tests/Greenfield.Api.IntegrationTests/Deviations/DeviationEndpointsTests.cs` (modify)

Coverage goals:
- OpenAPI JSON endpoint availability and schema validity.
- Browser documentation endpoint availability.
- Route metadata parity: documented paths/verbs/operationIds must match mapped endpoints.
- Non-404 verification for every documented endpoint when called with valid parameters.
- Backward-compatibility verification for any alias retained to avoid breaking callers.

## 6. Acceptance criteria
- **AC1 — OpenAPI/Swagger Documentation Generated**  
  Fulfilled by named OpenAPI generation in `Program.cs`, endpoint-level metadata in the minimal API mappings, and `OpenApiDocumentTests` validating the produced schema.
- **AC2 — Documentation Endpoint Available**  
  Fulfilled by `OpenApiEndpoints.cs` exposing the JSON document and browser UI at stable routes, plus integration tests proving `/api/docs` is reachable.
- **AC3 — 404 Errors Resolved**  
  Fulfilled by normalizing misconfigured routes (confirmed `/api/health`, docs-only-in-development issue, and any additional mismatches found during implementation) and by the `DocumentedEndpointStatusTests` suite asserting expected non-404 behavior for valid requests.
- **AC4 — Documentation Reflects Reality**  
  Fulfilled by attaching summaries, tags, operation names, request/response metadata, and by tests comparing the generated document to the actual mapped routes.
- **AC5 — Routing Issues Identified**  
  Fulfilled by `backend/docs/api-routing-audit.md`, which must record each before/after 404 finding, its root cause, remediation, and the automated test covering it.

## 7. Bootstrap scripts
- Update `bootstrap.sh` and `bootstrap.ps1` to:
  - restore backend dependencies with `dotnet restore backend/Greenfield.sln`,
  - install frontend dependencies in `frontend/`,
  - print backend startup instructions,
  - print frontend startup instructions,
  - print API docs URLs:
    - `http://localhost:5000/api/docs`
    - `http://localhost:5000/openapi/v1.json`
  - print a verification command such as:
    - `dotnet test backend/tests/Greenfield.Api.IntegrationTests/Greenfield.Api.IntegrationTests.csproj`
- Do not auto-run tests from bootstrap; keep bootstrap fast and idempotent.

### 7a. Frontend Contract Updates
No frontend source-file updates are required for this plan. The backend changes are documentation exposure and backward-compatible routing normalization only; the Angular proxy already forwards `/api/*` requests unchanged.
---
### Operator Architectural Decisions
The following decisions were made by the operator during plan review
and **must be treated as authoritative constraints** by CodingAgent:

- **How should /api/docs be served?** → Lightweight redirect to helper UI route _(decided by slack at 2026-04-30 15:42:56Z)_
- **Should /health remain after adding /api/health?** → Keep both routes _(decided by auto at 2026-04-30 15:42:56Z)_
- **How should deviation collection-root paths be handled?** → Canonical /api/deviations only _(decided by slack at 2026-04-30 15:42:56Z)_
