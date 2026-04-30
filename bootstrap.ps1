# bootstrap.ps1 — local development setup for Greenfield (Windows / PowerShell)
# Run once after cloning to restore dependencies, then follow the start instructions.
$ErrorActionPreference = 'Stop'

# ---------------------------------------------------------------------------
# Helper: verify a command exists before proceeding
# ---------------------------------------------------------------------------
function Require-Command {
    param([string]$Cmd)
    if (-not (Get-Command $Cmd -ErrorAction SilentlyContinue)) {
        Write-Error "Required command '$Cmd' not found. Please install it and re-run."
        exit 1
    }
    Write-Host "  OK  $Cmd found" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Greenfield Bootstrap ===" -ForegroundColor Cyan
Write-Host ""

# ---------------------------------------------------------------------------
# Pre-flight checks
# ---------------------------------------------------------------------------
Write-Host "Checking required tools..."
Require-Command dotnet
Require-Command npm
Write-Host ""

# ---------------------------------------------------------------------------
# Backend: restore NuGet packages
# ---------------------------------------------------------------------------
Write-Host "Restoring backend NuGet packages..."
dotnet restore backend/Greenfield.sln
Write-Host ""

# ---------------------------------------------------------------------------
# Frontend: install npm packages
# ---------------------------------------------------------------------------
Write-Host "Installing frontend npm packages..."
Push-Location frontend
try {
    npm install
} finally {
    Pop-Location
}
Write-Host ""

# ---------------------------------------------------------------------------
# Ready — print start sequence
# ---------------------------------------------------------------------------
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  Setup complete! Start the application with two terminal tabs:"
Write-Host ""
Write-Host "  Tab 1 — Backend API (listens on http://localhost:5000):"
Write-Host "    dotnet run --project backend/src/Greenfield.Api/Greenfield.Api.csproj"
Write-Host ""
Write-Host "  Tab 2 — Frontend dev server (http://localhost:4200):"
Write-Host "    cd frontend ; npm start"
Write-Host ""
Write-Host "  NOTE: Always use 'npm start' (not 'ng serve' without flags) for"
Write-Host "  local development. It passes --proxy-config proxy.conf.json so"
Write-Host "  that every /api/... request is forwarded to the backend without"
Write-Host "  path rewriting — preserving the /api prefix end-to-end."
Write-Host ""
Write-Host "  API Documentation:" -ForegroundColor Yellow
Write-Host "    Browser UI  : http://localhost:5000/api/docs"
Write-Host "    OpenAPI JSON: http://localhost:5000/openapi/v1.json"
Write-Host ""
Write-Host "  Verification (integration tests):" -ForegroundColor Yellow
Write-Host "    dotnet test backend/tests/Greenfield.Api.IntegrationTests/Greenfield.Api.IntegrationTests.csproj"
Write-Host ""
Write-Host "  Verification (frontend build + unit tests):" -ForegroundColor Yellow
Write-Host "    cd frontend ; npm run build"
Write-Host "    cd frontend ; npm test -- --watch=false --browsers=ChromeHeadless"
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
