# AEGIS-AI Reset Demo Script
# Restores a deterministic clean baseline state for database and workspace

Write-Host "Resetting AEGIS-AI database to clean state..." -ForegroundColor Cyan

.venv\Scripts\python -c "from backend.database.database import reset_database; reset_database(); print('[AEGIS] Database tables reset successfully.')"

if (Test-Path "workspace\output") {
    Remove-Item -Path "workspace\output\*" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "[AEGIS] Workspace output directory cleaned." -ForegroundColor Cyan
}

Write-Host "AEGIS-AI state reset to clean deterministic initial state." -ForegroundColor Green
