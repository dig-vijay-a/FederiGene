@echo off
title FederiGene Application Server
echo Starting FederiGene Server...
echo Please leave this window open while using the app.

:: Start the FastAPI server in the background
cd Backend
start /B ..\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
cd ..

:: Wait for 3 seconds to let the server start
timeout /t 3 /nobreak >nul

:: Open the default web browser to the app
start http://127.0.0.1:8000

echo Application launched in browser.
:: Keep window open to hold the background process, or the user can close it to kill the server.
:: Note: If the user closes this window, we want to kill the uvicorn process.
:: We use a block loop.
:wait
pause
