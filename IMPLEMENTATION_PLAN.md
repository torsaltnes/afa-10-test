# IMPLEMENTATION_PLAN.md

## 1. Feature Summary

**Feature:** Deviation / Non-conformity Management (`FEAT-002`)

Implement a full-stack deviation management workflow with:
- deviation list view with search, filters, badges, pagination, and export
- new deviation registration flow
- multi-step deviation processing workflow (`Register -> Assess -> Investigate -> Corrective Action -> Close`)
- activity timeline and attachment handling
- in-memory .NET 10 REST API with Angular 20 + Tailwind 4 frontend

This plan keeps the existing architecture intact:
- **Frontend:** Angular 20 standalone app with signals, lazy routes, Tailwind 4
- **Backend:** .NET 10 Minimal API + Clean Architecture (`Domain -> Application -> Infrastructure -> API`)
- **Storage:** in-memory repository backed by thread-safe collections

---

## 2. Relevant Existing Context

### Frontend
- `frontend/src/main.ts` already bootstraps with `bootstrapApplication()`.
- `frontend/src/app/app.config.ts` already uses `provideRouter()`, `provideHttpClient()`, and `provideCharts()`.
- `frontend/src/app/app.routes.ts` already lazy-loads feature pages through the shell.
- `frontend/src/app/layout/shell.component.ts` is the correct place to expose navigation to the new feature.
- `frontend/package.json` already includes Angular 20, Tailwind 4, `@tailwindcss/postcss`, `chart.js`, and `ng2-charts`.

### Backend
- `backend/src/Greenfield.Api/Program.cs` already configures CORS, OpenAPI, and endpoint wiring.
- `backend/src/Greenfield.Api/Endpoints/HealthEndpoints.cs` establishes the current endpoint-group pattern.
- `backend/src/Greenfield.Application/Extensions/ApplicationServiceExtensions.cs` and `backend/src/Greenfield.Infrastructure/Extensions/InfrastructureServiceExtensions.cs` are the correct extension points for new registrations.
- Existing backend structure already aligns with Clean Architecture.

### Visual Manifest Implications
The visual manifest and intake summary require:
- **desktop sidebar + mobile bottom-sheet filters**
- **desktop table + mobile card list**
- **color-coded status/severity badges**
- **two-column process screen with metadata sidebar**
- **horizontal workflow stepper**
- **timeline and attachment card**
- **OKLCH-based design tokens for blue/red/orange/green status system**

---

## 3. Architecture Decisions

1. **Do not introduce NgModules or external state libraries.**
   - Use Angular standalone components only.
   - Use signals, computed values, effects, and `resource()` / `rxResource()` style loading for async state.

2. **Do not introduce a database yet.**
   - Use an in-memory repository with `ConcurrentDictionary<Guid, Deviation>` plus deterministic seed data.
   - Shape the API as if it were backed by a real persistence layer so the repository can later be swapped for EF Core with minimal API changes.

3. **Keep the workflow explicit in the API.**
   - Use step-specific update endpoints instead of one giant polymorphic payload.
   - This keeps validation, activity logging, and future persistence rules clear.

4. **Treat export and attachments as first-class parts of the feature.**
   - Export will be handled through an API endpoint so filtering + pagination rules remain server-owned.
   - Attachments will be stored in memory with strict size limits and metadata in the detail DTO.

5. **No new UI component library.**
   - Build the experience with Tailwind utilities, CSS theme tokens, and native Angular forms.
   - Keep `ng2-charts`/`chart.js` unchanged; deviation screens should use summary cards rather than new charts in v1.

---

## 4. Target User Flows

### 4.1 List Flow
1. User opens `deviations` route.
2. Frontend loads lookup data and first page of deviations.
3. User can:
   - search by title / deviation number
   - filter by status, severity, category, responsible person, and date range
   - paginate results
   - export filtered results
   - open an existing deviation
   - start a new deviation

### 4.2 Registration Flow
1. User opens `deviations/new`.
2. User completes registration fields.
3. API creates the deviation, generates a human-readable deviation number, logs a `Registered` activity, and returns the created detail payload.
4. Frontend redirects to `deviations/:id?step=register`.

### 4.3 Processing Flow
1. User opens `deviations/:id`.
2. Frontend loads the detail DTO containing metadata, workflow step, timeline, and attachments.
3. User edits the active workflow section.
4. API validates and saves only the current section.
5. User advances step; API updates status/current step and appends activity entries.
6. Final close action sets closed state and closure timestamps.

---

## 5. Backend Design

### 5.1 Domain Model

Create a new `Deviations` domain slice under `backend/src/Greenfield.Domain/Deviations/`.

#### Core aggregate
`Deviation`
- `Id: Guid`
- `DeviationNumber: string` (example: `DEV-2026-0001`)
- `Title: string`
- `Description: string`
- `Category: string`
- `Severity: DeviationSeverity`
- `Status: DeviationStatus`
- `CurrentStep: DeviationWorkflowStep`
- `DiscoveryDate: DateTimeOffset`
- `Reporter: string`
- `ResponsiblePerson: string`
- `Deadline: DateTimeOffset?`
- `CreatedAt: DateTimeOffset`
- `UpdatedAt: DateTimeOffset`
- `ClosedAt: DateTimeOffset?`
- `Assessment: DeviationAssessment?`
- `Investigation: DeviationInvestigation?`
- `CorrectiveAction: DeviationCorrectiveAction?`
- `Closure: DeviationClosure?`
- `Attachments: IReadOnlyList<DeviationAttachment>`
- `Activity: IReadOnlyList<DeviationActivityEntry>`

#### Supporting records / value objects
- `DeviationAssessment`
- `DeviationInvestigation`
- `DeviationCorrectiveAction`
- `DeviationClosure`
- `DeviationAttachment`
- `DeviationActivityEntry`

#### Enums
- `DeviationSeverity`: `Low | Medium | High | Critical`
- `DeviationStatus`: `Open | InProgress | Closed`
- `DeviationWorkflowStep`: `Register | Assess | Investigate | CorrectiveAction | Close`
- `DeviationActivityType`: `Registered | Updated | Assigned | StepAdvanced | AttachmentAdded | Closed | Exported`

**Important:** configure string enum serialization at the API boundary so Angular receives readable values, not numeric enums.

### 5.2 Application Layer

Create application abstractions and DTOs under `backend/src/Greenfield.Application/Deviations/`.

#### Interfaces
- `IDeviationService`
- `IDeviationRepository`
- `IDeviationLookupProvider` (or equivalent lightweight abstraction)

#### Request records
Use `record` types for all request models:
- `CreateDeviationRequest`
- `SaveDeviationRegistrationRequest`
- `SaveDeviationAssessmentRequest`
- `SaveDeviationInvestigationRequest`
- `SaveDeviationCorrectiveActionRequest`
- `CloseDeviationRequest`
- `AdvanceDeviationStepRequest`
- `DeviationQueryRequest`

#### Response records
- `DeviationListItemDto`
- `DeviationDetailDto`
- `DeviationLookupDto`
- `DeviationAttachmentDto`
- `DeviationActivityDto`
- `PagedResultDto<T>`
- optional `ExportFileDto` only if an application-level wrapper is preferred

#### Service responsibilities
`DeviationService` should:
- validate all command payloads
- generate deviation numbers
- translate repository entities to DTOs
- enforce workflow transition rules
- append activity timeline entries automatically
- apply list filtering, search, sort, and pagination
- produce CSV export content for filtered results
- enforce attachment rules (allowed types, max size, metadata generation)

**Validation rules (minimum):**
- `Title`, `Category`, `Reporter`, `ResponsiblePerson` required
- `Description` required for registration
- `DiscoveryDate` required
- `Deadline >= DiscoveryDate` when provided
- cannot close unless corrective action exists
- step transitions must be sequential unless explicitly reopening is later approved

### 5.3 Infrastructure Layer

Create `backend/src/Greenfield.Infrastructure/Deviations/`.

#### Repository implementation
`InMemoryDeviationRepository`
- backed by `ConcurrentDictionary<Guid, Deviation>`
- maintain a thread-safe sequence counter for `DeviationNumber`
- expose async methods even though the implementation is in-memory
- preserve order by `CreatedAt desc` for list results unless an alternate sort is requested later

#### Seed data
`DeviationSeedData`
- preload representative records across all statuses and severities
- include enough data to exercise paging, filter states, timeline rendering, and badge colors
- include at least one record per workflow step

#### Lookup provider
Return static lists for:
- categories
- responsible people
- status options
- severity options
- workflow steps

### 5.4 API Layer

Add `backend/src/Greenfield.Api/Endpoints/DeviationEndpoints.cs` and wire it from `Program.cs`.

#### Endpoint group
- Base route: `/api/deviations`
- Apply `.WithTags("Deviations")`
- Keep endpoint handlers small; delegate business logic to `IDeviationService`

#### Proposed endpoints

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/deviations` | paged list with filters/search |
| `GET` | `/api/deviations/{id:guid}` | detail payload |
| `POST` | `/api/deviations` | create new deviation |
| `PUT` | `/api/deviations/{id:guid}/registration` | save registration section |
| `PUT` | `/api/deviations/{id:guid}/assessment` | save assessment section |
| `PUT` | `/api/deviations/{id:guid}/investigation` | save investigation section |
| `PUT` | `/api/deviations/{id:guid}/corrective-action` | save corrective action section |
| `PUT` | `/api/deviations/{id:guid}/closure` | close deviation |
| `POST` | `/api/deviations/{id:guid}/advance-step` | move to next workflow step |
| `POST` | `/api/deviations/{id:guid}/attachments` | upload attachment |
| `GET` | `/api/deviations/{id:guid}/attachments/{attachmentId:guid}` | download attachment |
| `GET` | `/api/deviations/lookups` | dropdown/filter options |
| `GET` | `/api/deviations/export` | CSV export of filtered results |

#### API behavior
- Use `TypedResults.Ok`, `Created`, `BadRequest`, `NotFound`, `ValidationProblem`.
- Keep `IResult` signatures in endpoint handlers.
- Use `JsonStringEnumConverter` for enum serialization.
- Return ISO 8601 strings for all dates.
- Keep CORS aligned with Angular localhost.

### 5.5 Program and Hosting Updates

Update `backend/src/Greenfield.Api/Program.cs` to:
- register deviation endpoints
- register deviation services/repositories in the existing extension methods
- keep `app.UseHttpsRedirection()` guarded by `!app.Environment.IsDevelopment()`
- preserve local Angular origins in CORS (`http://localhost:4200`, `https://localhost:4200`)
- keep OpenAPI enabled

Create or update `backend/src/Greenfield.Api/Properties/launchSettings.json` with:
- `http` profile on port `5000`
- `https` profile on port `5001` and `http://localhost:5000`

---

## 6. Frontend Design

### 6.1 Routing

Update `frontend/src/app/app.routes.ts` to add a new lazy feature under the shell:
- `/deviations` -> list page
- `/deviations/new` -> editor page in create mode
- `/deviations/:id` -> editor page in workflow/detail mode

Update `frontend/src/app/layout/shell.component.ts` to add a navigation entry for the deviation feature.

### 6.2 Feature Structure

Create a dedicated feature folder:

`frontend/src/app/features/deviations/`
- `deviations.page.ts` (list page)
- `deviation-editor.page.ts` (new + detail/process page)
- `components/`
  - `deviation-filter-panel.component.ts`
  - `deviation-table.component.ts`
  - `deviation-card-list.component.ts`
  - `deviation-form.component.ts`
  - `deviation-workflow-stepper.component.ts`
  - `deviation-metadata-sidebar.component.ts`
  - `deviation-activity-timeline.component.ts`
  - `deviation-attachments.component.ts`
- `data/`
  - `deviation-api.service.ts`
  - `deviation-list.store.ts`
  - `deviation-editor.store.ts`
- `models/`
  - `deviation.models.ts`
  - `deviation-filters.models.ts`

### 6.3 State Management

#### API service
`deviation-api.service.ts`
- `providedIn: 'root'`
- use `inject(HttpClient)`
- expose strongly typed methods for every endpoint
- no `BehaviorSubject`

#### List store
`deviation-list.store.ts`
- signals for filters, page, pageSize, search text, rows-per-page, filter drawer state
- `resource()` or `rxResource()` for list loading keyed by active filters/page
- computed values for badge counts, empty-state messaging, and current query string
- export action calls the CSV endpoint and triggers download

#### Editor store
`deviation-editor.store.ts`
- signal for current deviation id
- resource for detail loading
- signal for active workflow step, dirty state, saving state, attachment upload state
- methods to save each section and advance steps
- patch reactive forms from loaded data via `effect()`

### 6.4 Forms and Workflow

Use Angular Reactive Forms for the main editor because the workflow is form-heavy.

#### Registration section
Fields:
- title
- description
- category
- severity
- discovery date
- reporter
- responsible person
- deadline

#### Assessment section
Fields:
- impact summary
- immediate containment action
- assessed by
- assessed at

#### Investigation section
Fields:
- root cause
- investigation summary
- investigator
- investigated at

#### Corrective action section
Fields:
- action plan
- action owner
- target completion date
- verification notes

#### Closure section
Fields:
- closure summary
- verified by
- closed at

Use:
- `@if`, `@for`, `@switch`
- `OnPush`
- `inject()` instead of constructor injection
- `takeUntilDestroyed()` where subscriptions are unavoidable
- `@defer` for below-the-fold timeline and attachments panels

### 6.5 UI Composition from Visual Manifest

#### List page
- breadcrumb + title `Avviksliste`
- primary action `+ Nytt avvik`
- top search field
- inline quick filters
- advanced filter panel
- desktop table with zebra striping, hover states, chevron expansion
- mobile card list
- pagination footer
- export button

#### Filter panel
- desktop: left sidebar or persistent panel
- mobile: bottom-sheet / slide-up drawer controlled by a signal
- controls: status, category, responsible person, priority/severity, date from/to, reset/apply buttons

#### Editor page
- top breadcrumb
- workflow stepper
- left main form panel
- right metadata sidebar with status, severity, timestamps, and responsible person
- attachment card
- timeline component
- footer actions: save draft, next step, cancel

### 6.6 Styling Strategy (Tailwind 4)

Update `frontend/src/styles.css` (or the stylesheet configured by `frontend/angular.json`) to ensure:
- `@import "tailwindcss"`
- `@source "./src/app/**/*.ts"`
- design tokens in `@theme`

Add/confirm tokens for:
- `--color-primary`
- `--color-danger`
- `--color-warning`
- `--color-success`
- `--color-surface`
- `--color-surface-muted`
- `--color-border`
- spacing/radius/shadow tokens for cards, filters, tables, and stepper pills

Use these tokens to drive:
- status badges (`Open`, `InProgress`, `Closed`)
- severity badges (`Low`, `Medium`, `High`, `Critical`)
- active/completed/inactive stepper states
- desktop/mobile surface consistency

### 6.7 Accessibility and Responsiveness

Mandatory implementation details:
- all controls must have labels
- stepper must be keyboard reachable
- filter drawer must support focus management and dismiss actions
- color-coded states must always include text labels
- mobile card layout must preserve table meaning via explicit field labels
- use semantic headings and button labels matching the workflow actions

---

## 7. API Contract

### 7.1 Query Contract

`GET /api/deviations`

Query parameters:
- `search: string?`
- `status: DeviationStatus?`
- `severity: DeviationSeverity?`
- `category: string?`
- `responsiblePerson: string?`
- `from: DateTimeOffset?`
- `to: DateTimeOffset?`
- `page: int = 1`
- `pageSize: int = 10`

Response:
- `PagedResultDto<DeviationListItemDto>`

### 7.2 List DTO

`DeviationListItemDto`
- `id: Guid`
- `deviationNumber: string`
- `title: string`
- `status: DeviationStatus`
- `severity: DeviationSeverity`
- `responsiblePerson: string`
- `deadline: DateTimeOffset?`
- `createdAt: DateTimeOffset`
- `currentStep: DeviationWorkflowStep`

### 7.3 Detail DTO

`DeviationDetailDto`
- list fields above, plus:
- `description: string`
- `category: string`
- `reporter: string`
- `discoveryDate: DateTimeOffset`
- `updatedAt: DateTimeOffset`
- `closedAt: DateTimeOffset?`
- `assessment: DeviationAssessmentDto | null`
- `investigation: DeviationInvestigationDto | null`
- `correctiveAction: DeviationCorrectiveActionDto | null`
- `closure: DeviationClosureDto | null`
- `attachments: DeviationAttachmentDto[]`
- `activity: DeviationActivityDto[]`

### 7.4 Lookup DTO

`DeviationLookupDto`
- `categories: string[]`
- `responsiblePeople: string[]`
- `statuses: DeviationStatus[]`
- `severities: DeviationSeverity[]`
- `workflowSteps: DeviationWorkflowStep[]`

### 7.5 Attachment Contract

Upload:
- `multipart/form-data`
- server applies max size limit and allowed extension/content-type checks

Metadata response:
- `id: Guid`
- `fileName: string`
- `contentType: string`
- `sizeInBytes: long`
- `uploadedAt: DateTimeOffset`
- `uploadedBy: string`

### 7.6 Export Contract

`GET /api/deviations/export`
- same filter parameters as the list endpoint
- returns `text/csv`
- frontend downloads as blob/file

### 7a. Frontend Contract Updates

The backend introduces a full deviation-management API surface. The following frontend files must be created or modified to keep the Angular contract aligned.

| File | Contract change |
|---|---|
| `frontend/src/app/features/deviations/models/deviation.models.ts` | Add TypeScript interfaces for `DeviationListItemDto`, `DeviationDetailDto`, `DeviationAssessmentDto`, `DeviationInvestigationDto`, `DeviationCorrectiveActionDto`, `DeviationClosureDto`, `DeviationAttachmentDto`, `DeviationActivityDto`, `DeviationLookupDto`, and `PagedResultDto<T>`. Add string-literal union types for `DeviationSeverity`, `DeviationStatus`, and `DeviationWorkflowStep`. |
| `frontend/src/app/features/deviations/models/deviation-filters.models.ts` | Add `DeviationQuery`, page/pageSize contract shapes, export query shape, and strongly typed editor request payloads matching each backend step endpoint. |
| `frontend/src/app/features/deviations/data/deviation-api.service.ts` | Add methods `getDeviations(query)`, `getDeviation(id)`, `createDeviation(dto)`, `saveRegistration(id, dto)`, `saveAssessment(id, dto)`, `saveInvestigation(id, dto)`, `saveCorrectiveAction(id, dto)`, `closeDeviation(id, dto)`, `advanceStep(id, dto)`, `getLookups()`, `uploadAttachment(id, file, uploadedBy)`, `downloadAttachment(id, attachmentId)`, and `exportDeviations(query)`. |
| `frontend/src/app/features/deviations/data/deviation-list.store.ts` | Bind the paged list contract, lookup contract, and export method; normalize query-string state to the API filter model. |
| `frontend/src/app/features/deviations/data/deviation-editor.store.ts` | Bind the detail DTO, attachment metadata contract, activity timeline contract, and step-specific save/advance payloads. |
| `frontend/src/app/features/deviations/deviations.page.ts` | Render `PagedResultDto<DeviationListItemDto>` and wire filter/search/pagination/export actions to the typed store contract. |
| `frontend/src/app/features/deviations/deviation-editor.page.ts` | Render `DeviationDetailDto`, current-step data, attachments, and activity timeline; route create/edit modes to the correct backend methods. |
| `frontend/src/app/features/deviations/components/deviation-table.component.ts` | Render the API list-item contract including `deviationNumber`, `status`, `severity`, `responsiblePerson`, `deadline`, `createdAt`, and `currentStep`. |
| `frontend/src/app/features/deviations/components/deviation-card-list.component.ts` | Render the same list-item contract in the mobile card layout. |
| `frontend/src/app/features/deviations/components/deviation-filter-panel.component.ts` | Bind typed lookup arrays and emit a typed `DeviationQuery` payload. |
| `frontend/src/app/features/deviations/components/deviation-form.component.ts` | Map step-specific form values to the create/save request contracts. |
| `frontend/src/app/features/deviations/components/deviation-workflow-stepper.component.ts` | Consume the `DeviationWorkflowStep` union and current-step field from the detail contract. |
| `frontend/src/app/features/deviations/components/deviation-metadata-sidebar.component.ts` | Render detail metadata including `status`, `severity`, `reporter`, `responsiblePerson`, `createdAt`, `updatedAt`, and `closedAt`. |
| `frontend/src/app/features/deviations/components/deviation-activity-timeline.component.ts` | Render `DeviationActivityDto[]` with timestamp and activity type labels. |
| `frontend/src/app/features/deviations/components/deviation-attachments.component.ts` | Render `DeviationAttachmentDto[]`, invoke upload/download APIs, and expose file constraints from the backend contract. |

**Type mappings applied:**
- `Guid` -> `string`
- `string` -> `string`
- `int`, `long`, `decimal`, `double` -> `number`
- `bool` -> `boolean`
- `DateTimeOffset`, `DateTime` -> `string`
- `DateTimeOffset?`, `DateTime?` -> `string | null`
- `T?` -> `T | null`
- `IReadOnlyList<T>`, `List<T>`, `T[]` -> `T[]`
- `IReadOnlyDictionary<string, T>` -> `Record<string, T>`
- C# `enum` -> TypeScript string-literal union
- C# `record` DTO -> TypeScript `interface`

---

## 8. File-by-File Backend Plan

### 8.1 Files to create

| File | Purpose |
|---|---|
| `backend/src/Greenfield.Domain/Deviations/Deviation.cs` | Main aggregate root and workflow state |
| `backend/src/Greenfield.Domain/Deviations/DeviationAssessment.cs` | Assessment value object/record |
| `backend/src/Greenfield.Domain/Deviations/DeviationInvestigation.cs` | Investigation value object/record |
| `backend/src/Greenfield.Domain/Deviations/DeviationCorrectiveAction.cs` | Corrective action value object/record |
| `backend/src/Greenfield.Domain/Deviations/DeviationClosure.cs` | Closure value object/record |
| `backend/src/Greenfield.Domain/Deviations/DeviationAttachment.cs` | Attachment metadata + content holder |
| `backend/src/Greenfield.Domain/Deviations/DeviationActivityEntry.cs` | Activity timeline entry |
| `backend/src/Greenfield.Domain/Deviations/DeviationEnums.cs` | Shared enums |
| `backend/src/Greenfield.Application/Abstractions/IDeviationService.cs` | Application service contract |
| `backend/src/Greenfield.Application/Abstractions/IDeviationRepository.cs` | Repository contract |
| `backend/src/Greenfield.Application/Abstractions/IDeviationLookupProvider.cs` | Lookup contract |
| `backend/src/Greenfield.Application/Deviations/DeviationService.cs` | Core feature orchestration |
| `backend/src/Greenfield.Application/Deviations/Requests/*.cs` | Request records |
| `backend/src/Greenfield.Application/Deviations/Dtos/*.cs` | DTO records |
| `backend/src/Greenfield.Infrastructure/Deviations/InMemoryDeviationRepository.cs` | Thread-safe in-memory persistence |
| `backend/src/Greenfield.Infrastructure/Deviations/DeviationSeedData.cs` | Demo/QA seed dataset |
| `backend/src/Greenfield.Api/Endpoints/DeviationEndpoints.cs` | Minimal API route group |
| `backend/src/Greenfield.Api/Properties/launchSettings.json` | Required http/https profiles |

### 8.2 Files to modify

| File | Change |
|---|---|
| `backend/src/Greenfield.Api/Program.cs` | register endpoints, JSON enum serialization, CORS verification, conditional HTTPS redirect |
| `backend/src/Greenfield.Application/Extensions/ApplicationServiceExtensions.cs` | register `IDeviationService` |
| `backend/src/Greenfield.Infrastructure/Extensions/InfrastructureServiceExtensions.cs` | register in-memory repository + lookup provider |

### 8.3 Tests to create/update

Under `backend/tests/` create or extend test projects consistent with the existing naming pattern:
- API integration tests for endpoint success/failure cases
- application service tests for workflow rules, filtering, export, and timeline creation

Recommended files:
- `backend/tests/Greenfield.Api.Tests/DeviationEndpointsTests.cs`
- `backend/tests/Greenfield.Application.Tests/DeviationServiceTests.cs`

---

## 9. File-by-File Frontend Plan

### 9.1 Files to create

| File | Purpose |
|---|---|
| `frontend/src/app/features/deviations/deviations.page.ts` | List page |
| `frontend/src/app/features/deviations/deviation-editor.page.ts` | Create + workflow page |
| `frontend/src/app/features/deviations/components/deviation-filter-panel.component.ts` | Advanced filters |
| `frontend/src/app/features/deviations/components/deviation-table.component.ts` | Desktop table |
| `frontend/src/app/features/deviations/components/deviation-card-list.component.ts` | Mobile cards |
| `frontend/src/app/features/deviations/components/deviation-form.component.ts` | Step-aware form body |
| `frontend/src/app/features/deviations/components/deviation-workflow-stepper.component.ts` | Horizontal workflow stepper |
| `frontend/src/app/features/deviations/components/deviation-metadata-sidebar.component.ts` | Sidebar summary |
| `frontend/src/app/features/deviations/components/deviation-activity-timeline.component.ts` | Timeline |
| `frontend/src/app/features/deviations/components/deviation-attachments.component.ts` | Upload/download area |
| `frontend/src/app/features/deviations/data/deviation-api.service.ts` | HTTP contract layer |
| `frontend/src/app/features/deviations/data/deviation-list.store.ts` | List page signal store |
| `frontend/src/app/features/deviations/data/deviation-editor.store.ts` | Detail/editor signal store |
| `frontend/src/app/features/deviations/models/deviation.models.ts` | DTO/type definitions |
| `frontend/src/app/features/deviations/models/deviation-filters.models.ts` | Query and request contracts |

### 9.2 Files to modify

| File | Change |
|---|---|
| `frontend/src/app/app.routes.ts` | add lazy routes for list/new/detail |
| `frontend/src/app/layout/shell.component.ts` | add navigation link / menu entry for deviations |
| `frontend/src/styles.css` | add or confirm Tailwind 4 source scanning + theme tokens for deviation UI |

### 9.3 Frontend testing

Recommended additions:
- component tests for filter panel, table/card rendering, stepper states, and timeline rendering
- store/service tests for list query generation and editor save actions

Recommended files:
- `frontend/src/app/features/deviations/data/deviation-api.service.spec.ts`
- `frontend/src/app/features/deviations/data/deviation-list.store.spec.ts`
- `frontend/src/app/features/deviations/data/deviation-editor.store.spec.ts`
- `frontend/src/app/features/deviations/components/deviation-filter-panel.component.spec.ts`
- `frontend/src/app/features/deviations/components/deviation-form.component.spec.ts`

---

## 10. Styling and Visual Fidelity Checklist

Use the visual manifest as the acceptance baseline.

### Required visual patterns
- OKLCH-backed semantic color system
- badge palette consistency across list and detail views
- responsive table/card switch
- mobile bottom-sheet filters
- two-column editor layout from tablet upward
- clear hover/active/focus states
- professional spacing, shadows, borders, and muted surfaces

### Tailwind implementation notes
- prefer utility classes in inline templates
- use `gap-*`, not margin hacks
- use responsive prefixes for layout shifts
- use `dark:` compatibility even if dark mode is not activated in v1
- keep theme values centralized in `@theme`

---

## 11. Testing Strategy

### Backend
- unit-test workflow rules, search/filter logic, pagination, export generation, and attachment validation
- integration-test all minimal API routes with `WebApplicationFactory<T>`
- test `404`, validation failures, invalid step transitions, and empty export results

### Frontend
- unit-test stores and API service typing
- component-test list states: loading, empty, populated, filtered, mobile card mode
- component-test editor states: create mode, existing deviation mode, step progression, save errors

### Manual QA scenarios
- create a new deviation
- edit and advance across every workflow step
- close a deviation
- upload and download an attachment
- apply/reset filters on desktop and mobile
- export filtered list
- verify responsive behavior at mobile/tablet/desktop widths

---

## 12. Delivery Sequence

1. **Backend domain + DTO contract**
   - create domain records/enums and application DTOs/requests
2. **Backend repository + service**
   - implement in-memory store, seed data, workflow rules, export, attachments
3. **Backend endpoints + hosting updates**
   - map minimal APIs, register DI, add launch settings if missing
4. **Frontend contracts + API service**
   - add TypeScript models and HTTP service methods
5. **Frontend list experience**
   - list page, filters, badges, pagination, export
6. **Frontend editor workflow**
   - form, stepper, metadata, timeline, attachments
7. **Styling polish**
   - theme tokens, responsive patterns, accessibility refinement
8. **Automated tests + QA pass**

---

## 13. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| In-memory attachments can grow memory quickly | unstable dev server memory usage | enforce per-file limit, allowed types, and low default seed volume |
| Step-specific payloads can drift between backend and frontend | broken saves | keep DTO/request files centralized and update section 7a first during implementation |
| Responsive table/card duplication can diverge visually | inconsistent UX | keep both views bound to the same typed list-item contract |
| Export may accidentally export only the current page | incorrect business output | make export endpoint ignore paging unless explicitly requested |
| Hardcoded status/severity colors can drift from manifest | inconsistent visual language | define all colors through Tailwind `@theme` tokens |

---

## 14. Repository Hygiene

Existing `.gitignore` files are present at:
- `.gitignore`
- `frontend/.gitignore`
- `backend/.gitignore`

During implementation, review and append only missing entries. Ensure the repo ignores at minimum:
- `.NET`: `bin/`, `obj/`, `.vs/`, `TestResults/`, `*.user`
- Angular/Node: `node_modules/`, `dist/`, `.angular/`, `coverage/`
- general: `.DS_Store`, `Thumbs.db`, `*.log`, `.env`

---

## 15. Definition of Done

The feature is complete when:
- Angular routes for list, create, and detail/process are available
- deviation list supports search, filters, pagination, badges, and export
- deviation editor supports all workflow steps with save + next-step actions
- activity timeline is automatically populated by backend actions
- attachments can be uploaded and downloaded within agreed in-memory limits
- backend exposes documented minimal API endpoints with OpenAPI visibility
- frontend contracts fully match backend DTOs and request payloads
- automated tests cover core workflow and API behaviors
- styling matches the visual manifest’s responsive and semantic color expectations
