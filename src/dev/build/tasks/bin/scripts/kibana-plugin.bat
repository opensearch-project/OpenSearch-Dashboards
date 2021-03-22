@echo off

SETLOCAL ENABLEDELAYEDEXPANSION

set SCRIPT_DIR=%~dp0
for %%I in ("%SCRIPT_DIR%..") do set DIR=%%~dpfI

set NODE=%DIR%\node\node.exe
set NODE_ENV="production"

If Not Exist "%NODE%" (
  Echo unable to find usable node.js executable.
  Exit /B 1
)

set CONFIG_DIR=%OSD_PATH_CONF%
If [%OSD_PATH_CONF%] == [] (
  set CONFIG_DIR=%DIR%\config
)

IF EXIST "%CONFIG_DIR%\node.options" (
  for /F "eol=# tokens=*" %%i in (%CONFIG_DIR%\node.options) do (
    If [!NODE_OPTIONS!] == [] (
      set "NODE_OPTIONS=%%i"
    )	Else (
      set "NODE_OPTIONS=!NODE_OPTIONS! %%i"
    )
  )
)

:: Include pre-defined node option
set "NODE_OPTIONS=--no-warnings %NODE_OPTIONS%"

TITLE OpenSearch Dashboards Server
"%NODE%" "%DIR%\src\cli_plugin\dist" %*

:finally

ENDLOCAL
