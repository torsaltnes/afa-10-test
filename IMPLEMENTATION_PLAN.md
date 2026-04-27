# IMPLEMENTATION_PLAN.md

## FEAT-003 — Employee Competence Profile

### Goal
Add a new **My Profile** feature that lets the logged-in employee create, edit, delete, and review competence entries in three categories:
- Education
- Professional certificates
- Completed courses

The implementation must fit the repository’s existing architecture:
- **Backend:** .NET 10, Clean Architecture, Minimal APIs
- **Frontend:** Angular 20 standalone architecture with signals
- **Styling:** Tailwind CSS 4 CSS-first configuration

---

## 1. Current Codebase Context

### Backend
- Solution already follows **Domain → Application → Infrastructure → Api** layering.
- API uses **Minimal API endpoint mapping** from `Program.cs`.
- CORS for Angular localhost development is already present.
- `UseHttpsRedirection()` is already correctly guarded outside Development.
- Test stack already includes **xUnit**, **FluentAssertions**, **Moq**, and **WebApplicationFactory**.

### Frontend
- Angular app uses **standalone lazy-loaded routes** from `frontend/src/app/app.routes.ts`.
- Existing routes currently expose only health and deviations.
- Feature organization follows `app/features/*` with shared concerns in `app/core/*`.
- Tailwind CSS 4 is available through `src/styles.css`.
- Frontend tests use **Vitest**.

### Architectural Implication
This feature should be added as a new vertical slice on both frontend and backend without changing the overall project structure.

---

## 2. Solution Overview

Implement the feature as a **single employee-owned aggregate/profile view** with three child collections.

### Recommended frontend route
- `/my-profile`

### Recommended backend route group
- `/api/profile`

### Ownership model
- The client must **not** send an arbitrary employee/user id.
- The backend should resolve the current employee identity through an existing user context abstraction, or a new minimal abstraction if none exists yet.
- Even though authentication is out of scope, server-side ownership resolution should be built now to prevent future security gaps.

---

## 3. Backend Technical Design

### 3.1 Domain Model
Create a profile aggregate that owns three entry collections.

#### Aggregate root
- `EmployeeCompetenceProfile`
  - `UserId`
  - `EducationEntries`
  - `CertificateEntries`
  - `CourseEntries`
  - optional audit metadata such as `LastUpdatedUtc`

#### Child entities / value-bearing records
- `EducationEntry`
  - `Id`
  - `Degree`
  - `Institution`
  - `GraduationYear`
- `CertificateEntry`
  - `Id`
  - `CertificateName`
  - `IssuingOrganization`
  - `DateEarned`
- `CourseEntry`
  - `Id`
  - `CourseName`
  - `Provider`
  - `CompletionDate`

### 3.2 Validation Rules
Apply validation in the application layer before persistence.

#### Education
- `Degree` required
- `Institution` required
- `GraduationYear` required
- `GraduationYear` must be within a sensible range (for example 1900 through current year + 1)

#### Certificate
- `CertificateName` required
- `IssuingOrganization` required
- `DateEarned` required
- `DateEarned` cannot be in the future

#### Course
- `CourseName` required
- `Provider` required
- `CompletionDate` required
- `CompletionDate` cannot be in the future

#### General
- Trim all user-entered strings before persistence
- Use `ArgumentException.ThrowIfNullOrWhiteSpace` for required string guards
- Add max length limits at DTO validation and persistence levels for defensive consistency

### 3.3 Application Layer
Add a dedicated application slice for profile management.

#### Contracts (records)
Recommended DTOs/requests:
- `CompetenceProfileDto`
- `EducationEntryDto`
- `CertificateEntryDto`
- `CourseEntryDto`
- `CreateEducationRequest`
- `UpdateEducationRequest`
- `CreateCertificateRequest`
- `UpdateCertificateRequest`
- `CreateCourseRequest`
- `UpdateCourseRequest`

Use **record** types for all contracts.

#### Abstractions
- `IEmployeeCompetenceProfileRepository`
- `ICurrentUserContext` (only if no equivalent abstraction already exists)
- `IEmployeeCompetenceProfileService`

#### Service
Implement a service with a **primary constructor** and methods such as:
- `GetMyProfileAsync()`
- `AddEducationAsync(...)`
- `UpdateEducationAsync(...)`
- `DeleteEducationAsync(...)`
- `AddCertificateAsync(...)`
- `UpdateCertificateAsync(...)`
- `DeleteCertificateAsync(...)`
- `AddCourseAsync(...)`
- `UpdateCourseAsync(...)`
- `DeleteCourseAsync(...)`

Service responsibilities:
- resolve current user id
- load or initialize the profile
- enforce field validation
- ensure item ownership
- map domain entities to DTOs
- call repository methods

All asynchronous library-layer awaits should use `ConfigureAwait(false)`.

### 3.4 Infrastructure Layer
Implement repository persistence using the same persistence style already used by the solution.

#### Preferred storage shape
If the project already uses relational persistence, add:
- `EmployeeCompetenceProfiles`
- `EducationEntries`
- `CertificateEntries`
- `CourseEntries`

Suggested relational design:
- profile table keyed by `UserId`
- child tables keyed by `Id` with foreign key to `UserId` or profile key
- cascade delete from profile to child rows

#### Infrastructure responsibilities
- repository implementation
- persistence mapping/configuration
- migration/schema update if a database-backed approach exists
- profile creation on first write or first read

If the current application still uses in-memory storage for newer features, mirror the existing pattern first and keep the repository contract persistence-agnostic.

### 3.5 API Layer
Add a new Minimal API endpoint group, for example `ProfileEndpoints`.

#### Route group
- `app.MapProfileEndpoints()`
- prefix: `/api/profile`
- tag: `Profile`

#### Endpoints
| Method | Route | Purpose |
|---|---|---|
| GET | `/api/profile` | Return the current employee competence profile |
| POST | `/api/profile/education` | Create education entry |
| PUT | `/api/profile/education/{educationId}` | Update education entry |
| DELETE | `/api/profile/education/{educationId}` | Delete education entry |
| POST | `/api/profile/certificates` | Create certificate entry |
| PUT | `/api/profile/certificates/{certificateId}` | Update certificate entry |
| DELETE | `/api/profile/certificates/{certificateId}` | Delete certificate entry |
| POST | `/api/profile/courses` | Create course entry |
| PUT | `/api/profile/courses/{courseId}` | Update course entry |
| DELETE | `/api/profile/courses/{courseId}` | Delete course entry |

#### API conventions
- Use `MapGroup()` and `.WithTags("Profile")`
- Return `TypedResults`
- Use typed union results where more than one response is possible
- Return `ValidationProblem` for invalid requests
- Return `NotFound` when editing/deleting an item that does not exist for the current user
- Return `Created` on POST operations with the created item payload
- Keep endpoint handlers thin; delegate logic to the application service

### 3.6 Dependency Registration
Update DI composition to register:
- profile service
- repository implementation
- current user context abstraction if needed

Also wire the new endpoint group into `Program.cs` alongside existing endpoint mappings.

---

## 4. Frontend Technical Design

### 4.1 Feature Placement
Create a new lazy-loaded feature area under:
- `frontend/src/app/features/profile/`

Recommended structure:
- `my-profile-page.component.ts`
- `components/profile-header.component.ts`
- `components/education-section.component.ts`
- `components/certificates-section.component.ts`
- `components/courses-section.component.ts`
- `components/education-form.component.ts`
- `components/certificate-form.component.ts`
- `components/course-form.component.ts`
- `data/profile-api.service.ts`
- `state/profile.store.ts`
- `models/profile.models.ts`

If the codebase prefers keeping feature-local models/services beside the page component, follow that existing local convention instead of over-centralizing prematurely.

### 4.2 Routing
Update `frontend/src/app/app.routes.ts` with a new route:
- `path: 'my-profile'`
- `loadComponent: () => import(...).then(...)`

If the app shell exposes a primary navigation menu, add a **My Profile** entry in the shell component that owns navigation.

### 4.3 Angular Architecture Rules
The new feature must follow the Angular 20 conventions already mandated for the repository:
- standalone components only
- no NgModules
- `inject()` instead of constructor injection
- `ChangeDetectionStrategy.OnPush`
- signals for local and feature state
- `@if` / `@for` / `@switch` instead of structural directives
- no `BehaviorSubject` store pattern

### 4.4 State Management
Implement a feature-local signal store service.

#### Recommended responsibilities
- `profile` signal for the loaded aggregate
- `loading` signal
- `saving` signal per active operation or per section
- `error` signal for page-level failures
- `computed()` selectors for summary counts and sorted section data
- refresh logic after successful create/update/delete

#### Async loading
Use a signal-based async pattern aligned with Angular 20:
- initial aggregate load via `resource()` if the team wants signal-native fetch lifecycle handling
- mutations via service methods that update/reload store state

This feature does not need NgRx or any external state library.

### 4.5 API Client
Create a dedicated `profile-api.service.ts` that wraps HTTP access to the backend.

Recommended methods:
- `getProfile()`
- `createEducation()` / `updateEducation()` / `deleteEducation()`
- `createCertificate()` / `updateCertificate()` / `deleteCertificate()`
- `createCourse()` / `updateCourse()` / `deleteCourse()`

Keep HTTP models aligned with backend DTO records.

### 4.6 UI Composition
Design the page as a polished profile dashboard rather than a plain form dump.

#### Recommended layout
1. **Page header / overview card**
   - title: My Profile
   - short descriptive text
   - computed totals for education, certificates, courses
2. **Three responsive section cards**
   - Education
   - Certificates
   - Courses
3. **Per-section item list**
   - each item shown in a structured card row
   - edit/delete actions per row
4. **Inline create/edit experience**
   - one active editor per section to avoid unnecessary dialog dependencies
   - clear cancel/save controls
5. **Empty states**
   - instructional copy when a section has no entries
   - prominent add button

### 4.7 Forms
Use Angular reactive forms for each entry editor.

#### Education form fields
- degree
- institution
- graduationYear

#### Certificate form fields
- certificateName
- issuingOrganization
- dateEarned

#### Course form fields
- courseName
- provider
- completionDate

#### Form behavior
- prefill existing values for edit mode
- disable submit while saving
- surface field-level validation messages
- reset cleanly after save/cancel
- convert date input values to the API contract format consistently

### 4.8 Tailwind CSS 4 Styling Strategy
Use Tailwind CSS 4 according to the repository constraints:
- customize via `@theme` in CSS, not `tailwind.config.js`
- keep colors/spacings tokenized through CSS custom properties
- use responsive utility classes and `gap-*`
- support dark mode with `dark:` variants if the app already supports it

#### Styling recommendations
- page container with constrained width and comfortable whitespace
- summary card with subtle shadow and rounded corners
- section cards with consistent padding, border, and action layout
- readable typography hierarchy
- visible input focus, invalid, and disabled states
- mobile-first layout that stacks sections on small screens and expands cleanly on larger screens

If additional shared tokens are needed, extend `frontend/src/styles.css` using `@theme` instead of introducing Tailwind configuration files.

---

## 5. Data Contracts and API Shape

### Aggregate response
`GET /api/profile` should return a single payload containing all three categories so the frontend can render the full page with one request.

Recommended shape:
- profile metadata
- `educationEntries`
- `certificateEntries`
- `courseEntries`
- optional summary counts if the backend already exposes view-oriented DTOs

Frontend summary counts may also be computed client-side to keep the API simpler.

### Mutation responses
Each POST/PUT should return the created or updated item DTO. DELETE should return `204 No Content`.

This keeps optimistic or refresh-after-save strategies straightforward.

---

## 6. Error Handling and UX Rules

### Backend
- invalid payload -> `400` with validation details
- missing item for current user -> `404`
- unexpected failure -> centralized `500` handling consistent with existing API behavior

### Frontend
- show page-level error state when the initial load fails
- show inline section feedback when a mutation fails
- keep existing data visible when a single mutation fails
- avoid full-page reloads after CRUD operations

---

## 7. Testing Strategy

### 7.1 Backend Unit Tests
Add application-layer tests for:
- successful profile retrieval
- create/update/delete behavior for each entry type
- validation rule enforcement
- not-found behavior when editing/deleting missing entries
- ownership enforcement using the resolved current user context

Use:
- xUnit
- FluentAssertions
- Moq

### 7.2 Backend Integration Tests
Add `WebApplicationFactory<Program>` tests for:
- `GET /api/profile`
- create/update/delete endpoints for all three categories
- validation responses for bad payloads
- not-found responses for unknown entry ids
- correct JSON contract shape for Angular consumption

### 7.3 Frontend Unit/Component Tests
Add Vitest coverage for:
- profile store loading and refresh behavior
- computed summary counts
- section rendering for empty and populated states
- create/edit/delete interaction flows
- reactive form validation and disabled-save behavior
- error message display on failed API operations

Prefer testing rendered behavior and signal outcomes rather than implementation details.

---

## 8. Suggested File-Level Plan

### Backend
Likely additions/changes:
- `backend/src/GreenfieldArchitecture.Domain/...` profile aggregate and entry types
- `backend/src/GreenfieldArchitecture.Application/Contracts/Profile/...`
- `backend/src/GreenfieldArchitecture.Application/Abstractions/IEmployeeCompetenceProfileRepository.cs`
- `backend/src/GreenfieldArchitecture.Application/Abstractions/ICurrentUserContext.cs` if missing
- `backend/src/GreenfieldArchitecture.Application/Services/EmployeeCompetenceProfileService.cs`
- `backend/src/GreenfieldArchitecture.Infrastructure/...` repository + persistence mapping/migration
- `backend/src/GreenfieldArchitecture.Api/Endpoints/ProfileEndpoints.cs`
- `backend/src/GreenfieldArchitecture.Api/Extensions/...` DI registration update
- `backend/src/GreenfieldArchitecture.Api/Program.cs` endpoint mapping update
- application and API test projects for unit/integration coverage

### Frontend
Likely additions/changes:
- `frontend/src/app/features/profile/...` page, section components, forms, store, API service, models
- `frontend/src/app/app.routes.ts` route update
- app shell/navigation component if a nav link is required
- `frontend/src/styles.css` only if new shared design tokens are needed
- frontend Vitest specs beside the new feature files

---

## 9. Recommended Delivery Sequence

1. Define backend contracts, validation rules, and service abstractions.
2. Implement domain model and repository contract.
3. Implement infrastructure persistence and schema changes.
4. Add Minimal API endpoint group and wire DI/endpoints.
5. Add backend unit and integration tests.
6. Add Angular models, API client, and signal store.
7. Build `my-profile` page and section/form components.
8. Add Tailwind-based responsive styling and empty/error states.
9. Add frontend Vitest coverage.
10. Perform end-to-end manual verification of CRUD flows across all three categories.

---

## 10. Acceptance Mapping

The implementation is complete when:
- logged-in users can open `/my-profile`
- all three categories render on one responsive page
- users can create, edit, and delete entries in each category
- data is persisted through backend APIs
- UI follows existing Angular/Tailwind conventions
- backend follows Minimal API + Clean Architecture conventions
- automated tests cover the new slice on both frontend and backend
