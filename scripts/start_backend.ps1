# AEGIS-AI Launch Backend Service
# Starts FastAPI server with Uvicorn on http://127.0.0.1:8000

Write-Host "Launching AEGIS-AI FastAPI Security Controller on http://localhost:8000..." -ForegroundColor Cyan

.venv\Scripts\uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
