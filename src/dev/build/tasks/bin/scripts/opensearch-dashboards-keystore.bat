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

TITLE OpenSearch Dashboards Keystore
SET OSD_USE_NODE_JS_FILE_PATH=src\cli_keystore\dist
call %~dp0\use_node.bat %*

ENDLOCAL