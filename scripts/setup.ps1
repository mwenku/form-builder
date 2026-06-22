$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root
. "$PSScriptRoot\lib.ps1"

Ensure-ComposeEnv
corepack enable | Out-Null
pnpm install
Push-Location apps/api
go mod download
Pop-Location
pnpm prepare

docker compose --env-file compose.env up -d postgres api
& "$PSScriptRoot\wait-api.ps1"
if (Get-Command typeshare -ErrorAction SilentlyContinue) { typeshare . }

Write-Host "Setup complete. Run: scripts\dev.bat"
