@echo off
setlocal

cd /d "%~dp0"

cd ui

if not exist "node_modules" (
    call npm install
)

call npm run build
if errorlevel 1 (
    pause
    exit /b 1
)

cd ..\root

if not exist ".venv" (
    python -m venv .venv
)

call .venv\Scripts\activate.bat

pip install -r requirements.txt

python main.py

pause
endlocal
