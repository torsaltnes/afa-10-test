# Greenfield

Greenfield er et fullstack-oppsett med en .NET 10 Web API-backend og en Angular 20+ frontend.

## Teknisk stack

### Backend
- .NET 10 / ASP.NET Core
- Minimal APIs
- Application/Domain/Infrastructure-arkitektur
- In-memory lagring for deviation-flyten og dashboard-oppsummering
- OpenAPI/Scalar for API-dokumentasjon (`/openapi/v1.json` og `/api/docs`)
- CORS

### Frontend
- Angular 20+
- Standalone Components og lazy-loaded feature routes
- Signals
- Reactive Forms
- RxJS
- Tailwind CSS v4 med oklch-baserte design tokens
- Chart.js / ng2-charts

### Testing
- .NET-testprosjekter i `backend/tests`
- Integrasjonstester for routing, OpenAPI og API-kontrakter
- Karma/Jasmine for frontend-tester

## Installasjon

### Forutsetninger
- .NET 10 SDK
- Node.js og npm

### Bootstrap
Kjør ett av bootstrap-skriptene for å installere avhengigheter:

```bash
./bootstrap.sh
```

eller

```powershell
.\bootstrap.ps1
```

Skriptet kjører `dotnet restore backend/Greenfield.sln` og `npm install` i `frontend/`.

### Backend
```bash
cd backend
dotnet restore Greenfield.sln
dotnet build Greenfield.sln
dotnet test Greenfield.sln
```

### Frontend
```bash
cd frontend
npm install
npm run build
npm run test -- --watch=false --browsers=ChromeHeadless
```

### Kjør lokalt
```bash
cd backend
dotnet run --project src/Greenfield.Api
```

```bash
cd frontend
npm start
```

Frontend bruker `npm start`, som laster `proxy.conf.json` og bevarer `/api`-prefikset når requests videresendes til backend på `http://localhost:5000`.

## API-oversikt

### API-dokumentasjon
- `GET /api/docs` – browserbasert OpenAPI-dokumentasjon.
- `GET /openapi/v1.json` – OpenAPI JSON-dokument.

### Backend
- `GET /api/health` – returnerer helsestatus som JSON.
- `GET /health` – bakoverkompatibel alias for helsesjekken.
- `GET /api/dashboard/summary` – returnerer KPIer, statusfordeling, månedstrend og siste avvik.
- `GET /api/deviations` – lister og søker avvik.
- `GET /api/deviations/{id}` – henter ett avvik.
- `POST /api/deviations` – registrerer et nytt avvik.
- `PUT /api/deviations/{id}` – oppdaterer et avvik.
- `DELETE /api/deviations/{id}` – sletter et avvik.
- `GET /api/deviations/export` – eksporterer avvik som CSV.
- `POST /api/deviations/{id}/transition` – flytter et avvik videre i arbeidsflyten.
- `GET /api/deviations/{id}/timeline` – henter aktivitetslogg.
- `POST /api/deviations/{id}/comments` – legger til kommentar.
- `GET /api/deviations/{id}/attachments` – henter vedlegg.
- `POST /api/deviations/{id}/attachments` – laster opp vedlegg.
- `DELETE /api/deviations/{id}/attachments/{attachmentId}` – fjerner vedlegg.

### Frontend
- `/` – dashboard for avviksstyring.
- `/deviations` – avvikslisten.
- `/deviations/new` – registreringsskjema for nytt avvik.
- `/deviations/:id` – behandlings-/detaljside for et avvik.
