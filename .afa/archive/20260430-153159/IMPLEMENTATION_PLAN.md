# IMPLEMENTATION_PLAN

## 1. Overview
The local-development 404 is most likely caused by the Angular dev proxy stripping the `/api` prefix before forwarding requests to the ASP.NET Core minimal API.
The backend already exposes the deviations route under `/api/deviations`, so the fix should preserve that prefix in development instead of changing the server contract.
Implementation should therefore focus on proxy alignment, regression coverage for the minimal API route, and repeatable local setup scripts.
No new business behavior, endpoint shape, or UI workflow is required.

## 2. Folder structure and files to create
- `frontend/proxy.conf.json` (modify)
- `backend/tests/Greenfield.Api.IntegrationTests/Deviations/DeviationEndpointRouteTests.cs` (create)
- `bootstrap.sh` (create)
- `bootstrap.ps1` (create)

## 2a. Application Shell & Navigation
No routed page, menu, sidebar, header, breadcrumb, guard, or redirect changes are required for this bug fix.
The existing deviations UI should continue to call the API through `environment.apiBaseUrl = '/api'`, and the current application shell (topbar + sidebar layout) remains unchanged.
Users will continue reaching the feature through the existing deviations navigation; this work only restores the backing API call in local development.

## 2b. Visual Requirements
No visual files need to change for this bug fix, but any incidental UI touch must preserve the manifest-driven design system:
- CSS custom properties to preserve:
  - `--color-primary: oklch(0.55 0.18 250)`
  - `--color-sidebar: oklch(0.17 0.025 265)`
  - `--color-success: <manifest success token>`
  - `--color-warning: <manifest warning token>`
  - `--color-danger: <manifest danger token>`
- Component/library alignment:
  - Angular 20 application shell remains the host framework.
  - Tailwind CSS v4 remains the styling system.
  - `chart.js` + `ng2-charts` remain the selected charting libraries for deviations dashboards.
- Layout strategy:
  - Preserve the flex-column root layout.
  - Preserve the flex-row shell split between sidebar navigation and main content.
  - Preserve responsive behavior by stacking secondary controls/cards at smaller breakpoints instead of introducing a new layout system.
- Global visual tokens:
  - Do not introduce a new font stack or radius system for this fix.
  - Continue using the existing Tailwind spacing scale and current application typography conventions.

## 3. Detailed implementation instructions per file

### `frontend/proxy.conf.json`
- Keep a single top-level `/api` proxy rule targeting `http://localhost:5000`.
- Remove the `pathRewrite` block that currently rewrites `^/api` to an empty string.
- Retain `secure: false` and `changeOrigin: true` unless the current local backend hosting changes.
- Keep logging enabled (`info` is sufficient) so proxy behavior stays diagnosable during local debugging.
- Architectural rule: the frontend must keep calling `/api/...`; the dev proxy should bridge origin differences only, not mutate the public API path.

### `backend/tests/Greenfield.Api.IntegrationTests/Deviations/DeviationEndpointRouteTests.cs`
- Create an xUnit integration test class named `DeviationEndpointRouteTests`.
- Follow the existing API integration-test convention in the repo: use `WebApplicationFactory<Program>` (or the project’s existing custom factory if one already wraps it) and issue real HTTP requests through `HttpClient`.
- Required test methods:
  - `GetDeviations_ReturnsSuccessStatusCode()`
  - `GetDeviations_ReturnsApplicationJson()`
  - `GetDeviations_ReturnsArrayPayload_WhenNoFilterIsProvided()`
- Request path must be `/api/deviations`.
- Assertions should validate:
  - non-404 success response (`200 OK` preferred)
  - `Content-Type` of `application/json`
  - body shape is a JSON array, allowing either populated results or an empty array
- Architectural rule: this test is a contract/regression test for the public API surface, so it must not mock the endpoint layer and must exercise the real minimal API route registration.

### `bootstrap.sh`
- Create a POSIX shell bootstrap script for macOS/Linux.
- Script structure should include:
  - strict mode (`set -euo pipefail`)
  - a small command-check helper for `dotnet` and `npm`
  - backend restore step: `dotnet restore backend/Greenfield.sln`
  - frontend dependency step: `cd frontend && npm install`
  - optional verification step: print the commands to run backend and frontend locally
- The script should document that Angular local development must be started with the proxy-enabled `npm start` script so `/api` is preserved and forwarded correctly.

### `bootstrap.ps1`
- Create a PowerShell bootstrap script for Windows.
- Script structure should include:
  - `$ErrorActionPreference = 'Stop'`
  - command checks for `dotnet` and `npm`
  - backend restore step: `dotnet restore backend/Greenfield.sln`
  - frontend dependency step: `npm install` inside `frontend`
  - final output showing how to start the backend and frontend after bootstrap completes
- Architectural rule: keep the PowerShell script functionally equivalent to `bootstrap.sh` so onboarding behavior is consistent across platforms.

## 4. Dependencies
No new dependencies are required for this fix.
Retain the existing toolchain/package set:

### Backend / NuGet
- `Microsoft.AspNetCore.OpenApi` `10.0.7`
- `Microsoft.AspNetCore.Mvc.Testing` `10.0.7`
- `Microsoft.NET.Test.Sdk` `17.13.0`
- `xunit` `2.9.3`
- `FluentAssertions` `7.2.0`
- `coverlet.collector` `6.0.4`
- `Moq` `4.20.72`

### Frontend / npm
- `@angular/animations` `^20.0.0`
- `@angular/common` `^20.0.0`
- `@angular/compiler` `^20.0.0`
- `@angular/core` `^20.0.0`
- `@angular/forms` `^20.0.0`
- `@angular/platform-browser` `^20.0.0`
- `@angular/router` `^20.0.0`
- `@angular/build` `^20.0.0`
- `@angular/cli` `^20.0.0`
- `@angular/compiler-cli` `^20.0.0`
- `chart.js` `^4.4.0`
- `ng2-charts` `^7.0.0`
- `rxjs` `~7.8.0`
- `zone.js` `~0.15.0`
- `tailwindcss` `^4.0.0`
- `typescript` `~5.8.0`

## 5. Automated tests
Files to create or modify:
- `backend/tests/Greenfield.Api.IntegrationTests/Deviations/DeviationEndpointRouteTests.cs` (create)

Coverage required:
- `GET /api/deviations` returns a success status code instead of `404 Not Found`
- the endpoint responds with `application/json`
- the response body is a valid JSON array
- the test remains valid whether the application returns existing deviations or an empty list

No frontend unit test is required for `proxy.conf.json`; the proxy behavior should be validated through local smoke verification after configuration change.

## 6. Acceptance criteria
- **AC-1: GET `/api/deviations` endpoint responds with HTTP 200 (or appropriate success status).**
  - Fulfilled by preserving the `/api` prefix in the Angular proxy and by adding an integration test that exercises the real `/api/deviations` minimal API route.
- **AC-2: Endpoint returns valid response data (or empty list if no deviations exist).**
  - Fulfilled by asserting JSON content and array payload shape in the integration test rather than only checking status.
- **AC-3: Client request to `http://localhost:4200/api/deviations` no longer returns 404.**
  - Fulfilled by removing the dev-proxy rewrite that currently transforms `/api/deviations` into `/deviations`, which does not match the backend contract.

## 7. Bootstrap scripts
Create both scripts in the workspace root.

### `bootstrap.sh`
Responsibilities:
1. Verify `dotnet` and `npm` are installed.
2. Run `dotnet restore backend/Greenfield.sln`.
3. Run `npm install` inside `frontend/`.
4. Print the standard local-start sequence:
   - backend: `dotnet run --project backend/src/Greenfield.Api/Greenfield.Api.csproj`
   - frontend: `cd frontend && npm start`
5. Print a note that the frontend dev server must use `proxy.conf.json` without stripping `/api`.

### `bootstrap.ps1`
Responsibilities:
1. Verify `dotnet` and `npm` are installed.
2. Run `dotnet restore backend/Greenfield.sln`.
3. Run `npm install` inside `frontend/`.
4. Print the same backend/frontend start commands as the shell script.
5. Print the same `/api` proxy note so Windows onboarding matches macOS/Linux behavior.
