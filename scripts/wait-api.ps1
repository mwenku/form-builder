Param(
  [string]$ApiPort = $env:API_PORT
)

if (-not $ApiPort) { $ApiPort = "8080" }

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\lib.ps1"

Write-Host "Waiting for API on port $ApiPort..."
Wait-ApiHealth -Port $ApiPort
