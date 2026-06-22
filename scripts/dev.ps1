$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root
. "$PSScriptRoot\lib.ps1"

docker compose --env-file compose.env up -d postgres api
& "$PSScriptRoot\wait-api.ps1"
pnpm dev
