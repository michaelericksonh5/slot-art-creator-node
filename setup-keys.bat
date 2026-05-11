@echo off
setlocal EnableDelayedExpansion

title slot-art-creator-node - API key setup

:: This script is a thin launcher around setup-keys.js. The .js script is the
:: actual implementation — uses hidden-input prompts so keys never echo to the
:: terminal log. The .bat exists so Windows users can double-click instead of
:: typing a node command.
::
:: Keys are written to %USERPROFILE%\.h5g-slot-art-creator\.env which survives
:: plugin reinstalls and is read on MCP server startup.

cd /d "%~dp0"

echo.
echo  slot-art-creator-node - API key setup
echo  ======================================
echo.
echo  Your keys will be saved to:
echo    %USERPROFILE%\.h5g-slot-art-creator\.env
echo.
echo  Get keys here:
echo    Google Gemini   https://aistudio.google.com/apikey
echo    fal.ai          https://fal.ai/dashboard
echo.
echo  Either key alone works for all 4 generation tools. Setting both gives
echo  each tool its optimal backend.
echo.
echo  Your input is hidden - keys will not echo to this window.
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo  ERROR: Node.js not found.
    echo.
    echo  Install Node.js 18 or later from:
    echo    https://nodejs.org/en/download
    echo.
    echo  Then re-run this script.
    pause
    exit /b 1
)

call node setup-keys.js
set RC=%errorlevel%

echo.
if %RC% equ 0 (
    echo  Setup complete. You can close this window and return to Claude Code.
) else (
    echo  Setup did not complete. Review messages above and try again.
)
echo.
pause
endlocal
