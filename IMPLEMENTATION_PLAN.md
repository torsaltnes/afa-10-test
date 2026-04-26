# IMPLEMENTATION_PLAN

## 1. Overview
Initialize a greenfield full-stack baseline with a .NET 10 backend and an Angular 20 frontend.
Use Clean Architecture on the backend and Angular standalone components + Signals on the frontend.
Implement a minimal end-to-end health slice so the repository proves project structure, DI, routing, API exposure, frontend integration, and testability.
The backend must use Minimal APIs only; the frontend must use `bootstrapApplication()` and no NgModules.

## 2. Folder structure and files to create
All files below are new because the repository is currently empty.

```text
.gitignore                                                           (create)
global.json                                                          (create)

backend/Directory.Build.props                                        (create)
backend/Directory.Packages.props                                     (create)
backend/GreenfieldArchitecture.sln                                   (create)

backend/src/GreenfieldArchitecture.Domain/GreenfieldArchitecture.Domain.csproj                       (create)
backend/src/GreenfieldArchitecture.Domain/Health/ApplicationMetadata.cs                             (create)
backend/src/GreenfieldArchitecture.Domain/Health/HealthSnapshot.cs                                  (create)
backend/src/GreenfieldArchitecture.Domain/Health/HealthState.cs                                     (create)

backend/src/GreenfieldArchitecture.Application/GreenfieldArchitecture.Application.csproj             (create)
backend/src/GreenfieldArchitecture.Application/Abstractions/Health/IApplicationMetadataProvider.cs  (create)
backend/src/GreenfieldArchitecture.Application/Abstractions/Health/IHealthService.cs                (create)
backend/src/GreenfieldArchitecture.Application/Health/Dtos/HealthStatusDto.cs                       (create)
backend/src/GreenfieldArchitecture.Application/Health/Queries/GetHealthStatusQuery.cs               (create)
backend/src/GreenfieldArchitecture.Application/Health/Services/HealthService.cs                     (create)

backend/src/GreenfieldArchitecture.Infrastructure/GreenfieldArchitecture.Infrastructure.csproj       (create)
backend/src/GreenfieldArchitecture.Infrastructure/Health/ApplicationMetadataProvider.cs              (create)

backend/src/GreenfieldArchitecture.Api/GreenfieldArchitecture.Api.csproj                             (create)
backend/src/GreenfieldArchitecture.Api/Program.cs                                                    (create)
backend/src/GreenfieldArchitecture.Api/Endpoints/HealthEndpoints.cs                                  (create)
backend/src/GreenfieldArchitecture.Api/Extensions/ServiceCollectionExtensions.cs                     (create)
backend/src/GreenfieldArchitecture.Api/appsettings.json                                              (create)
backend/src/GreenfieldArchitecture.Api/appsettings.Development.json                                  (create)
backend/src/GreenfieldArchitecture.Api/Properties/launchSettings.json                                (create)
backend/src/GreenfieldArchitecture.Api/GreenfieldArchitecture.Api.http                               (create)

backend/tests/GreenfieldArchitecture.Application.Tests/GreenfieldArchitecture.Application.Tests.csproj (create)
backend/tests/GreenfieldArchitecture.Application.Tests/Health/HealthServiceTests.cs                   (create)

backend/tests/GreenfieldArchitecture.Api.Tests/GreenfieldArchitecture.Api.Tests.csproj               (create)
backend/tests/GreenfieldArchitecture.Api.Tests/Infrastructure/GreenfieldArchitectureApiFactory.cs    (create)
backend/tests/GreenfieldArchitecture.Api.Tests/Health/HealthEndpointsTests.cs                        (create)

frontend/package.json                                                     (create)
frontend/angular.json                                                     (create)
frontend/.postcssrc.json                                                  (create)
frontend/tsconfig.json                                                    (create)
frontend/tsconfig.app.json                                                (create)
frontend/tsconfig.spec.json                                               (create)
frontend/proxy.conf.json                                                  (create)
frontend/src/index.html                                                   (create)
frontend/src/main.ts                                                      (create)
frontend/src/styles.css                                                   (create)
frontend/src/app/app.component.ts                                         (create)
frontend/src/app/app.component.spec.ts                                    (create)
frontend/src/app/app.config.ts                                            (create)
frontend/src/app/app.routes.ts                                            (create)
frontend/src/app/core/models/health-status.model.ts                       (create)
frontend/src/app/core/services/health-api.service.ts                      (create)
frontend/src/app/features/health/health-page.component.ts                 (create)
frontend/src/app/features/health/health-page.component.spec.ts            (create)
```

Do not create any `*.module.ts` files or `tailwind.config.js`.

## 3. Detailed implementation instructions per file

### Repository root
- `.gitignore`
  - Ignore .NET outputs (`bin/`, `obj/`, `.vs/`, `TestResults/`) and frontend outputs (`node_modules/`, `dist/`, `.angular/`, coverage folders).
  - Include standard OS/editor exclusions.
- `global.json`
  - Pin SDK to `.NET 10` (`10.0.100` baseline) with `rollForward` set to `latestFeature`.

### Backend build and solution files
- `backend/Directory.Build.props`
  - Apply shared backend defaults: `TargetFramework=net10.0`, `Nullable=enable`, `ImplicitUsings=enable`, `TreatWarningsAsErrors=true`, `LangVersion=latest`.
  - Keep these settings common for API, Domain, Application, Infrastructure, and test projects.
- `backend/Directory.Packages.props`
  - Enable central package management.
  - Define all backend package versions from section 4 so individual `.csproj` files stay clean.
- `backend/GreenfieldArchitecture.sln`
  - Add all backend source and test projects.
  - Preserve dependency direction: Domain <- Application <- Infrastructure <- API; tests reference targets only.

### Backend domain layer
- `backend/src/GreenfieldArchitecture.Domain/GreenfieldArchitecture.Domain.csproj`
  - Plain class library targeting `net10.0`.
  - No external package references.
- `backend/src/GreenfieldArchitecture.Domain/Health/ApplicationMetadata.cs`
  - Record: `ApplicationMetadata`.
  - Properties: `ServiceName`, `Version`, `EnvironmentName`.
  - Represents immutable metadata supplied by infrastructure.
- `backend/src/GreenfieldArchitecture.Domain/Health/HealthSnapshot.cs`
  - Record: `HealthSnapshot`.
  - Properties: `HealthState Status`, `ApplicationMetadata Metadata`, `DateTimeOffset CheckedAtUtc`.
  - Domain object used by the application service before mapping to DTO.
- `backend/src/GreenfieldArchitecture.Domain/Health/HealthState.cs`
  - Enum: `Healthy` only for the initial slice.
  - Keep extensible for future `Degraded` / `Unhealthy` states.

### Backend application layer
- `backend/src/GreenfieldArchitecture.Application/GreenfieldArchitecture.Application.csproj`
  - Class library targeting `net10.0`.
  - Reference Domain only.
- `backend/src/GreenfieldArchitecture.Application/Abstractions/Health/IApplicationMetadataProvider.cs`
  - Interface: `IApplicationMetadataProvider`.
  - Method: `ApplicationMetadata GetMetadata()`.
  - Infrastructure implements this; Application depends on the abstraction only.
- `backend/src/GreenfieldArchitecture.Application/Abstractions/Health/IHealthService.cs`
  - Interface: `IHealthService`.
  - Method: `Task<HealthStatusDto> GetAsync(GetHealthStatusQuery query, CancellationToken cancellationToken = default)`.
- `backend/src/GreenfieldArchitecture.Application/Health/Dtos/HealthStatusDto.cs`
  - Record: `HealthStatusDto`.
  - Properties: `string Status`, `string ServiceName`, `string Version`, `string Environment`, `DateTimeOffset CheckedAtUtc`.
  - This is the HTTP contract returned by the endpoint.
- `backend/src/GreenfieldArchitecture.Application/Health/Queries/GetHealthStatusQuery.cs`
  - Record: `GetHealthStatusQuery` with no mutable state.
  - Keep as the first command/query object to enforce the project pattern from day one.
- `backend/src/GreenfieldArchitecture.Application/Health/Services/HealthService.cs`
  - Sealed class: `HealthService` using a primary constructor.
  - Dependencies: `IApplicationMetadataProvider`, `TimeProvider`.
  - Method: `GetAsync(...)`.
  - Behavior:
    - Read application metadata from the provider.
    - Build a `HealthSnapshot` with `HealthState.Healthy` and UTC timestamp from `TimeProvider`.
    - Map the domain object to `HealthStatusDto`.
  - Patterns:
    - No ASP.NET references.
    - Validate any string inputs with `ArgumentException.ThrowIfNullOrWhiteSpace` if fallback logic is needed.
    - If any async calls are later introduced, use `ConfigureAwait(false)` in this library project.

### Backend infrastructure layer
- `backend/src/GreenfieldArchitecture.Infrastructure/GreenfieldArchitecture.Infrastructure.csproj`
  - Class library targeting `net10.0`.
  - Reference Application and Domain.
- `backend/src/GreenfieldArchitecture.Infrastructure/Health/ApplicationMetadataProvider.cs`
  - Sealed class: `ApplicationMetadataProvider` using a primary constructor.
  - Constructor inputs: `string serviceName`, `string version`, `string environmentName`.
  - Method: `GetMetadata()` returning `ApplicationMetadata`.
  - Validate constructor arguments with `ArgumentException.ThrowIfNullOrWhiteSpace`.
  - Keep this class pure; no direct ASP.NET dependency inside the implementation.

### Backend API layer
- `backend/src/GreenfieldArchitecture.Api/GreenfieldArchitecture.Api.csproj`
  - Web SDK project targeting `net10.0`.
  - Reference Application and Infrastructure.
  - Include package reference for OpenAPI only.
- `backend/src/GreenfieldArchitecture.Api/Program.cs`
  - Use top-level statements.
  - Configure services by calling `AddProjectServices(...)` from the extension file.
  - Add built-in health checks with `AddHealthChecks()`.
  - Add OpenAPI.
  - Build pipeline with HTTPS redirection.
  - Map endpoints:
    - `app.MapHealthEndpoints()` for `/api/health`
    - `app.MapHealthChecks("/health/live")` for infrastructure liveness
    - `app.MapOpenApi()` in development
  - Declare `public partial class Program` for `WebApplicationFactory` support.
  - Use Minimal APIs only; do not add MVC controllers.
- `backend/src/GreenfieldArchitecture.Api/Endpoints/HealthEndpoints.cs`
  - Static class: `HealthEndpoints`.
  - Method: `RouteGroupBuilder MapHealthEndpoints(this IEndpointRouteBuilder routes)`.
  - Create route group `/api/health` with `.WithTags("Health")`.
  - Add `MapGet("/", ...)` handler that:
    - Accepts `IHealthService` and `CancellationToken`.
    - Calls `GetAsync(new GetHealthStatusQuery(), cancellationToken)`.
    - Returns `TypedResults.Ok(dto)`.
  - Add endpoint metadata (`WithName`, `WithSummary`, optionally `Produces<HealthStatusDto>(StatusCodes.Status200OK)`).
- `backend/src/GreenfieldArchitecture.Api/Extensions/ServiceCollectionExtensions.cs`
  - Static class: `ServiceCollectionExtensions`.
  - Method: `IServiceCollection AddProjectServices(this IServiceCollection services, IConfiguration configuration, IHostEnvironment environment)`.
  - Register:
    - `TimeProvider.System` as singleton.
    - `IHealthService` -> `HealthService` as scoped.
    - `IApplicationMetadataProvider` -> `ApplicationMetadataProvider` using a factory lambda.
  - Derive version from the entry assembly and service name from configuration with fallback to `environment.ApplicationName`.
  - Validate derived values before constructing the provider.
- `backend/src/GreenfieldArchitecture.Api/appsettings.json`
  - Include `Application:Name` and standard logging configuration.
  - Keep secrets out of source control.
- `backend/src/GreenfieldArchitecture.Api/appsettings.Development.json`
  - Development logging overrides only.
- `backend/src/GreenfieldArchitecture.Api/Properties/launchSettings.json`
  - Create a local development profile with fixed HTTP/HTTPS ports.
  - Set `launchUrl` to `api/health` for smoke testing.
- `backend/src/GreenfieldArchitecture.Api/GreenfieldArchitecture.Api.http`
  - Include manual requests for `GET /api/health` and `GET /health/live`.

### Backend tests
- `backend/tests/GreenfieldArchitecture.Application.Tests/GreenfieldArchitecture.Application.Tests.csproj`
  - Test project targeting `net10.0`.
  - Reference Application and Domain.
  - Add xUnit, Moq, FluentAssertions, and test SDK packages.
- `backend/tests/GreenfieldArchitecture.Application.Tests/Health/HealthServiceTests.cs`
  - Test class: `HealthServiceTests`.
  - Cover:
    - healthy response mapping
    - metadata mapping from `IApplicationMetadataProvider`
    - deterministic timestamp from a fake/stub `TimeProvider`
  - Use `Moq` for `IApplicationMetadataProvider`.
- `backend/tests/GreenfieldArchitecture.Api.Tests/GreenfieldArchitecture.Api.Tests.csproj`
  - Test project targeting `net10.0`.
  - Reference API project.
  - Add xUnit, FluentAssertions, test SDK, and `Microsoft.AspNetCore.Mvc.Testing`.
- `backend/tests/GreenfieldArchitecture.Api.Tests/Infrastructure/GreenfieldArchitectureApiFactory.cs`
  - Sealed class inheriting `WebApplicationFactory<Program>`.
  - Keep customization minimal; only add overrides when future tests need them.
- `backend/tests/GreenfieldArchitecture.Api.Tests/Health/HealthEndpointsTests.cs`
  - Test class: `HealthEndpointsTests`.
  - Use `HttpClient` from the factory.
  - Cover:
    - `GET /api/health` returns 200
    - response JSON matches the DTO contract
    - `GET /health/live` returns 200

### Frontend workspace and tooling
- `frontend/package.json`
  - Create the Angular workspace package manifest; do not mark this as modify.
  - Scripts: `start`, `build`, `test`, `test:watch`.
  - Use Angular 20 packages, Tailwind 4 packages, and Vitest-based test tooling.
- `frontend/angular.json`
  - Configure one application project named `greenfield-frontend`.
  - Build target: `@angular/build:application`.
  - Test target: `@angular/build:unit-test` with `runner: "vitest"` and `tsConfig: "tsconfig.spec.json"`.
  - Serve target must use `proxy.conf.json`.
  - Use `src/styles.css` as the single global stylesheet.
- `frontend/.postcssrc.json`
  - Configure PostCSS with `@tailwindcss/postcss` only.
  - Do not introduce `tailwind.config.js`.
- `frontend/tsconfig.json`
  - Enable strict TypeScript options suitable for Angular 20.
- `frontend/tsconfig.app.json`
  - App compilation config including `src/main.ts`.
- `frontend/tsconfig.spec.json`
  - Extend `tsconfig.json`.
  - Include `src/**/*.spec.ts` and `src/**/*.d.ts`.
  - Add `types: ["vitest/globals", "node"]`.
- `frontend/proxy.conf.json`
  - Proxy `/api` and `/health` to the backend development URL from `launchSettings.json`.
  - Set `secure: false` if the proxy targets local HTTPS.

### Frontend runtime files
- `frontend/src/index.html`
  - Standard Angular host page with `<app-root></app-root>`.
  - Keep only essential metadata.
- `frontend/src/main.ts`
  - Bootstrap with `bootstrapApplication(AppComponent, appConfig)`.
  - No NgModule bootstrap.
- `frontend/src/styles.css`
  - Import Tailwind with `@import "tailwindcss";`.
  - Define design tokens in `@theme` blocks only.
  - Add app-wide CSS variables for brand, surface, success, danger, spacing, and radius tokens.
  - Do not add hardcoded utility color classes; use token-backed utilities.
- `frontend/src/app/app.config.ts`
  - Export `appConfig: ApplicationConfig`.
  - Register `provideRouter(routes)` and `provideHttpClient()`.
- `frontend/src/app/app.routes.ts`
  - Define the root route using `loadComponent` to lazy-load the health page.
  - Add a wildcard redirect back to the root health route.
- `frontend/src/app/app.component.ts`
  - Standalone component: `AppComponent`.
  - Use `ChangeDetectionStrategy.OnPush`.
  - Import `RouterOutlet`.
  - Template should render a simple shell/header and the routed page.
  - No constructor DI.
- `frontend/src/app/core/models/health-status.model.ts`
  - Export a TypeScript `type` or `interface` matching the backend DTO exactly:
    - `status`
    - `serviceName`
    - `version`
    - `environment`
    - `checkedAtUtc`
- `frontend/src/app/core/services/health-api.service.ts`
  - Injectable service: `HealthApiService` with `providedIn: 'root'`.
  - Use `inject(HttpClient)`.
  - Method: `getHealth()` returning `Observable<HealthStatus>` from `/api/health`.
  - Keep the service stateless; do not use `BehaviorSubject`.
- `frontend/src/app/features/health/health-page.component.ts`
  - Standalone component: `HealthPageComponent`.
  - Use `ChangeDetectionStrategy.OnPush`.
  - Use `inject(HealthApiService)`.
  - Use Signals-based state, preferably `rxResource()` for the async fetch.
  - Required members:
    - `healthResource`
    - computed `isHealthy`
    - computed `statusLabel`
    - `reload()` action for a manual refresh button
  - Template rules:
    - use `@if` / `@else`
    - do not use `*ngIf` / `*ngFor`
    - render loading, success, and error states
    - apply Tailwind utility classes backed by `@theme` tokens
- `frontend/src/app/app.component.spec.ts`
  - Standalone component test for `AppComponent`.
  - Configure `TestBed` with `imports: [AppComponent]` and router providers.
  - Verify the shell creates successfully and includes the router outlet region.
- `frontend/src/app/features/health/health-page.component.spec.ts`
  - Standalone component test for `HealthPageComponent`.
  - Configure `TestBed` with standalone imports plus `provideHttpClient()` and `provideHttpClientTesting()`.
  - Verify loading, successful response rendering, error rendering, and manual reload behavior.

## 4. Dependencies

### Backend NuGet packages
Use central package management in `backend/Directory.Packages.props`.

- `Microsoft.AspNetCore.OpenApi` — `10.0.7` (API project)
- `Microsoft.NET.Test.Sdk` — `18.5.0` (both test projects)
- `xunit` — `2.9.3` (both test projects)
- `xunit.runner.visualstudio` — `3.1.5` (both test projects)
- `Moq` — `4.20.72` (application test project)
- `FluentAssertions` — `8.9.0` (both test projects)
- `Microsoft.AspNetCore.Mvc.Testing` — `10.0.7` (API integration test project)

### Frontend npm packages

#### dependencies
- `@angular/common`
- `@angular/compiler`
- `@angular/core`
- `@angular/platform-browser`
- `@angular/router`
- `rxjs`
- `tslib`
- `zone.js`
- `tailwindcss`

#### devDependencies
- `@angular/build`
- `@angular/cli`
- `@angular/compiler-cli`
- `@tailwindcss/postcss`
- `postcss`
- `typescript`
- `vitest`
- `jsdom`
- `@types/node`

## 5. Automated tests

### Test files to create
```text
backend/tests/GreenfieldArchitecture.Application.Tests/GreenfieldArchitecture.Application.Tests.csproj
backend/tests/GreenfieldArchitecture.Application.Tests/Health/HealthServiceTests.cs
backend/tests/GreenfieldArchitecture.Api.Tests/GreenfieldArchitecture.Api.Tests.csproj
backend/tests/GreenfieldArchitecture.Api.Tests/Infrastructure/GreenfieldArchitectureApiFactory.cs
backend/tests/GreenfieldArchitecture.Api.Tests/Health/HealthEndpointsTests.cs
frontend/src/app/app.component.spec.ts
frontend/src/app/features/health/health-page.component.spec.ts
```

### What to test
- `backend/tests/GreenfieldArchitecture.Application.Tests/Health/HealthServiceTests.cs`
  - service returns `Healthy`
  - DTO fields are mapped from domain metadata correctly
  - timestamp comes from injected `TimeProvider`, not `DateTime.UtcNow`
- `backend/tests/GreenfieldArchitecture.Api.Tests/Health/HealthEndpointsTests.cs`
  - `/api/health` returns HTTP 200
  - JSON payload shape matches the contract expected by the frontend
  - `/health/live` returns HTTP 200
- `frontend/src/app/app.component.spec.ts`
  - app shell bootstraps as a standalone component
  - routing infrastructure is wired correctly enough for the shell to render
- `frontend/src/app/features/health/health-page.component.spec.ts`
  - loading state appears before the HTTP response resolves
  - success state renders backend values after a 200 response
  - error state renders when the API fails
  - clicking refresh triggers a new request and updates signals/resource state

## 6. Acceptance criteria
- **Backend Project Structure**
  - Fulfilled by creating the `/backend` folder, solution file, and the four Clean Architecture source projects plus tests.
- **HealthCheck Controller Implementation**
  - The intake wording mentions a controller, but implementation must use Minimal APIs to satisfy the architecture constraints.
  - `backend/src/GreenfieldArchitecture.Api/Endpoints/HealthEndpoints.cs` fulfills the same behavior: a GET endpoint returning `200 OK` with health status data.
- **Backend Compilation**
  - Fulfilled by a complete `net10.0` solution layout with valid project references and central package management.
- **Frontend Project Structure**
  - Fulfilled by creating the `/frontend` Angular workspace with `package.json`, `angular.json`, TypeScript configs, app source files, and proxy configuration.
- **Angular Standalone Architecture**
  - Fulfilled by `src/main.ts` using `bootstrapApplication()`, `app.config.ts` using provider functions, standalone routed components, and zero NgModules.
- **Frontend Health Experience**
  - Fulfilled by `HealthPageComponent`, which calls `/api/health`, renders loading/success/error states, and uses Signals-based reactive state.
- **Automated Test Coverage**
  - Fulfilled by xUnit unit + integration tests on the backend and `.spec.ts` component tests on the frontend.
- **Modern Architecture Baseline for Future Development**
  - Fulfilled by Clean Architecture boundaries, immutable DTO/query records, minimal API endpoint grouping, Tailwind 4 CSS-first theming, and Angular 20 standalone/signal conventions that can be extended feature-by-feature.
