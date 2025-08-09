@echo off
setlocal enabledelayedexpansion

REM ====== CHECK CURRENT FOLDER ======
for %%I in ("%~dp0.") do set "CURRENT_DIR_NAME=%%~nI"
if /I not "!CURRENT_DIR_NAME!"=="CSV-To-Excel" (
    echo =====================================================
    echo  Please run this script from the folder: CSV-To-Excel
    echo  Current folder: "!CURRENT_DIR_NAME!"
    echo =====================================================
    pause
    exit /b 1
)

REM ====== STEP 1: Check and download Git, Node.js, Python ======
echo [1/4] Checking dependencies...

set "INSTALLERS_DIR=%~dp0installers"
if not exist "%INSTALLERS_DIR%" mkdir "%INSTALLERS_DIR%"

set "GIT_URL=https://github.com/git-for-windows/git/releases/latest/download/Git-2.46.0-64-bit.exe"
set "NODE_URL=https://nodejs.org/dist/v22.18.0/node-v22.18.0-x64.msi"
set "PYTHON_URL=https://www.python.org/ftp/python/3.12.5/python-3.12.5-amd64.exe"

where git >nul 2>nul
if errorlevel 1 (
    echo Git not found. Downloading installer...
    powershell -Command "Invoke-WebRequest '%GIT_URL%' -OutFile '%INSTALLERS_DIR%\git-installer.exe'"
    echo Please run manually: %INSTALLERS_DIR%\git-installer.exe
) else (
    echo Git found.
)

where node >nul 2>nul
if errorlevel 1 (
    echo Node.js not found. Downloading installer...
    powershell -Command "Invoke-WebRequest '%NODE_URL%' -OutFile '%INSTALLERS_DIR%\node-installer.msi'"
    echo Please run manually: %INSTALLERS_DIR%\node-installer.msi
) else (
    echo Node.js found.
)

where python >nul 2>nul
if errorlevel 1 (
    echo Python not found. Downloading installer...
    powershell -Command "Invoke-WebRequest '%PYTHON_URL%' -OutFile '%INSTALLERS_DIR%\python-installer.exe'"
    echo Please run manually: %INSTALLERS_DIR%\python-installer.exe
) else (
    echo Python found.
)

REM ====== STEP 2: Setup Python venv and dependencies ======
echo [2/4] Setting up Python environment...

if not exist "%~dp0venv" (
    python -m venv venv
)

call venv\Scripts\activate.bat
python -m pip install --upgrade pip
python -m pip install openpyxl pyinstaller

echo Running npm install...
start cmd /c "npm install &"
pause

REM ====== STEP 3: Clean and build Python executables ======
echo [3/4] Cleaning build folder and building Python executables...

REM Проверяем запущен ли run.exe и убиваем
tasklist /FI "IMAGENAME eq run.exe" | findstr /I "run.exe" >nul
if %errorlevel%==0 (
    echo Found running run.exe - terminating...
    taskkill /F /IM run.exe
)

REM Проверяем запущен ли CSV-To-Excel.exe и убиваем
tasklist /FI "IMAGENAME eq CSV-To-Excel.exe" | findstr /I "CSV-To-Excel.exe" >nul
if %errorlevel%==0 (
    echo Found running CSV-To-Excel.exe - terminating...
    taskkill /F /IM CSV-To-Excel.exe
)

REM Теперь можно удалять папку build

if exist build (
    echo Deleting contents of build folder...
    rmdir /s /q build
)

mkdir build

REM First exe: run.py
pyinstaller backend/run.py --noconsole --onefile --distpath build --name run

REM Second exe: CSV-To-Excel.py
pyinstaller backend/CSV-To-Excel.py --noconsole --onefile --distpath build --name CSV-To-Excel

REM ====== STEP 4: Build Node executable ======
echo [4/4] Building Node executable...
npx pkg . --output build/CSV-To-Excel_main.exe --targets node18-win-x64

echo ==== Done! All executables are in the build folder ====
pause
