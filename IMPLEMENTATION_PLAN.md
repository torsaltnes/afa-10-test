# IMPLEMENTATION_PLAN

## 1. Objective
Initialize a greenfield full-stack workspace with:
- `backend/`: .NET 10 Minimal API foundation using Clean Architecture conventions.
- `frontend/`: Angular 20 standalone application using Signals.
- Tailwind CSS 4 dark-theme dashboard UI matching the visual manifest.
- A typed health endpoint at `GET /health` and aligned frontend contract consumption.
- Build-safe repository hygiene for generated artifacts and local tooling files.

## 2. Current Workspace State
- Root directories detected: `backend/`, `frontend/`, `.afa/`, `.git/`.
- Visual manifest exists at `.afa/VISUAL_MANIFEST.json` and defines:
  - 240px fixed sidebar.
  - Top bar with search, notifications, avatar.
  - 4-card metrics grid.
  - 2-chart row (line + bar).
  - Recent activity table with badges, actions, pagination.
  - Dark theme with OKLCH tokens and mobile/tablet/desktop breakpoints.
- `backend/src/Greenfield.Api` already exists and should be retained as the API host.
- `frontend/` currently only contains generated artifacts (`dist/`, `.angular/`); the real Angular source tree must be created.
- No root `.gitignore` is present; ignore rules must be added before implementation artifacts are committed.

## 3. Target Repository Structure

```text
/
├─ IMPLEMENTATION_PLAN.md
├─ .gitignore
├─ backend/
│  ├─ .gitignore
│  ├─ Greenfield.sln
│  ├─ Directory.Build.props
│  ├─ src/
│  │  ├─ Greenfield.Api/
│  │  ├─ Greenfield.Application/
│  │  ├─ Greenfield.Domain/
│  │  └─ Greenfield.Infrastructure/
│  └─ tests/
│     ├─ Greenfield.Api.IntegrationTests/
│     └─ Greenfield.Application.UnitTests/
└─ frontend/
   ├─ .gitignore
   ├─ package.json
   ├─ .postcssrc.json
   ├─ angular.json
   ├─ tsconfig.json
   ├─ proxy.conf.json
   └─ src/
      ├─ main.ts
      ├─ styles.css
      ├─ app/
      │  ├─ app.component.ts
      │  ├─ app.config.ts
      │  ├─ app.routes.ts
      │  ├─ core/
      │  │  ├─ models/
      │  │  ├─ services/
      │  │  └─ config/
      │  ├─ layout/
      │  └─ features/
      │     ├─ dashboard/
      │     ├─ analytics/
      │     ├─ reports/
      │     ├─ users/
      │     └─ settings/
      └─ environments/
```

## 4. Backend Architecture

### 4.1 Architectural Style
- Use Clean Architecture project boundaries:
  - `Domain`: shared domain primitives and enums.
  - `Application`: DTOs, interfaces, use-case services.
  - `Infrastructure`: environment/system adapters.
  - `Api`: Minimal API host, endpoint registration, configuration.
- Use Minimal APIs only. Do not introduce MVC controllers.
- Use C# 14 / .NET 10 conventions:
  - primary constructors for services,
  - `record` DTOs,
  - collection expressions,
  - `sealed` classes unless inheritance is required.

### 4.2 Backend Projects
| Project | Responsibility |
|---|---|
| `backend/src/Greenfield.Api` | Host, DI, middleware, endpoint groups, OpenAPI, CORS |
| `backend/src/Greenfield.Application` | `HealthStatusDto`, `IHealthStatusService`, validation and mapping logic |
| `backend/src/Greenfield.Domain` | `HealthState` enum and shared constants |
| `backend/src/Greenfield.Infrastructure` | runtime metadata provider, environment/time abstractions if needed |
| `backend/tests/Greenfield.Api.IntegrationTests` | `WebApplicationFactory` tests for `/health` |
| `backend/tests/Greenfield.Application.UnitTests` | service-level tests for health payload generation |

### 4.3 Health Feature Design
Interpret the requested “HealthCheck controller” as a Minimal API endpoint plus a primary-constructor-backed application service.

**Endpoint**
- Route: `GET /health`
- Return type: JSON payload for both operators and frontend consumption.
- Primary behavior:
  - `200 OK` when status is `Healthy` or `Degraded`
  - `503 Service Unavailable` when status is `Unhealthy`

**Proposed response contract**
```json
{
  "status": "Healthy",
  "serviceName": "Greenfield.Api",
  "environment": "Development",
  "version": "1.0.0",
  "timestampUtc": "2026-04-29T21:01:07Z"
}
```

**Implementation shape**
- Register `AddHealthChecks()` for framework health infrastructure.
- Add a typed `HealthEndpoints` extension in the API layer.
- Add `HealthStatusService` in `Application` or `Infrastructure`, implemented as a sealed primary-constructor service.
- Use `TypedResults`/`IResult` from Minimal APIs.
- Keep the endpoint top-level at `/health` to satisfy acceptance criteria.
- Optional secondary probe endpoint (`/healthz`) may be added later for platform liveness/readiness separation, but is not required for this feature.

### 4.4 API Host Configuration
`Program.cs` should plan for:
- `builder.Services.AddOpenApi()` for local API visibility.
- `builder.Services.AddHealthChecks()`.
- `builder.Services.AddCors(...)` allowing:
  - `http://localhost:4200`
  - `https://localhost:4200`
- registration of application and infrastructure services through extension methods.
- `app.UseHttpsRedirection()` only when `!app.Environment.IsDevelopment()`.
- `app.UseCors()` before endpoint mapping.
- endpoint-group registration via extension methods.

### 4.5 Launch and Environment Files
Create `backend/src/Greenfield.Api/Properties/launchSettings.json` with:
- HTTP profile on port `5000`
- HTTPS profile on port `5001`
- `ASPNETCORE_ENVIRONMENT=Development`

Add app settings for:
- service/application name,
- semantic version placeholder,
- logging defaults.

### 4.6 Testing Strategy
- `xUnit` + `FluentAssertions` + `Moq`.
- Integration tests:
  - `/health` returns `200` and valid JSON when healthy.
  - `/health` content type is JSON.
  - `/health` exposes string enum values expected by the frontend.
- Unit tests:
  - `HealthStatusService` maps environment/version/time values correctly.
- Build validation target: `dotnet build` and `dotnet test` from `backend/`.

## 5. Frontend Architecture

### 5.1 Angular Foundation
- Use Angular 20 standalone architecture only.
- Bootstrap with `bootstrapApplication()`.
- Register providers via `app.config.ts`:
  - `provideRouter()`
  - `provideHttpClient()`
  - `provideCharts(withDefaultRegisterables())`
- Use `inject()` for DI; do not use constructor injection.
- Use `ChangeDetectionStrategy.OnPush` on all components.
- Use built-in control flow (`@if`, `@for`, `@switch`).

### 5.2 Route Model
Create lazy standalone routes for:
- `/` → dashboard
- `/analytics`
- `/reports`
- `/users`
- `/settings`

Rationale:
- satisfies functional sidebar navigation,
- keeps non-dashboard views minimal but routable,
- enables future feature growth without restructuring.

### 5.3 Layout Composition
| Area | Planned component responsibility |
|---|---|
| App shell | responsive grid, sidebar visibility state, router outlet |
| Sidebar | brand block, nav items, active route styling, user profile section |
| Top bar | mobile menu trigger, search, notifications button, avatar |
| Dashboard page | metric cards, charts, recent activity table, header actions |
| Shared UI primitives | status badge, card shell, icon button, table row actions |

### 5.4 State Management
Use Signals as the default state model.

**Planned stores/services**
- `AppShellStore`
  - `sidebarOpen`
  - `isMobileNav`
  - route-aware active navigation state
- `DashboardStore`
  - static seeded metrics/charts/table signals for initial visual delivery
  - API health `resource()` or `rxResource()` backed by `HealthApiService`
  - computed summaries for cards and chart legends

Non-goal for this feature:
- do not invent backend analytics endpoints that are not part of the acceptance criteria.
- metrics, charts, and recent activity should use local seed data until dedicated APIs are defined.

### 5.5 Dashboard Visual Plan
Implement the manifest as:
- fixed 240px desktop sidebar,
- main content column with top bar,
- 4-up metrics grid on desktop,
- 2-column charts row on desktop,
- full-width recent activity table,
- `Export` and `Add New` header actions,
- success/warning/danger badges in the table,
- hover states on cards, nav items, buttons, and rows.

### 5.6 Responsive Behavior
- `<768px`:
  - sidebar becomes hamburger drawer,
  - metrics collapse to 2 columns then 1 column,
  - charts stack vertically,
  - table becomes horizontally scrollable,
  - search collapses to icon-first interaction.
- `768px–1024px`:
  - sidebar may remain icon-condensed or full-width depending on available space,
  - charts remain 2 columns only when card widths stay legible.
- `>1024px`:
  - full sidebar and full dashboard grid.

### 5.7 Charting Library Selection
Use `ng2-charts` with `Chart.js` because the manifest explicitly requires line and bar charts and the library supports Angular standalone providers cleanly.

Implementation notes:
- bind chart configuration from signals/computed values,
- keep charts responsive,
- wrap canvases in relatively positioned containers,
- provide adjacent textual summaries because canvas content is not inherently accessible.

## 6. Tailwind CSS 4 and Design System

### 6.1 Tooling
Update frontend tooling to include:
- `tailwindcss`
- `@tailwindcss/postcss`
- `.postcssrc.json` using the JSON plugin format required by Angular CLI

### 6.2 Global CSS Strategy
`frontend/src/styles.css` should contain:
- `@import "tailwindcss";`
- `@source "./src/**/*.ts";`
- `@theme` block defining the visual tokens from the manifest

### 6.3 Required Theme Tokens
Define CSS custom properties for at minimum:
- `--color-primary`
- `--color-primary-hover`
- `--color-surface`
- `--color-surface-raised`
- `--color-surface-overlay`
- `--color-background`
- `--color-text-primary`
- `--color-text-secondary`
- `--color-border`
- `--color-success`
- `--color-warning`
- `--color-danger`
- `--color-chart-1..3`
- typography tokens matching:
  - display `2rem`
  - heading `1.25rem`
  - subheading `1rem`
  - body `0.875rem`
  - caption `0.75rem`

### 6.4 Styling Rules
- Dark theme is the default visual mode.
- Use manifest OKLCH values directly in `@theme` tokens.
- Prefer `gap-*` utilities for layout spacing.
- Use `dark:` utilities only where dual-mode behavior is needed; default styling can already be dark-first.
- Use container queries selectively for chart/table cards if card internals need to reflow independently.

## 7. API Contract

### 7.1 Backend Contract
**Endpoint:** `GET /health`

**Response DTO**
- `status: HealthState`
- `serviceName: string`
- `environment: string`
- `version: string`
- `timestampUtc: DateTimeOffset`

**Serialization rules**
- enum values serialized as strings, not numbers,
- timestamps serialized as ISO 8601 UTC strings,
- DTO implemented as a C# `record`.

### 7a. Frontend Contract Updates
The new backend health endpoint affects the frontend contract and must be reflected in the Angular app.

| File | Change |
|---|---|
| `frontend/src/app/core/models/health-status.model.ts` | Create `HealthStatusDto` interface and `HealthState` union type: `'Healthy' | 'Degraded' | 'Unhealthy'`. |
| `frontend/src/app/core/services/health-api.service.ts` | Add `getHealthStatus()` method returning the typed health contract for dashboard consumption. |
| `frontend/src/app/features/dashboard/data/dashboard.store.ts` | Add a health resource/signal that loads `HealthStatusDto`, exposes `isApiHealthy`, and derives a badge tone from `status`. |
| `frontend/src/app/features/dashboard/dashboard.page.ts` | Bind the typed health signal into a visible status chip/card in the dashboard header or metrics area. |
| `frontend/src/environments/environment.ts` | Add `apiBaseUrl` or `healthEndpoint` configuration for the backend route. |
| `frontend/src/environments/environment.development.ts` | Mirror development endpoint configuration for localhost runtime. |

**Type mappings applied**
- C# `record` DTO → TypeScript `interface`
- C# `enum HealthState` → TypeScript union `'Healthy' | 'Degraded' | 'Unhealthy'`
- C# `string` → TypeScript `string`
- C# `DateTimeOffset` → TypeScript `string`

## 8. Repository Hygiene
- Create root `.gitignore`.
- Create `backend/.gitignore` and `frontend/.gitignore` if the repos are managed independently.
- Ensure ignore rules cover at minimum:
  - `.NET`: `bin/`, `obj/`, `.vs/`, `*.user`, `TestResults/`
  - Angular/Node: `node_modules/`, `dist/`, `.angular/`, `coverage/`
  - General: `.DS_Store`, `Thumbs.db`, `*.log`, `.env`
- Remove generated frontend artifacts from version control if currently tracked (`frontend/dist`, `frontend/.angular`).

## 9. Implementation Sequence
1. Add ignore files and clean generated artifacts.
2. Scaffold backend solution/projects and shared build props.
3. Implement backend startup, health service, endpoint group, configuration, and tests.
4. Scaffold Angular 20 frontend source tree.
5. Add Tailwind 4 PostCSS setup and theme tokens.
6. Build shell layout, navigation routes, and responsive behavior.
7. Add dashboard seed data, chart components, and recent activity table.
8. Integrate frontend health contract and display status.
9. Run build/test validation and fix compile issues.
10. Commit to `feature/INIT-001-greenfield` using milestone-based commits.

## 10. Validation Gates

### Backend
- `dotnet restore`
- `dotnet build`
- `dotnet test`

### Frontend
- `npm install`
- `npm run build`

### Functional Smoke Checks
- `/health` returns JSON and expected status codes.
- Sidebar nav routes render.
- Dashboard layout matches manifest structure.
- Tailwind utilities are generated correctly.
- Mobile, tablet, and desktop breakpoints match acceptance criteria.

## 11. Planned File Sets

### Root
- `.gitignore`
- `IMPLEMENTATION_PLAN.md`

### Backend
- `backend/.gitignore`
- `backend/Greenfield.sln`
- `backend/Directory.Build.props`
- `backend/src/Greenfield.Api/Program.cs`
- `backend/src/Greenfield.Api/Properties/launchSettings.json`
- `backend/src/Greenfield.Api/appsettings.json`
- `backend/src/Greenfield.Api/Endpoints/HealthEndpoints.cs`
- `backend/src/Greenfield.Application/Abstractions/IHealthStatusService.cs`
- `backend/src/Greenfield.Application/Health/HealthStatusDto.cs`
- `backend/src/Greenfield.Domain/Health/HealthState.cs`
- `backend/src/Greenfield.Infrastructure/Health/HealthStatusService.cs`
- `backend/tests/Greenfield.Api.IntegrationTests/...`
- `backend/tests/Greenfield.Application.UnitTests/...`

### Frontend
- `frontend/.gitignore`
- `frontend/package.json`
- `frontend/.postcssrc.json`
- `frontend/angular.json`
- `frontend/proxy.conf.json`
- `frontend/src/main.ts`
- `frontend/src/styles.css`
- `frontend/src/app/app.component.ts`
- `frontend/src/app/app.config.ts`
- `frontend/src/app/app.routes.ts`
- `frontend/src/app/layout/...`
- `frontend/src/app/core/models/health-status.model.ts`
- `frontend/src/app/core/services/health-api.service.ts`
- `frontend/src/app/features/dashboard/...`
- `frontend/src/app/features/analytics/...`
- `frontend/src/app/features/reports/...`
- `frontend/src/app/features/users/...`
- `frontend/src/app/features/settings/...`
- `frontend/src/environments/environment.ts`
- `frontend/src/environments/environment.development.ts`
