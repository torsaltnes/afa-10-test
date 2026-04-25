# IMPLEMENTATION_PLAN.md

## 1. Overview
Initialize a greenfield full-stack baseline with a Clean Architecture .NET 10 Web API under `backend/` and an Angular standalone application under `frontend/`.
The backend exposes a thin `GET /api/health` controller implemented with C# primary constructors and a minimal application/infrastructure split.
The frontend bootstraps with `bootstrapApplication`, uses standalone components only, and manages UI state with Angular Signals.
The scope stays intentionally small: no database, authentication, routing, or feature modules.

## 2. Folder structure and files to create
```text
.gitignore                                                                      (create)
global.json                                                                     (create)

backend/GreenfieldArchitecture.sln                                              (create)
backend/Directory.Build.props                                                   (create)
backend/Directory.Packages.props                                                (create)

backend/src/Core/Greenfield.Domain/Greenfield.Domain.csproj                     (create)
backend/src/Core/Greenfield.Domain/AssemblyReference.cs                         (create)

backend/src/Core/Greenfield.Application/Greenfield.Application.csproj           (create)
backend/src/Core/Greenfield.Application/DependencyInjection.cs                  (create)
backend/src/Core/Greenfield.Application/Abstractions/Health/IHealthCheckService.cs (create)
backend/src/Core/Greenfield.Application/Health/HealthCheckResult.cs             (create)

backend/src/Infrastructure/Greenfield.Infrastructure/Greenfield.Infrastructure.csproj (create)
backend/src/Infrastructure/Greenfield.Infrastructure/DependencyInjection.cs      (create)
backend/src/Infrastructure/Greenfield.Infrastructure/Services/SystemHealthCheckService.cs (create)

backend/src/Api/Greenfield.Api/Greenfield.Api.csproj                            (create)
backend/src/Api/Greenfield.Api/Program.cs                                       (create)
backend/src/Api/Greenfield.Api/appsettings.json                                 (create)
backend/src/Api/Greenfield.Api/appsettings.Development.json                     (create)
backend/src/Api/Greenfield.Api/Properties/launchSettings.json                   (create)
backend/src/Api/Greenfield.Api/Controllers/HealthCheckController.cs             (create)
backend/src/Api/Greenfield.Api/Contracts/HealthCheckResponse.cs                 (create)

backend/tests/Greenfield.Api.Tests/Greenfield.Api.Tests.csproj                  (create)
backend/tests/Greenfield.Api.Tests/Controllers/HealthCheckControllerTests.cs    (create)
backend/tests/Greenfield.Api.Tests/Endpoints/HealthCheckEndpointTests.cs        (create)
backend/tests/Greenfield.Api.Tests/Services/SystemHealthCheckServiceTests.cs    (create)

frontend/package.json                                                           (create)
frontend/angular.json                                                           (create)
frontend/proxy.conf.json                                                        (create)
frontend/tsconfig.json                                                          (create)
frontend/tsconfig.app.json                                                      (create)
frontend/tsconfig.spec.json                                                     (create)
frontend/src/index.html                                                         (create)
frontend/src/main.ts                                                            (create)
frontend/src/styles.css                                                         (create)
frontend/src/app/app.config.ts                                                  (create)
frontend/src/app/app.component.ts                                               (create)
frontend/src/app/app.component.html                                             (create)
frontend/src/app/app.component.css                                              (create)
frontend/src/app/app.component.spec.ts                                          (create)
frontend/src/app/core/models/health-status.model.ts                             (create)
frontend/src/app/core/services/health-api.service.ts                            (create)
frontend/src/app/core/services/health-api.service.spec.ts                       (create)
frontend/src/app/features/health/health-status.component.ts                     (create)
frontend/src/app/features/health/health-status.component.html                   (create)
frontend/src/app/features/health/health-status.component.css                    (create)
frontend/src/app/features/health/health-status.component.spec.ts                (create)
```

## 3. Detailed implementation instructions per file

### Root files
- `.gitignore`
  - Ignore `backend/**/bin/`, `backend/**/obj/`, `frontend/node_modules/`, `frontend/dist/`, `frontend/.angular/`, `frontend/coverage/`, IDE folders, and OS artifacts.
  - Pattern: single repo-level ignore file only.

- `global.json`
  - Pin the .NET SDK to the .NET 10 SDK band used by the team, e.g. `10.0.100`.
  - Pattern: reproducible SDK selection for local and CI builds.

### Backend solution and shared build configuration
- `backend/GreenfieldArchitecture.sln`
  - Add all backend projects and the test project.
  - Keep references aligned with Clean Architecture boundaries: Api -> Application + Infrastructure; Infrastructure -> Application; Application -> Domain.

- `backend/Directory.Build.props`
  - Centralize shared build properties: `TargetFramework=net10.0`, `Nullable=enable`, `ImplicitUsings=enable`, `LangVersion=preview` or `latest`, `TreatWarningsAsErrors=true`, `EnableNETAnalyzers=true`, `AnalysisLevel=latest`.
  - Pattern: enforce zero-warning builds to support AC-004.

- `backend/Directory.Packages.props`
  - Enable Central Package Management.
  - Declare exact versions from section 4.
  - Pattern: one source of truth for backend package versions.

### Backend domain layer
- `backend/src/Core/Greenfield.Domain/Greenfield.Domain.csproj`
  - SDK-style class library with no external dependencies.
  - Must not reference any other project.

- `backend/src/Core/Greenfield.Domain/AssemblyReference.cs`
  - Class: `AssemblyReference`.
  - No members.
  - Pattern: assembly marker for future domain scanning without introducing domain behavior now.

### Backend application layer
- `backend/src/Core/Greenfield.Application/Greenfield.Application.csproj`
  - SDK-style class library.
  - Reference `Greenfield.Domain`.
  - Add `Microsoft.Extensions.DependencyInjection.Abstractions` for the registration extension.

- `backend/src/Core/Greenfield.Application/DependencyInjection.cs`
  - Static class: `DependencyInjection`.
  - Method: `IServiceCollection AddApplication(this IServiceCollection services)`.
  - Return `services` unchanged for now.
  - Pattern: layer-owned DI extension, no infrastructure knowledge.

- `backend/src/Core/Greenfield.Application/Abstractions/Health/IHealthCheckService.cs`
  - Interface: `IHealthCheckService`.
  - Method: `Task<HealthCheckResult> GetCurrentAsync(CancellationToken cancellationToken)`.
  - Pattern: application abstraction; no ASP.NET Core types.

- `backend/src/Core/Greenfield.Application/Health/HealthCheckResult.cs`
  - Record: `HealthCheckResult`.
  - Properties: `string Status`, `string ApplicationName`, `string Environment`, `DateTimeOffset CheckedAtUtc`.
  - Pattern: immutable application DTO returned by the use-case boundary.

### Backend infrastructure layer
- `backend/src/Infrastructure/Greenfield.Infrastructure/Greenfield.Infrastructure.csproj`
  - SDK-style class library.
  - Reference `Greenfield.Application`.
  - Add `Microsoft.Extensions.DependencyInjection.Abstractions` and `Microsoft.Extensions.Hosting.Abstractions`.

- `backend/src/Infrastructure/Greenfield.Infrastructure/DependencyInjection.cs`
  - Static class: `DependencyInjection`.
  - Method: `IServiceCollection AddInfrastructure(this IServiceCollection services)`.
  - Register `TimeProvider.System` as singleton.
  - Register `IHealthCheckService` to `SystemHealthCheckService` as scoped.
  - Pattern: infrastructure composition only.

- `backend/src/Infrastructure/Greenfield.Infrastructure/Services/SystemHealthCheckService.cs`
  - Class: `SystemHealthCheckService`.
  - Use a primary constructor: `(TimeProvider timeProvider, IHostEnvironment hostEnvironment)`.
  - Implement `IHealthCheckService`.
  - `GetCurrentAsync` returns a healthy baseline payload using `hostEnvironment.ApplicationName`, `hostEnvironment.EnvironmentName`, and `timeProvider.GetUtcNow()`.
  - Pattern: infrastructure adapter; keep all health payload creation here, not in the controller.

### Backend API layer
- `backend/src/Api/Greenfield.Api/Greenfield.Api.csproj`
  - Use `Microsoft.NET.Sdk.Web`.
  - Reference `Greenfield.Application` and `Greenfield.Infrastructure`.
  - Do not add Swagger/OpenAPI packages in this initial slice.

- `backend/src/Api/Greenfield.Api/Program.cs`
  - Use the standard host builder pattern: `var builder = WebApplication.CreateBuilder(args);`.
  - Register `AddControllers()`, `AddApplication()`, and `AddInfrastructure()`.
  - Build the app, call `UseHttpsRedirection()`, and `MapControllers()`.
  - Add `public partial class Program { }` for `WebApplicationFactory` test support.
  - Pattern: composition root only; no endpoint logic in `Program.cs`.

- `backend/src/Api/Greenfield.Api/appsettings.json`
  - Include minimal logging configuration and `AllowedHosts`.
  - No connection strings or feature configuration.

- `backend/src/Api/Greenfield.Api/appsettings.Development.json`
  - Keep development logging slightly more verbose than production.
  - No extra feature flags.

- `backend/src/Api/Greenfield.Api/Properties/launchSettings.json`
  - Define deterministic local HTTP/HTTPS ports for the API.
  - Use those ports in the Angular proxy configuration.
  - Pattern: consistent local developer startup.

- `backend/src/Api/Greenfield.Api/Controllers/HealthCheckController.cs`
  - Class: `HealthCheckController`.
  - Use a primary constructor: `(IHealthCheckService healthCheckService)`.
  - Inherit from `ControllerBase`.
  - Add `[ApiController]` and `[Route("api/health")]`.
  - Add `[HttpGet]` method: `Task<ActionResult<HealthCheckResponse>> Get(CancellationToken cancellationToken)`.
  - Map the application record to the API contract and return `Ok(...)`.
  - Keep the controller thin: no direct clock access, no environment access, no inline business rules.

- `backend/src/Api/Greenfield.Api/Contracts/HealthCheckResponse.cs`
  - Record: `HealthCheckResponse`.
  - Properties: `string Status`, `string ApplicationName`, `string Environment`, `DateTimeOffset CheckedAtUtc`.
  - Pattern: API contract isolated from application types.

### Backend automated tests
- `backend/tests/Greenfield.Api.Tests/Greenfield.Api.Tests.csproj`
  - SDK-style test project.
  - Reference `Greenfield.Api`, `Greenfield.Application`, and `Greenfield.Infrastructure`.
  - Add `Microsoft.NET.Test.Sdk`, `xunit.v3`, `Moq`, and `Microsoft.AspNetCore.Mvc.Testing`.
  - Set `IsPackable=false`.
  - Pattern: single xUnit project containing unit and lightweight integration tests.

- `backend/tests/Greenfield.Api.Tests/Controllers/HealthCheckControllerTests.cs`
  - Test class: `HealthCheckControllerTests`.
  - Use `Moq` to mock `IHealthCheckService`.
  - Cover:
    - `Get_returns_ok_result`.
    - `Get_maps_application_result_to_api_contract`.
    - `Get_passes_cancellation_token_to_service`.
  - Pattern: isolated controller unit tests with no web host.

- `backend/tests/Greenfield.Api.Tests/Endpoints/HealthCheckEndpointTests.cs`
  - Test class: `HealthCheckEndpointTests`.
  - Use `WebApplicationFactory<Program>`.
  - Issue a real `GET /api/health` request.
  - Assert HTTP 200, JSON shape, and presence of health metadata fields.
  - Pattern: host-level integration test to satisfy the functional endpoint requirement.

- `backend/tests/Greenfield.Api.Tests/Services/SystemHealthCheckServiceTests.cs`
  - Test class: `SystemHealthCheckServiceTests`.
  - Mock `TimeProvider` and `IHostEnvironment` with `Moq`.
  - Cover:
    - healthy status is always returned,
    - application name is sourced from host environment,
    - environment name is sourced from host environment,
    - timestamp is sourced from `TimeProvider`.
  - Pattern: deterministic infrastructure unit tests.

### Frontend workspace and toolchain
- `frontend/package.json`
  - Set `private: true`.
  - Scripts:
    - `start`: `ng serve --proxy-config proxy.conf.json`
    - `build`: `ng build`
    - `test`: `ng test`
    - `watch`: `ng build --watch --configuration development`
  - Include the Angular runtime and dev tooling from section 4.
  - Pattern: self-contained workspace; no global CLI assumption.

- `frontend/angular.json`
  - Configure one application project rooted at `src/`.
  - Build target should use the application builder and output to `dist/frontend`.
  - Test target must use `@angular/build:unit-test` with `runner: "vitest"`, `tsConfig: "tsconfig.spec.json"`, and a build target pointing to the development build.
  - Serve target should reference `proxy.conf.json`.
  - Pattern: standalone Angular workspace using the current build/test tooling.

- `frontend/proxy.conf.json`
  - Proxy `/api` to the backend local HTTP port from `launchSettings.json`.
  - Pattern: avoid CORS setup for local development in this initial slice.

- `frontend/tsconfig.json`
  - Enable `strict` TypeScript settings.
  - Add Angular compiler strict template options.
  - Pattern: fail fast on typing/template issues to support zero-warning, zero-error builds.

- `frontend/tsconfig.app.json`
  - Include application source files and `src/main.ts`.
  - Keep test files excluded.

- `frontend/tsconfig.spec.json`
  - Include `src/**/*.spec.ts`.
  - Add test types for `vitest/globals` and `node`.
  - Pattern: dedicated test TypeScript configuration as required by the Angular unit-test builder.

- `frontend/src/index.html`
  - Minimal host page with `<app-root></app-root>`.

- `frontend/src/main.ts`
  - Bootstrap with `bootstrapApplication(AppComponent, appConfig)`.
  - No `NgModule` usage.
  - Pattern: standalone bootstrap per current Angular guidance.

- `frontend/src/styles.css`
  - Keep global styling minimal.
  - Do not move feature styling here.

### Frontend application shell
- `frontend/src/app/app.config.ts`
  - Export `appConfig: ApplicationConfig`.
  - Register `provideHttpClient()` only.
  - Do not configure router providers because routing is explicitly out of scope.

- `frontend/src/app/app.component.ts`
  - Component: `AppComponent`.
  - Set `standalone: true`.
  - Import `HealthStatusComponent`.
  - Optionally use `ChangeDetectionStrategy.OnPush`.
  - Pattern: root shell component composing one standalone feature component.

- `frontend/src/app/app.component.html`
  - Render a simple page title and the health feature component.

- `frontend/src/app/app.component.css`
  - Define shell spacing and max-width only.

- `frontend/src/app/app.component.spec.ts`
  - Test suite: `AppComponent`.
  - Configure `TestBed` with `imports: [AppComponent]` and `providers` from `appConfig`.
  - Cover:
    - component creation,
    - shell title rendering,
    - health component host appears in the DOM.
  - Pattern: standalone component test using `imports` instead of declarations/NgModules.

### Frontend health feature
- `frontend/src/app/core/models/health-status.model.ts`
  - Interface: `HealthStatus`.
  - Properties: `status`, `applicationName`, `environment`, `checkedAtUtc`.
  - Use `checkedAtUtc: string` because the API serializes an ISO timestamp.

- `frontend/src/app/core/services/health-api.service.ts`
  - Service: `HealthApiService`.
  - Use `inject(HttpClient)` instead of constructor injection.
  - Method: `getHealthStatus(): Observable<HealthStatus>` calling `GET /api/health`.
  - Pattern: thin transport service; no state and no presentation logic.

- `frontend/src/app/core/services/health-api.service.spec.ts`
  - Test suite: `HealthApiService`.
  - Use Angular HTTP testing providers.
  - Cover:
    - correct request method/path (`GET /api/health`),
    - response is deserialized into the `HealthStatus` shape.
  - Pattern: HTTP boundary test independent of UI logic.

- `frontend/src/app/features/health/health-status.component.ts`
  - Component: `HealthStatusComponent`.
  - Set `standalone: true`.
  - Imports should include the Angular directives/pipes needed by the template only.
  - Use Signals for state:
    - `isLoading = signal(false)`
    - `health = signal<HealthStatus | null>(null)`
    - `errorMessage = signal<string | null>(null)`
  - Add at least one computed signal, e.g. `statusLabel` or `hasHealthData`.
  - Method: `runHealthCheck()` that resets errors, sets loading state, calls `HealthApiService`, updates signals on success, and clears loading in both success and error paths.
  - Pattern: local component state with Signals, no NgModule, no store library.

- `frontend/src/app/features/health/health-status.component.html`
  - Render:
    - a button to trigger/refresh the health check,
    - a loading state,
    - a success card showing status, application name, environment, and timestamp,
    - an error state if the call fails.
  - Use current Angular control flow syntax if desired, but keep it simple and readable.

- `frontend/src/app/features/health/health-status.component.css`
  - Local styles for the health card, state colors, and button spacing.

- `frontend/src/app/features/health/health-status.component.spec.ts`
  - Test suite: `HealthStatusComponent`.
  - Provide a mocked `HealthApiService`.
  - Cover:
    - initial idle state,
    - loading state while request is unresolved,
    - success state updates signals and DOM,
    - error state renders when the service fails,
    - refresh button triggers `runHealthCheck()`.
  - Pattern: component-first signal testing using standalone `imports` in `TestBed`.

## 4. Dependencies

### Backend NuGet packages
Declare these in `backend/Directory.Packages.props`.

**Production / shared abstractions**
- `Microsoft.Extensions.DependencyInjection.Abstractions` — `10.0.0`
- `Microsoft.Extensions.Hosting.Abstractions` — `10.0.0`

**Testing**
- `Microsoft.NET.Test.Sdk` — `17.13.0`
- `xunit.v3` — `3.0.1`
- `Moq` — `4.20.72`
- `Microsoft.AspNetCore.Mvc.Testing` — `10.0.1`

**Framework references**
- API project uses `Microsoft.NET.Sdk.Web` targeting `net10.0`.
- No database, authentication, or Swagger packages in this phase.

### Frontend npm packages
Use Angular 20-compatible package versions consistently across Angular packages.

**dependencies**
- `@angular/common`
- `@angular/compiler`
- `@angular/core`
- `@angular/platform-browser`
- `rxjs`
- `tslib`
- `zone.js`

**devDependencies**
- `@angular/build`
- `@angular/cli`
- `@angular/compiler-cli`
- `@types/node`
- `jsdom`
- `typescript`
- `vitest`

## 5. Automated tests

### Test files to create
- `backend/tests/Greenfield.Api.Tests/Controllers/HealthCheckControllerTests.cs`
- `backend/tests/Greenfield.Api.Tests/Endpoints/HealthCheckEndpointTests.cs`
- `backend/tests/Greenfield.Api.Tests/Services/SystemHealthCheckServiceTests.cs`
- `frontend/src/app/app.component.spec.ts`
- `frontend/src/app/core/services/health-api.service.spec.ts`
- `frontend/src/app/features/health/health-status.component.spec.ts`

### Backend test expectations
- `HealthCheckControllerTests.cs`
  - Verify `GET` action returns `OkObjectResult` / `ActionResult<HealthCheckResponse>`.
  - Verify application result is mapped exactly to API contract fields.
  - Verify the incoming `CancellationToken` is forwarded to `IHealthCheckService`.

- `HealthCheckEndpointTests.cs`
  - Verify the hosted API returns `200 OK` for `GET /api/health`.
  - Verify JSON contains `status`, `applicationName`, `environment`, and `checkedAtUtc`.
  - Verify the returned `status` is the expected healthy value.

- `SystemHealthCheckServiceTests.cs`
  - Verify healthy baseline response.
  - Verify environment and application name are sourced from `IHostEnvironment`.
  - Verify timestamp uses the injected `TimeProvider` value, not `DateTimeOffset.UtcNow` directly.

### Frontend test expectations
- `app.component.spec.ts`
  - Verify the standalone root component renders.
  - Verify the page title appears.
  - Verify the health feature component is composed by the shell.

- `health-api.service.spec.ts`
  - Verify the service issues `GET /api/health`.
  - Verify response mapping matches the frontend model.

- `health-status.component.spec.ts`
  - Verify the component starts in a non-loading idle state.
  - Verify clicking the button triggers the API call.
  - Verify unresolved requests show loading UI.
  - Verify successful responses populate the DOM from Signals.
  - Verify failed responses show an error message and clear loading state.

### Validation commands the implementation developer must pass
- `dotnet build backend/GreenfieldArchitecture.sln`
- `dotnet test backend/GreenfieldArchitecture.sln`
- `npm install` in `frontend/`
- `npm run build` in `frontend/`
- `npm test` in `frontend/`

## 6. Acceptance criteria
- **AC-001: Backend .NET 10 Web API structure established**
  - Fulfilled by creating `backend/GreenfieldArchitecture.sln`, the `Greenfield.Api` Web API project, and the supporting Clean Architecture projects under `backend/src/`.

- **AC-002: HealthCheck controller implemented with Primary Constructors**
  - Fulfilled by `backend/src/Api/Greenfield.Api/Controllers/HealthCheckController.cs`, which uses a primary constructor and exposes `GET /api/health`, backed by `SystemHealthCheckService` using a primary constructor as well.

- **AC-003: Angular 18+ frontend with Standalone Components and Signals**
  - Fulfilled by `frontend/src/main.ts` using `bootstrapApplication`, `AppComponent` and `HealthStatusComponent` both being standalone, and `HealthStatusComponent` storing UI state in Signals/computed signals.

- **AC-004: Zero compilation errors for both backend and frontend**
  - Fulfilled by strict build configuration (`TreatWarningsAsErrors`, strict TypeScript/Angular compiler settings) and by the validation commands listed in section 5 passing cleanly.

- **AC-005: Feature branch created and pushed to origin**
  - Fulfilled operationally after implementation by creating `feature/INIT-001-greenfield`, committing the scaffold, and pushing it to `origin` once the backend/frontend build and test commands succeed.
