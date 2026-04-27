# Greenfield Architecture

Full-stack deviation / non-conformity management demo built with .NET 10 and Angular 20.

## Technical stack

- **Backend:** ASP.NET Core Web API on .NET 10
- **API style:** Minimal APIs with OpenAPI support
- **Frontend:** Angular 20 standalone components
- **State/UI:** Angular Signals, Reactive Forms, Router, HttpClient
- **Styling:** Tailwind CSS v4
- **Storage:** In-memory repository backed by `ConcurrentDictionary<Guid, Deviation>`
- **Tests:** xUnit for backend, Vitest for frontend

## Installation

### Prerequisites

- .NET 10 SDK
- Node.js and npm

### Backend

```bash
cd backend
dotnet restore GreenfieldArchitecture.sln
dotnet build GreenfieldArchitecture.sln
dotnet test GreenfieldArchitecture.sln
```

### Frontend

```bash
cd frontend
npm install
npm run build
npm run test
```

### Run locally

```bash
# Terminal 1
cd backend/src/GreenfieldArchitecture.Api
dotnet run

# Terminal 2
cd frontend
npm start
```

The frontend runs on `http://localhost:4200` and proxies API calls to the backend during development.

## API overview

The deviation feature is exposed through a Minimal API endpoint group at `/api/deviations`.

- `GET /api/deviations` — list all deviations
- `GET /api/deviations/{id}` — get one deviation
- `POST /api/deviations` — create a deviation
- `PUT /api/deviations/{id}` — update a deviation
- `DELETE /api/deviations/{id}` — delete a deviation

The frontend route for the feature is `/deviations`.
