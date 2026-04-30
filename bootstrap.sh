#!/usr/bin/env sh
# bootstrap.sh — local development setup for Greenfield
# Run once after cloning to restore dependencies, then follow the start instructions.
set -euo pipefail

# ---------------------------------------------------------------------------
# Helper: verify a command exists before proceeding
# ---------------------------------------------------------------------------
require_cmd() {
  cmd="$1"
  if ! command -v "$cmd" > /dev/null 2>&1; then
    echo "ERROR: Required command '$cmd' not found. Please install it and re-run." >&2
    exit 1
  fi
  echo "  ✔  $cmd found"
}

echo ""
echo "=== Greenfield Bootstrap ==="
echo ""

# ---------------------------------------------------------------------------
# Pre-flight checks
# ---------------------------------------------------------------------------
echo "Checking required tools..."
require_cmd dotnet
require_cmd npm
echo ""

# ---------------------------------------------------------------------------
# Backend: restore NuGet packages
# ---------------------------------------------------------------------------
echo "Restoring backend NuGet packages..."
dotnet restore backend/Greenfield.sln
echo ""

# ---------------------------------------------------------------------------
# Frontend: install npm packages
# ---------------------------------------------------------------------------
echo "Installing frontend npm packages..."
(cd frontend && npm install)
echo ""

# ---------------------------------------------------------------------------
# Ready — print start sequence
# ---------------------------------------------------------------------------
echo "================================================================"
echo "  Setup complete! Start the application with two terminal tabs:"
echo ""
echo "  Tab 1 — Backend API (listens on http://localhost:5000):"
echo "    dotnet run --project backend/src/Greenfield.Api/Greenfield.Api.csproj"
echo ""
echo "  Tab 2 — Frontend dev server (http://localhost:4200):"
echo "    cd frontend && npm start"
echo ""
echo "  NOTE: Always use 'npm start' (not 'ng serve' without flags) for"
echo "  local development. It passes --proxy-config proxy.conf.json so"
echo "  that every /api/... request is forwarded to the backend without"
echo "  path rewriting — preserving the /api prefix end-to-end."
echo "================================================================"
echo ""
