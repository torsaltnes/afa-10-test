# IMPLEMENTATION_PLAN

## Feature
**FEAT-002 — Deviation / Non-conformity Management Feature**

## Objective
Deliver end-to-end CRUD support for deviations/non-conformities through a new Angular 20 feature area and a .NET 10 REST API, using the repository’s existing layered structure while aligning all new work to the mandated Angular 20, Tailwind CSS 4, and ASP.NET Core Minimal API conventions.

## Current-State Summary
- The repository is a greenfield baseline with only a health-check feature implemented.
- Frontend stack: Angular 20 standalone app, Tailwind CSS 4, Vitest.
- Backend stack: .NET 10 solution with Domain / Application / Infrastructure / API layers, Minimal hosting, xUnit integration tests.
- Current backend `Program.cs` unconditionally calls `UseHttpsRedirection()`, which must be corrected for development per project standards.
- No deviation/non-conformity domain, API, or UI currently exists.

## Architectural Decisions
1. **Backend API will use Minimal APIs, not MVC controllers.**
   - Although the requirement text mentions `DeviationsController`, the project standard explicitly requires Minimal API endpoint groups.
   - The feature will still satisfy the required routes: `GET /api/deviations`, `GET /api/deviations/{id}`, `POST /api/deviations`, `PUT /api/deviations/{id}`, `DELETE /api/deviations/{id}`.
2. **In-memory persistence will be implemented via a singleton repository backed by `ConcurrentDictionary<Guid, Deviation>`.**
   - Meets the requirement for non-persistent storage.
   - Avoids controller/service lifetime mismatches.
3. **All new frontend state will use Angular signals.**
   - No `BehaviorSubject`-based state for this feature.
4. **All new UI will use standalone components and built-in Angular control flow.**
5. **Tailwind theming/customization will stay CSS-first in `styles.css` using `@theme`.**

## Functional Scope
The feature must support:
- List all deviations
- View a single deviation
- Create a deviation
- Edit a deviation
- Delete a deviation
- Present severity and status clearly in the UI
- Validate required user input
- Surface loading, empty, success, and error states

## Data Model

### Backend Domain Entity
`Deviation`
- `Id: Guid`
- `Title: string`
- `Description: string`
- `Severity: DeviationSeverity`
- `Status: DeviationStatus`
- `ReportedBy: string`
- `ReportedAt: DateTimeOffset`
- `UpdatedAt: DateTimeOffset`

### Enums
`DeviationSeverity`
- `Low`
- `Medium`
- `High`
- `Critical`

`DeviationStatus`
- `Open`
- `InProgress`
- `Resolved`
- `Closed`

### API Contracts
Use C# `record` types for all request/response DTOs.
- `DeviationDto`
- `CreateDeviationRequest`
- `UpdateDeviationRequest`

### Serialization Decision
Configure JSON enum serialization as **strings**, not numeric values, so Angular can bind directly to readable enum names without client-side mapping ambiguity.

## Backend Design

### Domain Layer
Create a new `Deviations` feature folder in `GreenfieldArchitecture.Domain` for:
- `Deviation`
- `DeviationSeverity`
- `DeviationStatus`

Responsibilities:
- Represent the canonical business object.
- Keep invariants simple and explicit.
- Avoid framework concerns.

### Application Layer
Create a new `Deviations` feature folder in `GreenfieldArchitecture.Application`.

Planned components:
- `Abstractions/IDeviationRepository`
- `Abstractions/IDeviationService`
- `Contracts/DeviationDto`
- `Contracts/CreateDeviationRequest`
- `Contracts/UpdateDeviationRequest`
- `Mappings/DeviationMappings` (or equivalent mapper helper)
- `Services/DeviationService`

Service responsibilities:
- Orchestrate CRUD operations.
- Validate required string fields with `ArgumentException.ThrowIfNullOrWhiteSpace`.
- Set `ReportedAt` and `UpdatedAt` on create.
- Preserve `ReportedAt` and refresh `UpdatedAt` on update.
- Return `null`/result objects for missing records so the API layer can map to `404`.
- Use primary constructor injection.
- Use `ConfigureAwait(false)` in library projects.

Validation baseline:
- `Title`, `Description`, `ReportedBy` required
- `Severity` must be a defined enum value
- `Status` must be a defined enum value

### Infrastructure Layer
Create a `Deviations` feature folder in `GreenfieldArchitecture.Infrastructure`.

Planned component:
- `Repositories/InMemoryDeviationRepository`

Repository behavior:
- Register as singleton.
- Store items in `ConcurrentDictionary<Guid, Deviation>`.
- Implement async CRUD methods.
- Return collection ordered by most recently updated first for better UI usability.
- Keep implementation intentionally simple and in-memory only.

### API Layer
Create a `Deviations` feature folder in `GreenfieldArchitecture.Api`.

Planned components:
- `Endpoints/DeviationEndpoints.cs`
- service registration updates in existing API extension file(s)
- `Program.cs` updates
- `Properties/launchSettings.json` create/update

#### Endpoint Group
Map `/api/deviations` through `MapGroup()` and `.WithTags("Deviations")`.

#### Endpoint Contracts
- `GET /api/deviations`
  - `200 OK` with `IReadOnlyList<DeviationDto>`
- `GET /api/deviations/{id}`
  - `200 OK` with `DeviationDto`
  - `404 Not Found` when absent
- `POST /api/deviations`
  - `201 Created` with created `DeviationDto`
  - `400 Bad Request` for invalid payload
- `PUT /api/deviations/{id}`
  - `200 OK` with updated `DeviationDto`
  - `404 Not Found` when absent
  - `400 Bad Request` for invalid payload
- `DELETE /api/deviations/{id}`
  - `204 No Content` on success
  - `404 Not Found` when absent

#### API Implementation Rules
- Use Minimal API handlers exclusively.
- Use `TypedResults` / typed union results.
- Keep handlers thin; delegate logic to `IDeviationService`.
- Tag endpoints for OpenAPI.
- Accept `CancellationToken` in async handlers.

### Cross-Cutting Backend Changes
1. **CORS**
   - Add default policy allowing:
     - `http://localhost:4200`
     - `https://localhost:4200`
   - Required so Angular can call the API during development.
2. **HTTPS redirection**
   - Change `Program.cs` to call `UseHttpsRedirection()` only when `!app.Environment.IsDevelopment()`.
3. **launchSettings**
   - Ensure `backend/src/GreenfieldArchitecture.Api/Properties/launchSettings.json` contains:
     - HTTP profile on port `5000`
     - HTTPS profile on port `5001` and `5000`
4. **OpenAPI**
   - Keep development OpenAPI exposure.
5. **Service registration**
   - Register deviation service as scoped.
   - Register in-memory deviation repository as singleton.

## Frontend Design

### Routing Strategy
Add a lazy-loaded standalone route for the deviations feature, likely under:
- `/deviations`

Routing updates should preserve the current standalone routing style already used by the app.

### Frontend Models
Create shared client models under `frontend/src/app/core/models`:
- `deviation.model.ts`
- `deviation-severity.type.ts` or equivalent
- `deviation-status.type.ts` or equivalent

Prefer string-based types/enums matching backend JSON values.

### API Service
Create `frontend/src/app/core/services/deviation-api.service.ts`.

Responsibilities:
- Use `inject(HttpClient)`.
- Expose CRUD methods for `/api/deviations`.
- Keep transport logic isolated from components.
- Return typed observables/promises as appropriate for the app’s existing pattern.

### Feature Composition
Create a new feature folder under `frontend/src/app/features/deviations`.

Recommended component split:
- `deviations-page.component.ts`
  - smart/container component
  - owns signals for screen state
  - loads list data
  - coordinates create/edit/delete flows
- `deviation-list.component.ts`
  - table rendering
  - emits edit/delete/view actions
- `deviation-form.component.ts`
  - create/edit form
  - reactive form with validation
  - receives mode + initial value through signal inputs
- optional presentational helpers:
  - `deviation-status-badge.component.ts`
  - `deviation-severity-badge.component.ts`
  - `delete-confirmation.component.ts`

### State Management
Use Angular signals as the primary state primitive.

Suggested state shape in the container component:
- `deviations = signal<DeviationModel[]>([])`
- `selectedDeviationId = signal<string | null>(null)`
- `isLoading = signal<boolean>(false)`
- `errorMessage = signal<string | null>(null)`
- `isEditorOpen = signal<boolean>(false)`
- `editorMode = signal<'create' | 'edit'>('create')`

Use `computed()` for:
- sorted rows
- selected deviation lookup
- empty-state visibility
- form title / submit label

Use `@if`, `@else`, and `@for` in templates; do not use `*ngIf` or `*ngFor`.

### Form Design
Use Angular reactive forms for data entry.

Form fields:
- Title
- Description
- Severity
- Status
- ReportedBy

Behavior:
- In create mode, initialize sensible defaults (for example `Status = Open`).
- In edit mode, prefill the selected deviation.
- Disable submit while invalid or while save is pending.
- Surface inline validation messages.

### UX Requirements
The feature UI should include:
- Page header and feature description
- Primary action to create a deviation
- Readable table/list of deviations
- Severity/status badges with visual differentiation
- Empty state when no deviations exist
- Loading indicator while fetching
- Error banner/toast area for failed requests
- Delete confirmation before destructive action

### Styling Strategy
Use Tailwind CSS 4 utilities and CSS-first theming.

Planned styling changes:
- Extend `frontend/src/styles.css` with `@theme` tokens for deviation severity/status colors if needed.
- Use semantic utility composition for:
  - page layout
  - cards/panels
  - table spacing
  - form field spacing
  - button hierarchy
- Use `gap-*` utilities for layout spacing.
- Support dark mode with `dark:` variants where existing app styling allows.
- Avoid hardcoded color hex values in templates; prefer theme tokens.

## Testing Strategy

### Backend Application Tests
Add unit tests for `DeviationService` covering:
- create sets timestamps and id
- list returns all items
- get by id returns record when present
- get by id returns missing result when absent
- update preserves `ReportedAt` and changes `UpdatedAt`
- delete removes record
- validation failures for missing required fields

Use:
- xUnit
- FluentAssertions
- Moq

### Backend API Integration Tests
Add `WebApplicationFactory<Program>` tests covering:
- `GET /api/deviations` returns `200`
- `POST /api/deviations` creates a record and returns `201`
- `GET /api/deviations/{id}` returns created record
- `PUT /api/deviations/{id}` updates fields
- `DELETE /api/deviations/{id}` returns `204`
- missing id paths return `404`
- invalid payload returns `400`

### Frontend Tests
Add Vitest-based tests for:
- API service request mapping
- container component loading/success/error state transitions
- form validation rules
- create/edit mode switching
- delete confirmation behavior
- rendering of empty state and populated table

## Implementation Sequence
1. Add backend domain enums/entity.
2. Add application contracts, abstractions, mappings, and service.
3. Add in-memory repository implementation.
4. Register services/repository in API composition root.
5. Add Minimal API endpoint group for deviations.
6. Update `Program.cs` for endpoint mapping, CORS, and conditional HTTPS redirection.
7. Create/update `launchSettings.json` with required HTTP/HTTPS profiles.
8. Add backend unit and integration tests.
9. Add frontend models and API service.
10. Add deviations feature route and standalone components.
11. Add reactive form handling, signal-based screen state, and CRUD interactions.
12. Update Tailwind theme tokens/styles if required.
13. Add frontend tests.
14. Run full backend/frontend test suite and smoke-test CRUD manually.

## Planned Files

### Backend — Create
- `backend/src/GreenfieldArchitecture.Domain/Deviations/Deviation.cs`
- `backend/src/GreenfieldArchitecture.Domain/Deviations/DeviationSeverity.cs`
- `backend/src/GreenfieldArchitecture.Domain/Deviations/DeviationStatus.cs`
- `backend/src/GreenfieldArchitecture.Application/Deviations/Abstractions/IDeviationRepository.cs`
- `backend/src/GreenfieldArchitecture.Application/Deviations/Abstractions/IDeviationService.cs`
- `backend/src/GreenfieldArchitecture.Application/Deviations/Contracts/DeviationDto.cs`
- `backend/src/GreenfieldArchitecture.Application/Deviations/Contracts/CreateDeviationRequest.cs`
- `backend/src/GreenfieldArchitecture.Application/Deviations/Contracts/UpdateDeviationRequest.cs`
- `backend/src/GreenfieldArchitecture.Application/Deviations/Mappings/DeviationMappings.cs`
- `backend/src/GreenfieldArchitecture.Application/Deviations/Services/DeviationService.cs`
- `backend/src/GreenfieldArchitecture.Infrastructure/Deviations/Repositories/InMemoryDeviationRepository.cs`
- `backend/src/GreenfieldArchitecture.Api/Endpoints/DeviationEndpoints.cs`
- `backend/src/GreenfieldArchitecture.Api/Properties/launchSettings.json` (if missing)
- `backend/tests/GreenfieldArchitecture.Application.Tests/Deviations/DeviationServiceTests.cs`
- `backend/tests/GreenfieldArchitecture.Api.Tests/Deviations/DeviationEndpointsTests.cs`

### Backend — Modify
- `backend/src/GreenfieldArchitecture.Api/Program.cs`
- existing API DI/extension registration file(s) under `backend/src/GreenfieldArchitecture.Api/Extensions/`
- existing project files only if new source inclusion is required

### Frontend — Create
- `frontend/src/app/core/models/deviation.model.ts`
- `frontend/src/app/core/models/deviation-severity.type.ts`
- `frontend/src/app/core/models/deviation-status.type.ts`
- `frontend/src/app/core/services/deviation-api.service.ts`
- `frontend/src/app/features/deviations/deviations-page.component.ts`
- `frontend/src/app/features/deviations/deviations-page.component.html`
- `frontend/src/app/features/deviations/deviation-list.component.ts`
- `frontend/src/app/features/deviations/deviation-form.component.ts`
- optional badge/confirmation helper components as needed
- `frontend/src/app/core/services/deviation-api.service.spec.ts`
- `frontend/src/app/features/deviations/deviations-page.component.spec.ts`
- `frontend/src/app/features/deviations/deviation-form.component.spec.ts`

### Frontend — Modify
- frontend route definition file(s) to register `/deviations`
- `frontend/src/styles.css` for any new `@theme` tokens
- existing navigation/home page component if a link to the feature is required

## Risks / Open Questions
- The supplied requirement excerpt is truncated, so any unstated UI details should be validated before implementation begins.
- If the current frontend route/navigation shell is intentionally minimal, adding discoverable navigation may require one extra shared-layout change.
- In-memory storage means all data resets on restart; this is acceptable only if the requirement remains explicitly non-persistent.
- If the existing API serializes enums numerically today, enabling string enums is a deliberate contract improvement and should be applied consistently for the new feature.

## Definition of Done
The feature is complete when:
- all required deviation CRUD endpoints exist under `/api/deviations`
- the Angular app exposes a working deviations UI for create/read/update/delete
- new backend and frontend tests pass
- local Angular-to-API development works via CORS
- development startup works over HTTP without forced HTTPS redirects
- implementation follows Angular 20 standalone/signals conventions, Tailwind CSS 4 CSS-first theming, and .NET 10 Minimal API/Clean Architecture patterns
