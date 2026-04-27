$solutionPath = "backend/GreenfieldArchitecture.sln"
$frontendDir = if (Test-Path "frontend") { "frontend" } elseif (Test-Path "client") { "client" } else { $null }

Write-Host "🔐 Trusting HTTPS dev certificate…"
dotnet dev-certs https --trust

Write-Host "📦 Restoring .NET packages…"
dotnet restore $solutionPath

if ($frontendDir) {
    Write-Host "📦 Installing npm packages in $frontendDir…"
    npm --prefix $frontendDir install
}

Write-Host "✅ Dev environment ready. Run 'dotnet run --project backend/src/GreenfieldArchitecture.Api' to start the backend."
