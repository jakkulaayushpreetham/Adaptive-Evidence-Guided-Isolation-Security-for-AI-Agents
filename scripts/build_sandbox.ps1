$ErrorActionPreference = "Stop"

Write-Host "Building AEGIS-AI sandbox..."

docker build `
    -t aegis-agent:latest `
    .\sandbox

if ($LASTEXITCODE -ne 0) {
    throw "AEGIS sandbox build failed."
}

Write-Host "AEGIS sandbox image built successfully."
