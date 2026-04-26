#!/usr/bin/env bash
set -euo pipefail

solution_path="backend/GreenfieldArchitecture.sln"
frontend_dir="frontend"

echo "🔐 Trusting HTTPS dev certificate…"
dotnet dev-certs https --trust 2>/dev/null || echo "  (Linux: manual trust required — see dotnet dev-certs docs)"

echo "📦 Restoring .NET packages…"
dotnet restore "$solution_path"

if [ -d "$frontend_dir" ]; then
  echo "📦 Installing npm packages…"
  npm --prefix "$frontend_dir" install
fi

echo "✅ Dev environment ready. Run 'dotnet run --project backend/src/GreenfieldArchitecture.Api' to start the backend."
