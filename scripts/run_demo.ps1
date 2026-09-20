# AEGIS-AI Run Showcase Demo Script
# Prepares clean baseline and executes the complete 10-step showcase sequence

Write-Host "Preparing AEGIS-AI showcase demonstration environment..." -ForegroundColor Cyan

& "scripts\reset_demo.ps1"

Write-Host "`nLaunching AEGIS-AI Showcase Demonstration Sequence..." -ForegroundColor Green

.venv\Scripts\python -m experiments.showcase_demo

Write-Host "AEGIS-AI showcase demonstration complete." -ForegroundColor Green
