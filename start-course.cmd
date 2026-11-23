@echo off
setlocal EnableExtensions

set "COURSE_ROOT=%~dp0"
set "COURSE_NODE=node"
set "COURSE_AGENT_FLAGS="
if /I "%~1"=="--agent" set "COURSE_AGENT_FLAGS=--agent"
if /I "%~1"=="--agent" if /I "%~2"=="--install" set "COURSE_AGENT_FLAGS=--agent --install"

if "%COURSE_MOCK_BOOTSTRAP_TEST%"=="1" if "%COURSE_MOCK_FORCE_NODE_MISSING%"=="1" goto :node_missing

where node >nul 2>&1
if errorlevel 1 goto :node_missing

rem Vite and electron-vite need Node.js 22.12 or newer, not just any 22.x.
for /f "usebackq delims=" %%V in (`node -p "const [a,b]=process.versions.node.split('.').map(Number); a>22||(a===22&&b>=12)?1:0"`) do set "COURSE_NODE_OK=%%V"
if not "%COURSE_NODE_OK%"=="1" goto :node_missing
goto :run_setup

:node_missing
type "%COURSE_ROOT%scripts\startup-first-run.txt"
echo.
echo Required: Node.js 22.12 or newer
echo Command: winget install --id OpenJS.NodeJS.LTS
echo Scope: system application
echo.

where winget >nul 2>&1
if errorlevel 1 (
  echo Automatic installation is unavailable because winget was not found.
  echo Manual download: https://nodejs.org/en/download
  echo No installation was run.
  exit /b 2
)

if defined COURSE_AGENT_FLAGS (
  if "%COURSE_AGENT_FLAGS%"=="--agent --install" goto :install_node
  echo Node.js installation needs learner consent.
  exit /b 2
)

set "COURSE_INSTALL_NODE="
set /p "COURSE_INSTALL_NODE=Run the displayed Node.js installation? [y/N] "
if /I "%COURSE_INSTALL_NODE%"=="Y" goto :install_node
if /I "%COURSE_INSTALL_NODE%"=="YES" goto :install_node
echo No installation was run.
exit /b 2

:install_node
winget install --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
if errorlevel 1 (
  echo Node.js installation failed.
  exit /b 3
)

if exist "%ProgramFiles%\nodejs\node.exe" (
  set "COURSE_NODE=%ProgramFiles%\nodejs\node.exe"
  set "PATH=%ProgramFiles%\nodejs;%PATH%"
) else (
  where node >nul 2>&1
  if errorlevel 1 (
    echo Node.js installed, but this terminal cannot locate it yet.
    echo Open a new terminal and run .\start-course.cmd again.
    exit /b 3
  )
)

:run_setup
"%COURSE_NODE%" "%COURSE_ROOT%scripts\setup-and-start.mjs" %COURSE_AGENT_FLAGS%
set "COURSE_RESULT=%ERRORLEVEL%"

if "%COURSE_RESULT%"=="0" exit /b 0
if "%COURSE_RESULT%"=="2" exit /b 2
if "%COURSE_RESULT%"=="3" exit /b 3
if "%COURSE_RESULT%"=="4" exit /b 4
if "%COURSE_RESULT%"=="5" exit /b 5
exit /b 5
