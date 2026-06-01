@echo off
title FederiGene Installation Wizard
echo ===================================================
echo     FederiGene Platform Installer
echo ===================================================
echo.
echo Step 1: Checking for Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH! 
    echo Please install Python 3.10+ and try again.
    pause
    exit /b
)
echo Python found.

echo.
echo Step 2: Creating Virtual Environment...
if not exist ".venv" (
    python -m venv .venv
    echo Virtual environment created.
) else (
    echo Virtual environment already exists.
)

echo.
echo Step 3: Installing Backend Dependencies...
.venv\Scripts\pip.exe install -r Backend\requirements.txt

echo.
echo Step 4: Initializing Local Database (SQLite)...
echo Ensuring clean start for local standalone mode...
.venv\Scripts\python.exe Backend\seed_data.py
.venv\Scripts\python.exe Backend\seed_datasets.py

echo.
echo Step 5: Creating Desktop Shortcut...
set SCRIPT="%TEMP%\CreateShortcut.vbs"
echo Set oWS = WScript.CreateObject("WScript.Shell") > %SCRIPT%
echo sLinkFile = "%USERPROFILE%\Desktop\FederiGene App.lnk" >> %SCRIPT%
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %SCRIPT%
echo oLink.TargetPath = "%~dp0FederiGene_Launcher.bat" >> %SCRIPT%
echo oLink.WorkingDirectory = "%~dp0" >> %SCRIPT%
echo oLink.Description = "Launch FederiGene Platform" >> %SCRIPT%
echo oLink.IconLocation = "%~dp0Frontend\public\vite.svg" >> %SCRIPT%
echo oLink.Save >> %SCRIPT%
cscript /nologo %SCRIPT%
del %SCRIPT%

echo.
echo ===================================================
echo     INSTALLATION COMPLETE!
echo ===================================================
echo A shortcut "FederiGene App" has been placed on your Desktop.
echo You can now close this window and double click the shortcut to launch the app!
echo.
pause
