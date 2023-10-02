@ECHO OFF

::
:: SPDX-License-Identifier: Apache-2.0
::
:: The OpenSearch Contributors require contributions made to
:: this file be licensed under the Apache-2.0 license or a
:: compatible open source license.
::
:: Any modifications Copyright OpenSearch Contributors. See
:: GitHub history for details.
::

:: This script will find the appropriate Node.js runtime binary and execute it with any
:: parameters passed in.
::
:: Set a variable named OSD_USE_NODE_JS_FILE_PATH to have it prefixed with OSD_HOME and executed
:: Example: SET OSD_USE_NODE_JS_FILE_PATH=\src\cli\dist
::
:: NODE_OPTIONS is built using config/node.options and overridden by any previously set NODE_OPTIONS.
:: To pass in any specific defaults that can be overridden by both of them, use OSD_NODE_OPTS_PREFIX.

SETLOCAL ENABLEDELAYEDEXPANSION

SET SCRIPT_DIR=%~dp0
FOR %%I IN ("%SCRIPT_DIR%..") DO SET OSD_HOME=%%~dpfI

SET CONFIG_DIR=%OSD_PATH_CONF%
IF NOT DEFINED OSD_PATH_CONF (
  SET "CONFIG_DIR=%OSD_HOME%\config"
)

:: Places to look for the Node.js binary in order: OSD_NODE_HOME > NODE_HOME > bundled with OSD > system-wide
IF DEFINED OSD_NODE_HOME (
  SET "NODE=%OSD_NODE_HOME%\node.exe"
  SET NODE_ERROR_MSG=in OSD_NODE_HOME
  SET NODE_ERROR_SHOW=true
  GOTO CheckNode
)
IF DEFINED NODE_HOME (
  SET "NODE=%NODE_HOME%\node.exe"
  SET NODE_ERROR_MSG=in NODE_HOME
  SET NODE_ERROR_SHOW=true
  GOTO CheckNode
)

SET NODE=%OSD_HOME%\node\node.exe
SET NODE_ERROR_MSG=bundled with OpenSearch Dashboards
:: A bin folder at the root is only present in release builds that have a bundled Node.js binary
IF EXIST "%OSD_HOME%\bin" (
  SET NODE_ERROR_SHOW=true
)

:CheckNode

IF EXIST "%NODE%" (
  :: Node.js binary was found where it was expected; no need to show an error
  SET "NODE_ERROR_SHOW="
) ELSE (
  :: Try finding the system-wide Node.js binary
  FOR /F "tokens=* USEBACKQ" %%F IN (`where node.exe`) DO (
   SET "NODE=%%F"
   :: Bail out after finding the first one
   GOTO CheckNodeAgain
  )
)

:CheckNodeAgain

IF NOT EXIST "%NODE%" (
  :: Irrespective of NODE_ERROR_SHOW, show the error; NODE_ERROR_MSG is guaranteed to be set
  ECHO Could not find a Node.js runtime binary %NODE_ERROR_MSG% or on the system >&2
  EXIT /B 1
)

:: Node.js binary was found but not where it was told to be, so show a warning
IF DEFINED NODE_ERROR_SHOW (
  ECHO Could not find a Node.js runtime binary %NODE_ERROR_MSG% but found one at %NODE% >&2
)

IF EXIST "%CONFIG_DIR%\node.options" (
  FOR /F "eol=# tokens=*" %%i IN (%CONFIG_DIR%\node.options) DO (
    :: This cannot accept spaces within a line of node.options
    IF [!OSD_NODE_OPTS!] == [] (
      SET "OSD_NODE_OPTS=%%i"
    )	ELSE (
      SET "OSD_NODE_OPTS=!OSD_NODE_OPTS! %%i"
    )
  )
)

SET "NODE_OPTIONS=%OSD_NODE_OPTS_PREFIX% %OSD_NODE_OPTS% %NODE_OPTIONS%"

:: If a file path was provided for execution, prefix with OSD_HOME; use relative paths to avoid the need for this.
IF DEFINED OSD_USE_NODE_JS_FILE_PATH (
  "%NODE%" "%OSD_HOME%%OSD_USE_NODE_JS_FILE_PATH%" %*
) ELSE IF NOT "%~1" == "" (
  "%NODE%" %*
)

ENDLOCAL
