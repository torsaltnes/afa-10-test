# Greenfield

Greenfield er et grønt fullstack-oppsett med en .NET 10 Web API-backend og en Angular 20+ frontend.

## Teknisk stack

### Backend
- .NET 10 / ASP.NET Core
- Minimal API
- OpenAPI
- CORS
- Clean Architecture-prosjekter: `Api`, `Application`, `Domain`, `Infrastructure`

### Frontend
- Angular 20
- Standalone Components
- Signals
- RxJS
- Tailwind CSS v4
- Chart.js / ng2-charts

### Testing
- .NET-testprosjekter i `backend/tests`
- Karma/Jasmine for frontend-tester

## Installasjon

### Forutsetninger
- .NET 10 SDK
- Node.js og npm

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

Frontend bruker en dev-proxy fra `/api` til backend på `http://localhost:5000`.

## API-oversikt

### Backend
- `GET /health` – returnerer helsestatus som JSON.
- Hvis status er `Unhealthy`, returneres `503 Service Unavailable`.

### Frontend
- I utvikling rutes `/api/*` via `frontend/proxy.conf.json` til backend.
