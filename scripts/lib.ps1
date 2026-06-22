function Wait-ApiHealth {
  param([string]$Port = "8080")
  for ($i = 0; $i -lt 30; $i++) {
    try {
      $response = Invoke-WebRequest -Uri "http://localhost:$Port/health" -UseBasicParsing -TimeoutSec 2
      if ($response.StatusCode -eq 200) {
        Write-Host "API is ready"
        return
      }
    } catch {
      Start-Sleep -Seconds 1
    }
  }
  throw "API did not become healthy in time"
}

function Ensure-ComposeEnv {
  $root = Split-Path $PSScriptRoot -Parent
  $example = Join-Path $root "compose.env.example"
  $target = Join-Path $root "compose.env"
  if (-not (Test-Path $target)) {
    Copy-Item $example $target
    Write-Host "Created compose.env from compose.env.example"
  }
}
