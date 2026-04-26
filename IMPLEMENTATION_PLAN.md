# IMPLEMENTATION_PLAN.md

## 1. Overview
Implement a new Deviation / Non-conformity management vertical slice across the existing .NET 10 minimal API backend and Angular 20 frontend. The backend will expose in-memory CRUD endpoints using Clean Architecture and a singleton `ConcurrentDictionary` repository. The frontend will add a standalone, signals-driven deviation management UI with responsive Tailwind CSS v4 styling. The feature must preserve the current health feature while making deviations the primary workflow.

## 2. Folder structure and files to create
init-dev.sh                                                                 (create)
init-dev.ps1                                                                (create)

backend/src/GreenfieldArchitecture.Domain/Deviations/Deviation.cs           (create)
backend/src/GreenfieldArchitecture.Domain/Deviations/DeviationSeverity.cs   (create)
backend/src/GreenfieldArchitecture.Domain/Deviations/DeviationStatus.cs     (create)

backend/src/GreenfieldArchitecture.Application/Abstractions/Deviations/IDeviationRepository.cs (create)
backend/src/GreenfieldArchitecture.Application/Abstractions/Deviations/IDeviationService.cs    (create)
backend/src/GreenfieldArchitecture.Application/Deviations/Dtos/DeviationDto.cs                  (create)
backend/src/GreenfieldArchitecture.Application/Deviations/Dtos/CreateDeviationRequest.cs        (create)
backend/src/GreenfieldArchitecture.Application/Deviations/Dtos/UpdateDeviationRequest.cs        (create)
backend/src/GreenfieldArchitecture.Application/Deviations/Commands/CreateDeviationCommand.cs     (create)
backend/src/GreenfieldArchitecture.Application/Deviations/Commands/UpdateDeviationCommand.cs     (create)
backend/src/GreenfieldArchitecture.Application/Deviations/Commands/DeleteDeviationCommand.cs     (create)
backend/src/GreenfieldArchitecture.Application/Deviations/Queries/GetDeviationByIdQuery.cs       (create)
backend/src/GreenfieldArchitecture.Application/Deviations/Queries/ListDeviationsQuery.cs         (create)
backend/src/GreenfieldArchitecture.Application/Deviations/Services/DeviationService.cs           (create)

backend/src/GreenfieldArchitecture.Infrastructure/Deviations/InMemoryDeviationRepository.cs      (create)

backend/src/GreenfieldArchitecture.Api/Program.cs                                                 (modify)
backend/src/GreenfieldArchitecture.Api/Extensions/ServiceCollectionExtensions.cs                  (modify)
backend/src/GreenfieldArchitecture.Api/Endpoints/DeviationEndpoints.cs                            (create)
backend/src/GreenfieldArchitecture.Api/Properties/launchSettings.json                             (modify)

backend/tests/GreenfieldArchitecture.Application.Tests/Deviations/DeviationServiceTests.cs        (create)
backend/tests/GreenfieldArchitecture.Api.Tests/Infrastructure/GreenfieldArchitectureApiFactory.cs (modify)
backend/tests/GreenfieldArchitecture.Api.Tests/Deviations/DeviationEndpointsTests.cs              (create)

frontend/package.json                                                                              (modify)
frontend/package-lock.json                                                                         (modify)
frontend/tsconfig.spec.json                                                                        (modify)
frontend/src/styles.css                                                                            (modify)
frontend/src/app/app.component.ts                                                                  (modify)
frontend/src/app/app.component.spec.ts                                                             (modify)
frontend/src/app/app.routes.ts                                                                     (modify)
frontend/src/app/core/models/deviation.model.ts                                                    (create)
frontend/src/app/core/services/deviation-api.service.ts                                            (create)
frontend/src/app/core/services/deviation-store.service.ts                                          (create)
frontend/src/app/core/services/deviation-store.service.spec.ts                                     (create)
frontend/src/app/features/deviations/deviation-form.component.ts                                   (create)
frontend/src/app/features/deviations/deviation-form.component.spec.ts                              (create)
frontend/src/app/features/deviations/deviations-page.component.ts                                  (create)
frontend/src/app/features/deviations/deviations-page.component.spec.ts                             (create)

## 3. Detailed implementation instructions per file

### init-dev.sh
- Bash bootstrap script for macOS/Linux.
- Use the required template, adapted to this repository:
  - `dotnet restore backend/GreenfieldArchitecture.sln`
  - `npm --prefix frontend install`
  - final instruction should point developers to `dotnet run --project backend/src/GreenfieldArchitecture.Api`.
- Keep `set -euo pipefail` and the HTTPS dev certificate trust step.

### init-dev.ps1
- PowerShell bootstrap script for Windows.
- Use the required template, adapted to this repository:
  - `dotnet restore backend/GreenfieldArchitecture.sln`
  - npm install under `frontend`
  - final instruction should point developers to `dotnet run --project backend/src/GreenfieldArchitecture.Api`.

### backend/src/GreenfieldArchitecture.Domain/Deviations/Deviation.cs
- Create domain type `Deviation` as a sealed immutable domain model.
- Recommended shape:
  - `Guid Id`
  - `string Title`
  - `string Description`
  - `DeviationSeverity Severity`
  - `DeviationStatus Status`
  - `DateTimeOffset CreatedAtUtc`
  - `DateTimeOffset LastModifiedAtUtc`
- Add static factory/member methods to enforce invariants:
  - `Create(...)`
  - `UpdateDetails(...)`
- Validate title/description with `ArgumentException.ThrowIfNullOrWhiteSpace`.
- Keep domain logic free of HTTP concerns.

### backend/src/GreenfieldArchitecture.Domain/Deviations/DeviationSeverity.cs
- Create enum `DeviationSeverity`.
- Use ordered values suitable for UI/API filtering later: `Low`, `Medium`, `High`, `Critical`.

### backend/src/GreenfieldArchitecture.Domain/Deviations/DeviationStatus.cs
- Create enum `DeviationStatus`.
- Use lifecycle-oriented values: `Open`, `Investigating`, `Resolved`, `Closed`.

### backend/src/GreenfieldArchitecture.Application/Abstractions/Deviations/IDeviationRepository.cs
- Define persistence abstraction for the in-memory store.
- Methods:
  - `Task<IReadOnlyList<Deviation>> ListAsync(CancellationToken cancellationToken)`
  - `Task<Deviation?> GetByIdAsync(Guid id, CancellationToken cancellationToken)`
  - `Task AddAsync(Deviation deviation, CancellationToken cancellationToken)`
  - `Task<bool> UpdateAsync(Deviation deviation, CancellationToken cancellationToken)`
  - `Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken)`
- Keep the interface in Application so Infrastructure remains replaceable later.

### backend/src/GreenfieldArchitecture.Application/Abstractions/Deviations/IDeviationService.cs
- Define use-case abstraction consumed by Minimal API handlers.
- Methods:
  - `Task<IReadOnlyList<DeviationDto>> ListAsync(ListDeviationsQuery query, CancellationToken cancellationToken)`
  - `Task<DeviationDto?> GetByIdAsync(GetDeviationByIdQuery query, CancellationToken cancellationToken)`
  - `Task<DeviationDto> CreateAsync(CreateDeviationCommand command, CancellationToken cancellationToken)`
  - `Task<DeviationDto?> UpdateAsync(UpdateDeviationCommand command, CancellationToken cancellationToken)`
  - `Task<bool> DeleteAsync(DeleteDeviationCommand command, CancellationToken cancellationToken)`

### backend/src/GreenfieldArchitecture.Application/Deviations/Dtos/DeviationDto.cs
- Create sealed record `DeviationDto`.
- Mirror the API response contract:
  - `Guid Id`
  - `string Title`
  - `string Description`
  - `string Severity`
  - `string Status`
  - `DateTimeOffset CreatedAtUtc`
  - `DateTimeOffset LastModifiedAtUtc`
- Keep enum values serialized as strings for frontend simplicity.

### backend/src/GreenfieldArchitecture.Application/Deviations/Dtos/CreateDeviationRequest.cs
- Create sealed record `CreateDeviationRequest` for POST bodies.
- Fields:
  - `string Title`
  - `string Description`
  - `string Severity`
  - optional `string? Status` (default to `Open` when omitted)
- This is the transport contract only; map it to `CreateDeviationCommand` in the endpoint layer.

### backend/src/GreenfieldArchitecture.Application/Deviations/Dtos/UpdateDeviationRequest.cs
- Create sealed record `UpdateDeviationRequest` for PUT bodies.
- Fields:
  - `Guid Id`
  - `string Title`
  - `string Description`
  - `string Severity`
  - `string Status`
- Endpoint must reject route/body ID mismatches with HTTP 400.

### backend/src/GreenfieldArchitecture.Application/Deviations/Commands/CreateDeviationCommand.cs
- Create sealed record `CreateDeviationCommand`.
- Fields should match the business write model after transport mapping.
- Parse and normalize severity/status before persistence.

### backend/src/GreenfieldArchitecture.Application/Deviations/Commands/UpdateDeviationCommand.cs
- Create sealed record `UpdateDeviationCommand`.
- Include `Guid Id` plus editable fields.

### backend/src/GreenfieldArchitecture.Application/Deviations/Commands/DeleteDeviationCommand.cs
- Create sealed record `DeleteDeviationCommand` with `Guid Id`.

### backend/src/GreenfieldArchitecture.Application/Deviations/Queries/GetDeviationByIdQuery.cs
- Create sealed record `GetDeviationByIdQuery` with `Guid Id`.

### backend/src/GreenfieldArchitecture.Application/Deviations/Queries/ListDeviationsQuery.cs
- Create sealed record `ListDeviationsQuery`.
- Keep it empty for now, but establish a query object so status/severity filtering can be added later without changing the service signature.

### backend/src/GreenfieldArchitecture.Application/Deviations/Services/DeviationService.cs
- Create sealed class `DeviationService` using a primary constructor.
- Inject:
  - `IDeviationRepository repository`
  - `TimeProvider timeProvider`
  - `ILogger<DeviationService> logger`
- Implement all CRUD use cases.
- Responsibilities:
  - validate all inputs
  - map string severity/status values to domain enums
  - create timestamps using `timeProvider.GetUtcNow()`
  - preserve `CreatedAtUtc` during updates
  - update `LastModifiedAtUtc` on every write
  - return DTO records only
  - sort list results descending by `LastModifiedAtUtc`
- Use structured logging templates.
- Use `ConfigureAwait(false)` on awaited calls.
- Use collection expressions when materializing lists.

### backend/src/GreenfieldArchitecture.Infrastructure/Deviations/InMemoryDeviationRepository.cs
- Create sealed class `InMemoryDeviationRepository` using a primary constructor only if dependencies are required; otherwise use a sealed class with a private `ConcurrentDictionary<Guid, Deviation>` field.
- Register it as a singleton.
- Implement `IDeviationRepository` with thread-safe CRUD operations.
- Return defensive copies/order-stable snapshots rather than exposing dictionary internals.
- Keep methods async-friendly (`Task.FromResult`, `Task.CompletedTask`) without blocking I/O.
- Add an internal `Clear()` helper only if the API integration tests need repository reset; do not expose reset behavior in `IDeviationRepository`.

### backend/src/GreenfieldArchitecture.Api/Program.cs
- Keep existing health feature wiring.
- Add `app.UseCors();` before endpoint mapping.
- Replace unconditional HTTPS redirect with:
  - `if (!app.Environment.IsDevelopment()) app.UseHttpsRedirection();`
- Map the new feature with `app.MapDeviationEndpoints();`.
- Keep OpenAPI in Development and keep `public partial class Program { }` for tests.

### backend/src/GreenfieldArchitecture.Api/Extensions/ServiceCollectionExtensions.cs
- Extend `AddProjectServices(...)`.
- Add default CORS policy allowing:
  - `http://localhost:4200`
  - `https://localhost:4200`
- Register deviation services:
  - `AddSingleton<IDeviationRepository, InMemoryDeviationRepository>()`
  - `AddScoped<IDeviationService, DeviationService>()`
- Keep existing health registrations intact.

### backend/src/GreenfieldArchitecture.Api/Endpoints/DeviationEndpoints.cs
- Create static endpoint module `DeviationEndpoints`.
- Method: `IEndpointRouteBuilder MapDeviationEndpoints(this IEndpointRouteBuilder routes)`.
- Create route group `routes.MapGroup("/api/deviations").WithTags("Deviations")`.
- Add endpoints with strongly typed results:
  - `GET /api/deviations` -> `Ok<IReadOnlyList<DeviationDto>>`
  - `GET /api/deviations/{id:guid}` -> `Results<Ok<DeviationDto>, NotFound>`
  - `POST /api/deviations` -> `Results<Created<DeviationDto>, BadRequest<ProblemDetails>>`
  - `PUT /api/deviations/{id:guid}` -> `Results<Ok<DeviationDto>, NotFound, BadRequest<ProblemDetails>>`
  - `DELETE /api/deviations/{id:guid}` -> `Results<NoContent, NotFound>`
- Handler requirements:
  - map request DTOs to command/query records
  - translate validation failures to 400 responses
  - return 404 when an item does not exist
  - use route names and `.Produces(...)` metadata for OpenAPI

### backend/src/GreenfieldArchitecture.Api/Properties/launchSettings.json
- Replace the current localhost ports with the mandated profiles:
  - `http` profile on `http://localhost:5000`
  - `https` profile on `https://localhost:5001;http://localhost:5000`
- Keep `ASPNETCORE_ENVIRONMENT=Development` on both profiles.
- Do not remove existing development convenience settings such as `dotnetRunMessages`.

### backend/tests/GreenfieldArchitecture.Application.Tests/Deviations/DeviationServiceTests.cs
- Create xUnit test class `DeviationServiceTests`.
- Use `Moq` for `IDeviationRepository` and `ILogger<DeviationService>`.
- Use `FluentAssertions` for assertions.
- Cover:
  - create assigns ID and timestamps and defaults status to `Open`
  - create rejects blank title/description
  - list returns descending `LastModifiedAtUtc`
  - get returns null when missing
  - update returns null when repository item is missing
  - update preserves `CreatedAtUtc` and changes `LastModifiedAtUtc`
  - delete returns false when missing and true when present
  - severity/status parsing is case-insensitive but outputs canonical strings

### backend/tests/GreenfieldArchitecture.Api.Tests/Infrastructure/GreenfieldArchitectureApiFactory.cs
- Modify the existing `WebApplicationFactory<Program>` helper to support isolation for deviation tests.
- Ensure each test can start from a clean in-memory repository state.
- Acceptable approaches:
  - expose a helper that resolves the concrete `InMemoryDeviationRepository` and clears it before each test, or
  - build an isolated factory/client per test using a fresh service provider.
- Keep the factory reusable for existing health tests.

### backend/tests/GreenfieldArchitecture.Api.Tests/Deviations/DeviationEndpointsTests.cs
- Create integration test class `DeviationEndpointsTests` using `IClassFixture<GreenfieldArchitectureApiFactory>`.
- Test through `HttpClient`, not direct method calls.
- Cover:
  - `GET /api/deviations` returns 200 and JSON array
  - `GET /api/deviations/{id}` returns 404 for unknown ID
  - `POST /api/deviations` returns 201, JSON body, and `Location` header
  - `PUT /api/deviations/{id}` updates fields and returns 200
  - `PUT` with route/body mismatch returns 400
  - `DELETE /api/deviations/{id}` returns 204 and subsequent `GET` returns 404
  - health endpoints still respond successfully after deviation feature registration

### frontend/package.json
- Add `@angular/forms` aligned with the existing Angular version line (`^20.3.0`).
- Keep existing Angular 20, Tailwind 4, Vitest, jsdom, and zone.js dependencies.
- Do not add NgModule-era tooling or alternative state libraries.

### frontend/package-lock.json
- Update lockfile after adding `@angular/forms`.
- Keep it consistent with `package.json`; no manual editing strategy beyond normal npm lockfile regeneration.

### frontend/tsconfig.spec.json
- Keep Vitest global types.
- Add `vitest/jsdom` to `compilerOptions.types` so DOM-oriented component tests have explicit environment typing.
- Preserve existing Angular test tsconfig settings.

### frontend/src/styles.css
- Keep `@import "tailwindcss";` at the top.
- Extend the global `@theme` block with semantic tokens for the deviation UI, for example:
  - `--color-primary`
  - `--color-surface`
  - `--color-surface-muted`
  - `--color-success`
  - `--color-warning`
  - `--color-danger`
  - `--spacing-panel`
- Use tokens that generate utility classes consumed by the new feature templates.
- Do not introduce `tailwind.config.js`.

### frontend/src/app/app.component.ts
- Modify the root standalone component to present a simple application shell.
- Keep `RouterOutlet` and `ChangeDetectionStrategy.OnPush`.
- Add lightweight navigation links for:
  - `Deviations`
  - `Health`
- Template must use built-in control flow only if conditional rendering is needed.
- Styling should use the semantic Tailwind token utilities defined in `styles.css`.

### frontend/src/app/app.component.spec.ts
- Update the existing spec to reflect the shell/navigation changes.
- Verify the component still creates successfully and the deviation navigation link is rendered.

### frontend/src/app/app.routes.ts
- Keep standalone lazy routing with `loadComponent`.
- Make deviations the default route:
  - `''` redirect to `'deviations'`
  - `'deviations'` -> `DeviationsPageComponent`
  - `'health'` -> existing `HealthPageComponent`
  - wildcard -> redirect to `'deviations'`
- Do not introduce route modules.

### frontend/src/app/core/models/deviation.model.ts
- Create TypeScript models and literal unions for the frontend contract.
- Export:
  - `type DeviationSeverity = 'Low' | 'Medium' | 'High' | 'Critical'`
  - `type DeviationStatus = 'Open' | 'Investigating' | 'Resolved' | 'Closed'`
  - `interface Deviation`
  - `interface UpsertDeviationRequest`
  - readonly option arrays for severity and status dropdowns
- Keep names aligned with backend DTO string values.

### frontend/src/app/core/services/deviation-api.service.ts
- Create root service `DeviationApiService`.
- Use `inject(HttpClient)`.
- Keep the service stateless; it should only wrap HTTP calls:
  - `list()`
  - `getById(id: string)`
  - `create(request: UpsertDeviationRequest)`
  - `update(id: string, request: UpsertDeviationRequest & { id: string })`
  - `delete(id: string)`
- Use `/api/deviations` as the base path.

### frontend/src/app/core/services/deviation-store.service.ts
- Create root service `DeviationStoreService` using Angular Signals as the primary state container.
- Use `inject(DeviationApiService)`.
- Core writable signals:
  - `items`
  - `selectedId`
  - `mode` (`'view' | 'create' | 'edit'`)
  - `loading`
  - `saving`
  - `deleting`
  - `error`
- Core computed signals:
  - `sortedItems`
  - `selectedDeviation`
  - `isEmpty`
  - `isCreateMode`
  - `isEditMode`
- Methods:
  - `load()`
  - `select(id: string)`
  - `startCreate()`
  - `startEdit(id: string)`
  - `save(request: UpsertDeviationRequest)`
  - `remove(id: string)`
  - `cancelEditing()`
- Implementation guidance:
  - use async/await plus `firstValueFrom(...)` or equivalent
  - refresh/select newly created records after save
  - clear transient errors before each command
  - do not use `BehaviorSubject`

### frontend/src/app/core/services/deviation-store.service.spec.ts
- Create service spec using Vitest and Angular TestBed.
- Configure providers with `provideHttpClient()` and `provideHttpClientTesting()` in that order, per Angular guidance.
- Cover:
  - initial state
  - load success populates `items`
  - create success appends/selects the new deviation
  - update success mutates the selected item in signals
  - delete success removes the item and clears selection when necessary
  - HTTP failure paths set the `error` signal and reset busy flags

### frontend/src/app/features/deviations/deviation-form.component.ts
- Create standalone presentational component `DeviationFormComponent`.
- Use `ChangeDetectionStrategy.OnPush`.
- Use `inject(FormBuilder)` and `ReactiveFormsModule`.
- Use signal-based component I/O:
  - `initialValue = input<Deviation | null>(null)`
  - `mode = input<'create' | 'edit'>('create')`
  - `saving = input<boolean>(false)`
  - `submitted = output<UpsertDeviationRequest>()`
  - `cancelled = output<void>()`
- Form fields:
  - title
  - description
  - severity
  - status
- Use validators for required fields.
- Add an `effect()` to patch/reset the form when `initialValue` or `mode` changes.
- Template rules:
  - use `@if` for validation and mode-specific labels
  - use semantic Tailwind classes and `gap-*` utilities
  - no hardcoded colors in class names

### frontend/src/app/features/deviations/deviation-form.component.spec.ts
- Create component spec.
- Verify:
  - form renders create and edit headings correctly
  - incoming `initialValue` patches the form
  - invalid form does not emit submit
  - valid form emits normalized payload
  - cancel button emits `cancelled`

### frontend/src/app/features/deviations/deviations-page.component.ts
- Create routed standalone component `DeviationsPageComponent`.
- Use `ChangeDetectionStrategy.OnPush`, `inject(DeviationStoreService)`, and any routing helpers via `inject()` if needed.
- On first load, trigger `store.load()`.
- Page responsibilities:
  - toolbar/header with feature title and create action
  - responsive master/detail layout
  - list of deviations using `@for (...; track deviation.id)`
  - selected deviation summary panel in view mode
  - embedded `DeviationFormComponent` in create/edit modes
  - delete button with guarded confirmation flow
  - empty, loading, and error states
- Recommended UX:
  - desktop: two-column layout
  - mobile: stacked layout
  - show status/severity badges using token-backed Tailwind classes
  - keep existing health feature reachable from the app shell

### frontend/src/app/features/deviations/deviations-page.component.spec.ts
- Create page component spec.
- Test with the real store service plus `HttpTestingController`, or a focused store mock if simpler.
- Cover:
  - initial load requests `/api/deviations`
  - empty state rendering when the list is empty
  - list rendering and selection when data exists
  - switching from view mode to create/edit mode
  - successful delete removes the item from the rendered list
  - error state renders when API calls fail

## 4. Dependencies

### Backend NuGet packages
No new backend packages are required; use the existing centrally managed package set already present in `backend/Directory.Packages.props`:
- `Microsoft.AspNetCore.OpenApi` — `10.0.7`
- `Microsoft.NET.Test.Sdk` — `18.5.0`
- `xunit` — `2.9.3`
- `xunit.runner.visualstudio` — `3.1.5`
- `FluentAssertions` — `8.9.0`
- `Moq` — `4.20.72`
- `Microsoft.AspNetCore.Mvc.Testing` — `10.0.7`

### Frontend npm packages
Keep the existing packages and add the missing forms package needed for the CRUD editor.
- Runtime dependencies:
  - `@angular/common` — `^20.3.0`
  - `@angular/compiler` — `^20.3.0`
  - `@angular/core` — `^20.3.0`
  - `@angular/forms` — `^20.3.0` **(add)**
  - `@angular/platform-browser` — `^20.3.0`
  - `@angular/router` — `^20.3.0`
  - `rxjs` — `~7.8.0`
  - `tailwindcss` — `^4.2.0`
  - `zone.js` — `~0.15.0`
- Dev dependencies used by the existing Angular/Vitest test setup:
  - `@angular/build` — `^20.3.0`
  - `@angular/cli` — `^20.3.0`
  - `@angular/compiler-cli` — `^20.3.0`
  - `@tailwindcss/postcss` — `^4.2.0`
  - `jsdom` — `^26.0.0`
  - `typescript` — `~5.8.0`
  - `vitest` — `^3.1.0`

## 5. Automated tests

### Test files to create or modify
- `backend/tests/GreenfieldArchitecture.Application.Tests/Deviations/DeviationServiceTests.cs` (create)
- `backend/tests/GreenfieldArchitecture.Api.Tests/Infrastructure/GreenfieldArchitectureApiFactory.cs` (modify)
- `backend/tests/GreenfieldArchitecture.Api.Tests/Deviations/DeviationEndpointsTests.cs` (create)
- `frontend/src/app/app.component.spec.ts` (modify)
- `frontend/src/app/core/services/deviation-store.service.spec.ts` (create)
- `frontend/src/app/features/deviations/deviation-form.component.spec.ts` (create)
- `frontend/src/app/features/deviations/deviations-page.component.spec.ts` (create)

### Backend test expectations
- Unit tests must verify the service-layer business rules independently from HTTP.
- Integration tests must use `WebApplicationFactory<Program>` and real HTTP calls.
- Verify success and failure status codes for all CRUD operations.
- Verify the singleton in-memory repository behaves deterministically across tests by resetting state per test.

### Frontend test expectations
- Keep Angular unit tests on the existing `@angular/build:unit-test` runner with `runner: vitest`.
- `tsconfig.spec.json` must include the Vitest globals and jsdom types required for DOM-driven component tests.
- Component tests should verify control-flow rendering, emitted events, API-backed state updates, and error/empty/loading states.
- Use `provideHttpClient()` followed by `provideHttpClientTesting()` for specs that exercise HTTP services.

## 6. Acceptance criteria
- **AC-001 — Deviation data model exists.** Fulfilled by introducing a dedicated domain model plus DTO/request/command/query records carrying title, description, severity, status, and audit timestamps.
- **AC-002 — Backend exposes deviation CRUD endpoints with proper HTTP semantics.** Fulfilled by `DeviationEndpoints` implementing `GET`, `GET by id`, `POST`, `PUT`, and `DELETE` with typed results, 200/201/204 success codes, and 400/404 error handling.
- **AC-003 — Data persists in memory only.** Fulfilled by `InMemoryDeviationRepository` using a singleton `ConcurrentDictionary<Guid, Deviation>` registered in DI, with no database dependencies.
- **AC-004 — Angular UI allows create, view, edit, and delete workflows.** Fulfilled by the new standalone deviations page, embedded form component, selection/detail panel, and signal-driven store service.
- **AC-005 — Frontend uses modern Angular patterns.** Fulfilled by standalone lazy routes, `inject()`, Signals, built-in control flow (`@if`, `@for`), and zero NgModules/BehaviorSubjects.
- **AC-006 — UI is responsive and polished.** Fulfilled by Tailwind CSS v4 token-based theming in `styles.css`, responsive grid/flex layouts, semantic badge styling, and improved app-shell navigation.
- **AC-007 — Local frontend/backend integration works during development.** Fulfilled by adding the localhost CORS policy, standardizing launch profiles to ports 5000/5001, and keeping the Angular proxy/API paths aligned.
- **AC-008 — Automated tests cover the new feature.** Fulfilled by xUnit/Moq/FluentAssertions backend coverage and Angular Vitest component/service specs for the new UI state flows.

## 7. Bootstrap scripts
- `init-dev.sh` and `init-dev.ps1` are created in the workspace root.
- Both scripts must:
  - trust the HTTPS development certificate
  - restore `backend/GreenfieldArchitecture.sln`
  - install npm packages in `frontend`
  - end with a message directing developers to run `dotnet run --project backend/src/GreenfieldArchitecture.Api`
- These scripts are part of the planned deliverable and are listed in Section 2.
