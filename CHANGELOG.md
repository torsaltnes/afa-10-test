# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

## [TASK-20260430153157] – Vi sliter med at flere API endpoints returnerer 404 – 2026-04-30
### Added
- Nytt `OpenApiEndpoints`-oppsett som eksponerer OpenAPI JSON på `/openapi/v1.json` og browserdocs på `/api/docs`.
- `backend/docs/api-routing-audit.md` for å dokumentere identifiserte 404-årsaker og remediation.
- Integrasjonstester for OpenAPI-dokumentet, dokumentasjons-UI og dokumenterte endepunkter.
- Bootstrap-utsrift som viser docs-URLer og anbefalt verifiseringskommando.
### Changed
- `Program.cs` bruker nå navngitt OpenAPI-dokument (`v1`) og eksponerer docs-ruter i alle miljøer.
- `HealthEndpoints`, `DashboardEndpoints` og `DeviationEndpoints` fikk normaliserte ruter og utvidet OpenAPI-metadata.
- `bootstrap.sh` og `bootstrap.ps1` skriver nå ut dokumentasjonslenker og testkommando etter oppsett.
### Fixed
- `GET /api/health` er nå tilgjengelig som kanonisk helserute, samtidig som `/health` beholdes som alias.
- `GET /api/deviations` bruker nå kanonisk uten-trailing-slash-rute.
- API-dokumentasjon returnerer ikke lenger 404 i standard integrasjonstestmiljø.

## [TASK-20260430101426] – Bug in the application. Getting 404 on requests to this url: http://localhost:4200/api/deviations – 2026-04-30
### Added
- Integrasjonstester for `GET /api/deviations` som verifiserer suksessstatus, `application/json` og array-payload.
- Bootstrap-skriptene `bootstrap.sh` og `bootstrap.ps1` for å restore backend og installere frontend-avhengigheter på macOS/Linux og Windows.
### Changed
- Angular dev-proxyen i `frontend/proxy.conf.json` beholder nå `/api`-prefikset når requests videresendes til backend.
### Fixed
- Lokale kall til `http://localhost:4200/api/deviations` returnerer ikke lenger 404.

## [FEAT-006] – Deviation Management Dashboard – 2026-04-30
### Added
- Nytt `GET /api/dashboard/summary`-endepunkt for KPIer, statusfordeling, månedstrend og siste avvik.
- API-basert dashboard i Angular med KPI-kort, diagramområde, navigasjonssidepanel og state-håndtering for lasting, feil og tomt resultat.
- Egen dashboard-kontrakt og komponenter for å vise sanntidsdata fra avviks-APIet.
### Changed
- Erstattet det seeded/mock-baserte dashboardet med en live visning som henter data fra backend.
- Synkroniserte frontend-modeller for dashboard og avvik med backend-kontrakten.
### Fixed
- Rettet statusverdier i frontend slik at `UnderAssessment` og `UnderInvestigation` matcher backend.
- Rettet typing av nylige avviksrader mot backendens summary-shape.

## [FEAT-002] – Deviation / Non-conformity management feature – 2026-04-29
### Added
- Deviation-funksjon med liste, registrering og behandlingsside under `frontend/src/app/features/deviations`.
- Lazy-loaded ruter for `/deviations`, `/deviations/new` og `/deviations/:id`.
- In-memory `/api/deviations`-API med liste, opprettelse, oppdatering, sletting, CSV-export, tidslinje, kommentarer og vedlegg.
### Changed
- Backendens avviksflyt bruker in-memory lagring i applikasjonssjiktet og returnerer `404`/`400` for manglende eller ugyldig input.
### Fixed
- CSV-export neutraliserer nå formeltriggere i brukerstyrte felt før escaping.
- Vedleggslasting håndhever en sentral 5 MiB grense både før og etter base64-dekoding.
- `UpdatedBy` og `UploadedBy` valideres nå med blank-verdi-sjekk, slik at ugyldig input gir `400` i stedet for `500`.

## [INIT-001] – Greenfield architecture initialisation – 2026-04-29
### Added
- Et ekte Angular testoppsett med Karma/Jasmine og støtte for headless kjøring.
- `tsconfig.spec.json`, `karma.conf.js` og en minimal, bestående spekfil for `app.component`.
- Testavhengigheter og Angular CLI-konfigurasjon for frontend-tester.
### Changed
- Frontendens `ng test`-mål ble koblet til en faktisk testtarget i `angular.json`.
### Fixed
- Frontend-testoppsettet ble justert slik at `npm run test -- --watch=false --browsers=ChromeHeadless` går gjennom uten feil.
