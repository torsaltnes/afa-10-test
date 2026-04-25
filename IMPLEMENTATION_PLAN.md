# IMPLEMENTATION_PLAN.md

## 1. Overview
Implement a greenfield deviation / non-conformity management slice with a Clean Architecture .NET 10 backend and an Angular 18+ frontend.
The backend exposes REST CRUD endpoints over an in-memory repository, with validation, not-found handling, and CORS for the Angular client.
The frontend uses Angular standalone components, Signals, routing, HttpClient, and Tailwind CSS v4 to deliver list/create/edit workflows.
The feature stays intentionally lightweight: no database, no authentication, and no audit/history scope.

## 2. Folder structure and files to create

### Root
```text
.gitignore                                                   (create)
Directory.Build.props                                        (create)
DeviationManagement.sln                                      (create)

backend/src/DeviationManagement.Domain/DeviationManagement.Domain.csproj                 (create)
backend/src/DeviationManagement.Domain/Entities/Deviation.cs                             (create)
backend/src/DeviationManagement.Domain/Enums/DeviationSeverity.cs                        (create)
backend/src/DeviationManagement.Domain/Enums/DeviationStatus.cs                          (create)

backend/src/DeviationManagement.Application/DeviationManagement.Application.csproj       (create)
backend/src/DeviationManagement.Application/Abstractions/Persistence/IDeviationRepository.cs (create)
backend/src/DeviationManagement.Application/Abstractions/Services/IDeviationService.cs   (create)
backend/src/DeviationManagement.Application/DTOs/DeviationDto.cs                         (create)
backend/src/DeviationManagement.Application/DTOs/SaveDeviationRequest.cs                 (create)
backend/src/DeviationManagement.Application/Validation/DeviationValidator.cs             (create)
backend/src/DeviationManagement.Application/Services/DeviationService.cs                 (create)

backend/src/DeviationManagement.Infrastructure/DeviationManagement.Infrastructure.csproj (create)
backend/src/DeviationManagement.Infrastructure/DependencyInjection.cs                    (create)
backend/src/DeviationManagement.Infrastructure/Persistence/InMemory/InMemoryDeviationRepository.cs (create)

backend/src/DeviationManagement.Api/DeviationManagement.Api.csproj                       (create)
backend/src/DeviationManagement.Api/Program.cs                                           (create)
backend/src/DeviationManagement.Api/appsettings.json                                     (create)
backend/src/DeviationManagement.Api/appsettings.Development.json                         (create)
backend/src/DeviationManagement.Api/Properties/launchSettings.json                       (create)
backend/src/DeviationManagement.Api/Controllers/DeviationsController.cs                  (create)
backend/src/DeviationManagement.Api/Contracts/Requests/SaveDeviationApiRequest.cs        (create)
backend/src/DeviationManagement.Api/Contracts/Responses/DeviationApiResponse.cs          (create)
backend/src/DeviationManagement.Api/Mapping/DeviationApiMapper.cs                        (create)

backend/tests/DeviationManagement.UnitTests/DeviationManagement.UnitTests.csproj         (create)
backend/tests/DeviationManagement.UnitTests/Application/Services/DeviationServiceTests.cs (create)
backend/tests/DeviationManagement.UnitTests/Application/Validation/DeviationValidatorTests.cs (create)
backend/tests/DeviationManagement.UnitTests/Api/Controllers/DeviationsControllerTests.cs (create)

frontend/package.json                                            (create)
frontend/package-lock.json                                       (create)
frontend/angular.json                                            (create)
frontend/postcss.config.mjs                                      (create)
frontend/tsconfig.json                                           (create)
frontend/tsconfig.app.json                                       (create)
frontend/tsconfig.spec.json                                      (create)
frontend/karma.conf.js                                           (create)
frontend/src/index.html                                          (create)
frontend/src/main.ts                                             (create)
frontend/src/test.ts                                             (create)
frontend/src/styles.css                                          (create)
frontend/src/environments/environment.ts                         (create)
frontend/src/environments/environment.development.ts             (create)
frontend/src/app/app.component.ts                                (create)
frontend/src/app/app.component.html                              (create)
frontend/src/app/app.component.css                               (create)
frontend/src/app/app.config.ts                                   (create)
frontend/src/app/app.routes.ts                                   (create)
frontend/src/app/core/models/deviation.model.ts                  (create)
frontend/src/app/core/models/deviation-form.model.ts             (create)
frontend/src/app/core/services/deviation-api.service.ts          (create)
frontend/src/app/core/services/deviation-api.service.spec.ts     (create)
frontend/src/app/features/deviations/data/deviation.store.ts     (create)
frontend/src/app/features/deviations/deviation-list/deviation-list.component.ts        (create)
frontend/src/app/features/deviations/deviation-list/deviation-list.component.html      (create)
frontend/src/app/features/deviations/deviation-list/deviation-list.component.css       (create)
frontend/src/app/features/deviations/deviation-list/deviation-list.component.spec.ts   (create)
frontend/src/app/features/deviations/deviation-form/deviation-form.component.ts        (create)
frontend/src/app/features/deviations/deviation-form/deviation-form.component.html      (create)
frontend/src/app/features/deviations/deviation-form/deviation-form.component.css       (create)
frontend/src/app/features/deviations/deviation-form/deviation-form.component.spec.ts   (create)
frontend/src/app/shared/ui/deviation-badge/deviation-badge.component.ts                (create)
frontend/src/app/shared/ui/deviation-badge/deviation-badge.component.html              (create)
frontend/src/app/shared/ui/deviation-badge/deviation-badge.component.css               (create)
```

## 3. Detailed implementation instructions per file

### Root files
- `.gitignore`
  - Ignore `backend/**/bin`, `backend/**/obj`, `frontend/node_modules`, `frontend/dist`, coverage output, IDE folders.
- `Directory.Build.props`
  - Apply backend-wide defaults: `TargetFramework=net10.0`, `Nullable=enable`, `ImplicitUsings=enable`, analyzers enabled.
- `DeviationManagement.sln`
  - Include all backend projects and the unit test project.

### Domain layer
- `backend/src/DeviationManagement.Domain/DeviationManagement.Domain.csproj`
  - Class library with no infrastructure references.
- `Entities/Deviation.cs`
  - `Deviation` aggregate/entity using a primary constructor.
  - Required members: `Id`, `Title`, `Description`, `Severity`, `Status`, plus every user-defined field mandated by AC-001.
  - Required behavior: `Update(...)` method to apply edits without leaking persistence concerns.
- `Enums/DeviationSeverity.cs`
  - Enum used by both backend and frontend contracts for badge coloring and filtering.
- `Enums/DeviationStatus.cs`
  - Enum used by both backend and frontend contracts for workflow state.

### Application layer
- `backend/src/DeviationManagement.Application/DeviationManagement.Application.csproj`
  - Reference Domain only.
- `Abstractions/Persistence/IDeviationRepository.cs`
  - Interface methods: `Task<IReadOnlyCollection<Deviation>> GetAllAsync(...)`, `Task<Deviation?> GetByIdAsync(Guid id, ...)`, `Task<Deviation> CreateAsync(Deviation entity, ...)`, `Task<Deviation?> UpdateAsync(Deviation entity, ...)`, `Task<bool> DeleteAsync(Guid id, ...)`.
- `Abstractions/Services/IDeviationService.cs`
  - Interface methods: `GetAllAsync`, `GetByIdAsync`, `CreateAsync`, `UpdateAsync`, `DeleteAsync`.
- `DTOs/DeviationDto.cs`
  - Immutable application DTO returned to API; mirror the FEAT-002 response shape.
- `DTOs/SaveDeviationRequest.cs`
  - Immutable application command DTO used for create and update; contain all editable FEAT-002 fields.
- `Validation/DeviationValidator.cs`
  - Central validation component with methods like `ValidateForSave(SaveDeviationRequest request)`.
  - Return a structured result (dictionary/list of field errors) used by service and controller.
- `Services/DeviationService.cs`
  - Service with primary constructor injection of `IDeviationRepository` and `DeviationValidator`.
  - Responsibilities:
    - enforce validation rules
    - translate repository results to DTOs
    - generate new `Guid` values for create
    - return not-found outcomes for update/delete/get-by-id
    - keep business logic out of controller

### Infrastructure layer
- `backend/src/DeviationManagement.Infrastructure/DeviationManagement.Infrastructure.csproj`
  - Reference Application and Domain.
- `DependencyInjection.cs`
  - Static extension method `AddInfrastructure(this IServiceCollection services)`.
  - Register `InMemoryDeviationRepository` as singleton to preserve state for app lifetime.
- `Persistence/InMemory/InMemoryDeviationRepository.cs`
  - Use `ConcurrentDictionary<Guid, Deviation>`.
  - Implement repository contract.
  - Clone/replace stored entities on update to avoid accidental shared mutable state bugs.

### API layer
- `backend/src/DeviationManagement.Api/DeviationManagement.Api.csproj`
  - ASP.NET Core Web API project referencing Application and Infrastructure.
- `Program.cs`
  - Controller-based host.
  - Register controllers, ProblemDetails, CORS, application services, infrastructure services.
  - Define named CORS policy for `http://localhost:4200`.
  - Use `UseExceptionHandler()`, `UseCors(...)`, `MapControllers()`.
- `appsettings.json`
  - Add `Cors:AllowedOrigins` array and logging defaults.
- `appsettings.Development.json`
  - Development overrides only; keep localhost origin explicit.
- `Properties/launchSettings.json`
  - Expose HTTP profile on port `5000` to match acceptance criteria.
- `Controllers/DeviationsController.cs`
  - API controller with primary constructor injection of `IDeviationService`.
  - Route: `api/deviations`.
  - Actions:
    - `GET /api/deviations`
    - `GET /api/deviations/{id}`
    - `POST /api/deviations`
    - `PUT /api/deviations/{id}`
    - `DELETE /api/deviations/{id}`
  - Return `200`, `201`, `204`, `400`, `404` as appropriate.
  - Use `ProblemDetails`/`ValidationProblem` for errors.
- `Contracts/Requests/SaveDeviationApiRequest.cs`
  - API request contract for create/update.
  - Keep transport concerns here instead of exposing application/domain types directly.
- `Contracts/Responses/DeviationApiResponse.cs`
  - API response contract for list/detail responses.
- `Mapping/DeviationApiMapper.cs`
  - Static mapper between API contracts and application DTOs.

### Backend test project
- `backend/tests/DeviationManagement.UnitTests/DeviationManagement.UnitTests.csproj`
  - xUnit test project referencing Application and Api projects.
  - Include Moq and test SDK packages.
- `Application/Services/DeviationServiceTests.cs`
  - Test service behavior with Moq repository doubles.
  - Required tests:
    - create returns DTO with generated id
    - invalid input returns validation failure
    - update on missing id returns not-found result
    - delete returns false when item does not exist
    - repository methods invoked exactly once where expected
- `Application/Validation/DeviationValidatorTests.cs`
  - `[Theory]` tests for each required field, enum validity, max lengths, and any date/state rules from FEAT-002.
- `Api/Controllers/DeviationsControllerTests.cs`
  - Test translation of service results into HTTP results.
  - Verify `OkObjectResult`, `CreatedAtActionResult`, `NoContentResult`, `NotFoundResult`, `BadRequestObjectResult`/`ObjectResult` as applicable.

### Frontend workspace/config
- `frontend/package.json`
  - Create a standalone Angular app definition; no NgModule-based scaffolding.
  - Scripts: `start`, `build`, `test`, `lint` (if linting is added later).
- `frontend/package-lock.json`
  - Generated by `npm install`; commit to source control.
- `frontend/angular.json`
  - Configure application build/test targets.
  - Ensure `styles` includes `src/styles.css`.
  - Ensure test target picks up `src/test.ts`, `karma.conf.js`, and `tsconfig.spec.json`.
- `frontend/postcss.config.mjs`
  - Export PostCSS config using `"@tailwindcss/postcss": {}`.
- `frontend/tsconfig.json`
  - Base TypeScript config.
- `frontend/tsconfig.app.json`
  - App build config.
- `frontend/tsconfig.spec.json`
  - Include `src/**/*.spec.ts` and `src/**/*.d.ts`.
  - Set `types` to include `jasmine`.
- `frontend/karma.conf.js`
  - Jasmine/Karma runner config.
  - Include plugins for Jasmine, Chrome launcher, HTML reporter, coverage, and Angular build plugin.

### Frontend bootstrap and global styling
- `frontend/src/index.html`
  - Standard host page with app root.
- `frontend/src/main.ts`
  - Bootstrap with `bootstrapApplication(AppComponent, appConfig)`.
- `frontend/src/test.ts`
  - Initialize Angular testing environment for standalone component specs.
- `frontend/src/styles.css`
  - Import Tailwind via `@import "tailwindcss";`.
  - Define shared utility classes/theme tokens for page shell, cards, buttons, form controls, and badge colors.
- `frontend/src/environments/environment.ts`
  - Production-safe default config with `apiBaseUrl`.
- `frontend/src/environments/environment.development.ts`
  - Development config pointing to `http://localhost:5000/api`.

### Frontend app shell
- `frontend/src/app/app.component.ts`
  - Standalone root component importing `RouterOutlet`.
  - Keep minimal; layout shell only.
- `frontend/src/app/app.component.html`
  - Router host plus shared page container.
- `frontend/src/app/app.component.css`
  - Minimal component-local layout styles; rely mostly on Tailwind utilities.
- `frontend/src/app/app.config.ts`
  - Provide router and HttpClient via `provideRouter(routes)` and `provideHttpClient()`.
- `frontend/src/app/app.routes.ts`
  - Routes:
    - redirect `''` -> `/deviations`
    - `/deviations`
    - `/deviations/new`
    - `/deviations/:id/edit`

### Frontend core models/services
- `frontend/src/app/core/models/deviation.model.ts`
  - TypeScript interface/type for API response shape.
  - Include `id`, `title`, `description`, `severity`, `status`, and remaining FEAT-002 fields.
- `frontend/src/app/core/models/deviation-form.model.ts`
  - Type representing create/update payload.
- `frontend/src/app/core/services/deviation-api.service.ts`
  - Service methods: `getAll()`, `getById(id)`, `create(payload)`, `update(id, payload)`, `delete(id)`.
  - Keep HTTP-only concerns here.
- `frontend/src/app/core/services/deviation-api.service.spec.ts`
  - Use `provideHttpClient()` before `provideHttpClientTesting()`.
  - Verify correct HTTP verbs, URLs, and payload mapping.

### Frontend feature state and UI
- `frontend/src/app/features/deviations/data/deviation.store.ts`
  - Signal-based feature store.
  - Signals: `deviations`, `selectedDeviation`, `loading`, `saving`, `error`.
  - Computed values: `hasItems`, `isEmpty`, optional grouped badge metadata.
  - Methods: `loadAll()`, `loadById(id)`, `create(payload)`, `update(id, payload)`, `remove(id)`, `clearError()`.
- `frontend/src/app/features/deviations/deviation-list/deviation-list.component.ts`
  - Standalone list component.
  - Import `RouterLink`, shared badge component, common Angular primitives.
  - On init, call store `loadAll()`.
  - Methods: `trackById`, `deleteDeviation`, `retry`.
- `frontend/src/app/features/deviations/deviation-list/deviation-list.component.html`
  - Render title/header, create button, empty/loading/error states, and list/table/cards of deviations.
  - Show color-coded badges for severity/status.
- `frontend/src/app/features/deviations/deviation-list/deviation-list.component.css`
  - Only small local overrides; Tailwind-first styling.
- `frontend/src/app/features/deviations/deviation-list/deviation-list.component.spec.ts`
  - Test render success, empty state, loading/error state, and navigation/delete interactions.
- `frontend/src/app/features/deviations/deviation-form/deviation-form.component.ts`
  - Standalone reactive form component.
  - Determine mode from route params.
  - Methods: `buildForm()`, `loadForEdit(id)`, `submit()`, `cancel()`.
  - Use validators matching backend rules.
  - On edit mode, prefill form from API/store.
- `frontend/src/app/features/deviations/deviation-form/deviation-form.component.html`
  - Render create/edit heading, form fields for every editable FEAT-002 property, validation messages, save/cancel actions.
- `frontend/src/app/features/deviations/deviation-form/deviation-form.component.css`
  - Small local overrides only.
- `frontend/src/app/features/deviations/deviation-form/deviation-form.component.spec.ts`
  - Test create mode defaults, edit mode prefill, validation messaging, and submit behavior.
- `frontend/src/app/shared/ui/deviation-badge/deviation-badge.component.ts`
  - Standalone reusable badge component.
  - Inputs: `label`, `kind` (`status` or `severity`).
  - Computed class mapping for consistent color application.
- `frontend/src/app/shared/ui/deviation-badge/deviation-badge.component.html`
  - Accessible badge markup.
- `frontend/src/app/shared/ui/deviation-badge/deviation-badge.component.css`
  - Minimal fallback styles only if needed.

## 4. Dependencies

### Backend NuGet packages
```text
backend/src/DeviationManagement.Api/DeviationManagement.Api.csproj
- Microsoft.AspNetCore.OpenApi 10.0.7

backend/tests/DeviationManagement.UnitTests/DeviationManagement.UnitTests.csproj
- Microsoft.NET.Test.Sdk 18.5.0
- xunit 2.9.3
- xunit.runner.visualstudio 3.1.5
- Moq 4.20.72
- coverlet.collector 10.0.0
```

### Frontend npm packages
```text
dependencies
- @angular/common 21.2.10
- @angular/compiler 21.2.10
- @angular/core 21.2.10
- @angular/forms 21.2.10
- @angular/platform-browser 21.2.10
- @angular/router 21.2.10
- rxjs 7.8.2
- tslib 2.8.1
- zone.js 0.16.1
- tailwindcss 4.2.4
- @tailwindcss/postcss 4.2.4
- postcss 8.5.10

devDependencies
- @angular-devkit/build-angular 21.2.8
- @angular/cli 21.2.8
- @angular/compiler-cli 21.2.10
- typescript 5.9.3
- jasmine-core 6.2.0
- @types/jasmine 6.0.0
- karma 6.4.4
- karma-chrome-launcher 3.2.0
- karma-coverage 2.2.1
- karma-jasmine 5.1.0
- karma-jasmine-html-reporter 2.2.0
```

## 5. Automated tests

### Backend test files
```text
backend/tests/DeviationManagement.UnitTests/Application/Services/DeviationServiceTests.cs
backend/tests/DeviationManagement.UnitTests/Application/Validation/DeviationValidatorTests.cs
backend/tests/DeviationManagement.UnitTests/Api/Controllers/DeviationsControllerTests.cs
```

### Angular test files
```text
frontend/src/app/core/services/deviation-api.service.spec.ts
frontend/src/app/features/deviations/deviation-list/deviation-list.component.spec.ts
frontend/src/app/features/deviations/deviation-form/deviation-form.component.spec.ts
```

### What to test
- Backend
  - service returns correct DTOs for create/read/update/delete
  - validation rejects missing/invalid required fields from AC-001
  - update/delete/get-by-id return not-found behavior for unknown ids
  - controller translates service outcomes to correct HTTP status codes
  - Moq verifies repository/service interaction counts
- Frontend
  - API service emits correct HTTP requests to `/api/deviations`
  - list component renders records, empty state, error state, and badge values
  - form component validates required fields before submit
  - form component distinguishes create vs edit mode from routing
  - edit mode fetches and pre-populates existing deviation data

## 6. Acceptance criteria

- **AC-001: Deviation object with all required fields**  
  Fulfilment: define one canonical deviation shape in backend Domain/Application/API contracts and mirror it in frontend models/forms.
- **AC-002: RESTful CRUD API with in-memory storage**  
  Fulfilment: implement `GET/GET by id/POST/PUT/DELETE` on `api/deviations`, backed by a singleton in-memory repository.
- **AC-003: Backend error handling**  
  Fulfilment: central validator plus ProblemDetails-based `400`/`404` responses.
- **AC-004: CORS enabled for frontend localhost**  
  Fulfilment: named CORS policy allowing `http://localhost:4200` from the API host on port `5000`.
- **AC-005: Angular frontend uses standalone components and Signals**  
  Fulfilment: bootstrap with `bootstrapApplication`, no NgModules, and a signal-based feature store.
- **AC-006: Frontend uses HttpClient for API integration**  
  Fulfilment: isolated `DeviationApiService` wrapping all HTTP access.
- **AC-007: Frontend routing supports feature flow**  
  Fulfilment: routes for list, create, and edit screens.
- **AC-008: List view exists**  
  Fulfilment: `deviation-list` component loads and renders all deviations with actions.
- **AC-009: Form UI exists for required fields**  
  Fulfilment: `deviation-form` component uses reactive forms and field-level validation messages.
- **AC-010: Create and edit modes both work**  
  Fulfilment: route-driven mode switch, blank defaults for create, prefilled values for edit.
- **AC-011: Tailwind CSS v4 is used**  
  Fulfilment: PostCSS-based Tailwind v4 setup and utility-first component styling.
- **AC-012: Colour-coded badges are shown**  
  Fulfilment: reusable badge component maps status/severity values to consistent Tailwind classes.
- **AC-013: UI is polished**  
  Fulfilment: responsive layout, clean cards/forms, and explicit loading/empty/error states.
- **AC-014: Solution compiles successfully**  
  Fulfilment: backend solution and frontend app each have complete project configuration and test/build scripts.
- **AC-015: Version-control workflow is respected**  
  Fulfilment: implementation should be delivered on branch `feature/FEAT-002-deviations` and committed with generated project files included.

## Implementation notes from current documentation lookup
- Angular documentation confirms standalone bootstrapping via `bootstrapApplication`, routing via `provideRouter`, and TestBed component tests importing standalone components directly.
- Angular HTTP testing guidance requires `provideHttpClient()` before `provideHttpClientTesting()`.
- ASP.NET Core documentation confirms controller-based startup with `WebApplication.CreateBuilder`, `AddCors`, `UseCors`, and named policies.
- Tailwind CSS v4 installation guidance uses `tailwindcss`, `@tailwindcss/postcss`, `postcss`, a PostCSS config file, and `@import "tailwindcss"` in the main stylesheet.
- xUnit documentation confirms `Fact`/`Theory` patterns; Moq should be used to verify repository/service interactions in unit tests.
