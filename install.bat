@echo off
setlocal EnableDelayedExpansion

title slot-art-creator-node installer

cd /d "%~dp0"

echo.
echo  slot-art-creator-node ^| High 5 Games
echo  ========================================
echo  Node.js edition. No Python required.
echo.

:: -----------------------------------------------------------------------
:: Check Node.js
:: -----------------------------------------------------------------------

where node >nul 2>&1
if errorlevel 1 (
    echo  ERROR: Node.js not found.
    echo.
    echo  Install Node.js 18 or later from:
    echo    https://nodejs.org/en/download
    echo.
    echo  Then re-run this installer.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node --version 2^>nul') do set NODE_VER=%%v
echo  Found Node.js %NODE_VER%

for /f "tokens=1 delims=." %%m in ("%NODE_VER:v=%") do set NODE_MAJOR=%%m
if !NODE_MAJOR! LSS 18 (
    echo  ERROR: Node.js 18 or later required. You have %NODE_VER%.
    echo  Download from https://nodejs.org/en/download
    pause
    exit /b 1
)

:: -----------------------------------------------------------------------
:: Install npm dependencies
:: -----------------------------------------------------------------------

echo.
echo  Installing dependencies (this takes about 10 seconds)...
cd nb2-mcp-server

:: Use npm ci if package-lock.json exists for reproducible installs.
:: --no-audit / --no-fund suppress audit + funding noise (audit is already
:: run + cleaned at build time; coworkers don't need it again).
::
:: The deprecated `node-domexception` polyfill is replaced at install time
:: with a local shim (see nb2-mcp-server/shims/node-domexception/) wired
:: in via the npm `overrides` block in package.json. The shim re-exports
:: globalThis.DOMException, which is native on Node >=18 (our minimum).
:: Result: no deprecation warning at install time, no functional change.
if exist package-lock.json (
    call npm ci --prefer-offline --no-audit --no-fund 2>&1
    if errorlevel 1 (
        echo  Offline install failed, trying online...
        call npm ci --no-audit --no-fund 2>&1
    )
) else (
    call npm install --no-audit --no-fund 2>&1
)

if errorlevel 1 (
    echo.
    echo  ERROR: npm install failed. Check your internet connection and try again.
    pause
    exit /b 1
)
cd ..

echo  Dependencies installed.

:: -----------------------------------------------------------------------
:: API key setup
:: -----------------------------------------------------------------------

echo.
echo  This plugin needs an API key to generate images:
echo    Option 1 - Gemini  (preferred for generate / edit / upscale; works for smart-resize via NB2 + local crop): https://aistudio.google.com/apikey
echo    Option 2 - fal.ai  (preferred for nb2_smart_resize via the purpose-built nano-banana-pro endpoint):        https://fal.ai/dashboard
echo    Either key alone is sufficient. Setting BOTH gives each tool its optimal backend.
echo.
set /p RUN_SETUP="  Set up API key(s) now? [Y/n] "
if /i "!RUN_SETUP!"=="n" goto skip_keys

node setup-keys.js
goto done_keys

:skip_keys
echo.
echo  Skipped. Run later:  node setup-keys.js

:done_keys

:: -----------------------------------------------------------------------
:: Prepare Claude Code marketplace / Cowork upload ZIP
:: -----------------------------------------------------------------------

echo.
echo  Where do you want to install this plugin?
echo    [1] Claude Code local marketplace (this machine)
echo    [2] Build Claude Cowork upload ZIP
echo    [3] Both
echo    [4] Skip (I will install manually)
echo.
set /p INSTALL_TARGET="  Choice [1]: "
if "!INSTALL_TARGET!"=="" set INSTALL_TARGET=1

:: Resolve source path WITHOUT trailing backslash so we can compare directly
:: with the destination path. (%~dp0 always ends in \, the targets do not.)
set "SOURCE_DIR=%~dp0"
if "!SOURCE_DIR:~-1!"=="\" set "SOURCE_DIR=!SOURCE_DIR:~0,-1!"

if "!INSTALL_TARGET!"=="1" goto install_code
if "!INSTALL_TARGET!"=="2" goto package_cowork
if "!INSTALL_TARGET!"=="3" goto install_both
goto done_install

:install_code
echo.
echo  Preparing Claude Code local marketplace source...
set "CODE_MARKETPLACE_PLUGIN=%USERPROFILE%\Documents\Claude_Plugins\slot-art-creator-node"
call :copy_plugin "!SOURCE_DIR!" "!CODE_MARKETPLACE_PLUGIN!"
if errorlevel 1 goto done_install
echo  Marketplace source ready at: !CODE_MARKETPLACE_PLUGIN!
goto done_install

:package_cowork
echo.
echo  Building Claude Cowork upload ZIP...
pwsh -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\package-cowork-zip.ps1"
if errorlevel 1 (
    echo.
    echo  ERROR: Cowork ZIP packaging failed.
    pause
    exit /b 1
)
goto done_install

:install_both
echo.
echo  Preparing Claude Code marketplace and Cowork ZIP...
set "CODE_MARKETPLACE_PLUGIN=%USERPROFILE%\Documents\Claude_Plugins\slot-art-creator-node"
call :copy_plugin "!SOURCE_DIR!" "!CODE_MARKETPLACE_PLUGIN!"
if errorlevel 1 goto done_install
pwsh -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\package-cowork-zip.ps1"
if errorlevel 1 (
    echo.
    echo  ERROR: Cowork ZIP packaging failed.
    pause
    exit /b 1
)
echo  Marketplace source ready at: !CODE_MARKETPLACE_PLUGIN!
goto done_install

:: ---------------------------------------------------------------
:: Helper: copy_plugin <source> <dest>
:: Idempotent. Refuses to delete the destination when source==dest
:: (which would be self-destructive when the user runs install.bat
:: from inside the local marketplace source folder).
:: ---------------------------------------------------------------
:copy_plugin
setlocal
set "SRC=%~1"
set "DST=%~2"
:: Strip any trailing backslash from both for comparison
if "!SRC:~-1!"=="\" set "SRC=!SRC:~0,-1!"
if "!DST:~-1!"=="\" set "DST=!DST:~0,-1!"
:: Case-insensitive compare via /i
if /i "!SRC!"=="!DST!" (
    echo  Skipping copy — source and destination are the same path:
    echo    !SRC!
    echo  ^(the plugin is already at the target. No files to copy.^)
    endlocal
    exit /b 0
)
set "STAGE_ROOT=%TEMP%\slot-art-creator-node-%RANDOM%-%RANDOM%"
set "STAGE=!STAGE_ROOT!\slot-art-creator-node"
if exist "!STAGE_ROOT!" rmdir /s /q "!STAGE_ROOT!"
mkdir "!STAGE!" >nul 2>&1
for %%I in (.claude-plugin skills agents hooks nb2-mcp-server shared) do (
    if exist "!SRC!\%%I\" (
        robocopy "!SRC!\%%I" "!STAGE!\%%I" /E /XD node_modules dist generated logs .git .cache cache caches __pycache__ /XF .env .env.* *.log npm-debug.log* yarn-debug.log* yarn-error.log* pnpm-debug.log* *.pem *credentials* id_rsa* id_ed25519* >nul
        if !ERRORLEVEL! GEQ 8 (
            echo  ERROR: failed to stage %%I for marketplace copy.
            if exist "!STAGE_ROOT!" rmdir /s /q "!STAGE_ROOT!"
            endlocal
            exit /b 1
        )
    )
)
for %%I in (package.json README.md setup-keys.js) do (
    if exist "!SRC!\%%I" copy /y "!SRC!\%%I" "!STAGE!\%%I" >nul
)
if exist "!DST!" rmdir /s /q "!DST!"
for %%P in ("!DST!") do set "DST_PARENT=%%~dpP"
if not exist "!DST_PARENT!" mkdir "!DST_PARENT!" >nul 2>&1
move /y "!STAGE!" "!DST!" >nul
if exist "!STAGE_ROOT!" rmdir /s /q "!STAGE_ROOT!"
endlocal
exit /b 0

:done_install

:: -----------------------------------------------------------------------
:: Register the marketplace + plugin with Claude Code
:: -----------------------------------------------------------------------
:: Idempotent — adds h5g-plugins to settings.json's extraKnownMarketplaces
:: and writes a local marketplace manifest so the plugin shows up in the
:: documented Claude Code plugin marketplace flow.

if "!INSTALL_TARGET!"=="1" goto register_code
if "!INSTALL_TARGET!"=="3" goto register_code
goto skip_register

:register_code
    echo.
    echo  Registering plugin with Claude Code...
    set /p ENABLE_NOW="  Enable plugin automatically? [Y/n] "
    if /i "!ENABLE_NOW!"=="n" (
        call node "%~dp0tools\register-marketplace.js" 2>&1
    ) else (
        call node "%~dp0tools\register-marketplace.js" --enable 2>&1
    )
    if errorlevel 1 (
        echo.
        echo  WARNING: marketplace registration script failed.
        echo  You can re-run it later with:
        echo    node "%~dp0tools\register-marketplace.js" --enable
    )

:skip_register

echo.
:: -----------------------------------------------------------------------
:: H drive detection (shared asset folder)
:: -----------------------------------------------------------------------

echo.
set "H_DRIVE_PATH=H:\Shared drives\Content Management - AI\Production_AI 2\Asset_Creation_Suite"
if exist "%H_DRIVE_PATH%" (
    echo  [OK] Asset suite detected at: %H_DRIVE_PATH%
    echo       Projects will be saved in {GameID}_%USERNAME% folders here.
) else (
    echo  [!] Asset suite folder not found at H:\
    echo      Make sure Google Drive for Desktop is running and the H: drive is mounted.
    echo      Expected path: %H_DRIVE_PATH%
)

echo.
:: -----------------------------------------------------------------------
:: Final verification — read the installed state and confirm everything
:: is wired correctly. This is what tells the user (or a coworker) whether
:: the install actually succeeded end-to-end, vs. a half-finished state.
:: -----------------------------------------------------------------------
call node "%~dp0tools\verify-install.js"
set VERIFY_RC=!ERRORLEVEL!

echo.
if !VERIFY_RC! NEQ 0 (
    echo  Verification reported a failure above. Address the items marked [FAIL]
    echo  before reloading Claude Code, otherwise the slot- commands will not appear.
) else (
    echo  Press any key to exit. After this window closes, reload Claude Code
    echo  (Ctrl+Shift+P ^> Developer: Reload Window^) to activate the plugin.
)
pause
exit /b !VERIFY_RC!
