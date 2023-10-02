@echo off

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

SETLOCAL ENABLEDELAYEDEXPANSION

:: Include pre-defined node option
SET "OSD_NODE_OPTS_PREFIX=--no-warnings --max-http-header-size=65536"
SET NODE_ENV="production"

TITLE OpenSearch Dashboards
SET OSD_USE_NODE_JS_FILE_PATH=\src\cli\dist
call %~dp0\use_node.bat %*

ENDLOCAL
