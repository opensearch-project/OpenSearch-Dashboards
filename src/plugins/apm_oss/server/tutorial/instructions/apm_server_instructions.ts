/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { i18n } from '@osd/i18n';

export const createEditConfig = () => ({
  title: i18n.translate('apmOss.tutorial.editConfig.title', {
    defaultMessage: 'Edit the configuration',
  }),
  textPre: i18n.translate('apmOss.tutorial.editConfig.textPre', {
    defaultMessage:
      "If you're using a secured version of OpenSearch, you must specify \
credentials in the `apm-server.yml` config file.",
  }),
  commands: [
    'output.opensearch:',
    '    hosts: ["<opensearch_url>"]',
    '    username: <username>',
    '    password: <password>',
  ],
});

const createStartServer = () => ({
  title: i18n.translate('apmOss.tutorial.startServer.title', {
    defaultMessage: 'Start APM Server',
  }),
  textPre: i18n.translate('apmOss.tutorial.startServer.textPre', {
    defaultMessage:
      'The server processes and stores application performance metrics in OpenSearch.',
  }),
});

export function createStartServerUnixSysv() {
  const START_SERVER = createStartServer();

  return {
    title: START_SERVER.title,
    textPre: START_SERVER.textPre,
    commands: ['service apm-server start'],
  };
}

export function createStartServerUnix() {
  const START_SERVER = createStartServer();

  return {
    title: START_SERVER.title,
    textPre: START_SERVER.textPre,
    commands: ['./apm-server -e'],
  };
}

const createDownloadServerTitle = () =>
  i18n.translate('apmOss.tutorial.downloadServer.title', {
    defaultMessage: 'Download and unpack APM Server',
  });

export const createDownloadServerOsx = () => ({
  title: createDownloadServerTitle(),
  commands: [
    'curl -L -O https://artifacts.opensearch.org/downloads/apm-server/apm-server-{config.opensearchDashboards.version}-darwin-x64.tar.gz',
    'tar xzvf apm-server-{config.opensearchDashboards.version}-darwin-x64.tar.gz',
    'cd apm-server-{config.opensearchDashboards.version}-darwin-x64/',
  ],
});

export const createDownloadServerDeb = () => ({
  title: createDownloadServerTitle(),
  commands: [
    'curl -L -O https://artifacts.opensearch.org/downloads/apm-server/apm-server-{config.opensearchDashboards.version}-amd64.deb',
    'sudo dpkg -i apm-server-{config.opensearchDashboards.version}-amd64.deb',
  ],
  textPost: i18n.translate('apmOss.tutorial.downloadServerTitle', {
    defaultMessage: 'Looking for the 32-bit packages? See the [Download page]({downloadPageLink}).',
    values: {
      downloadPageLink: '{config.docs.base_url}downloads/apm/apm-server',
    },
  }),
});

export const createDownloadServerRpm = () => ({
  title: createDownloadServerTitle(),
  commands: [
    'curl -L -O https://artifacts.opensearch.org/downloads/apm-server/apm-server-{config.opensearchDashboards.version}-x64.rpm',
    'sudo rpm -vi apm-server-{config.opensearchDashboards.version}-x64.rpm',
  ],
  textPost: i18n.translate('apmOss.tutorial.downloadServerRpm', {
    defaultMessage: 'Looking for the 32-bit packages? See the [Download page]({downloadPageLink}).',
    values: {
      downloadPageLink: '{config.docs.base_url}downloads/apm/apm-server',
    },
  }),
});

export function createWindowsServerInstructions() {
  const START_SERVER = createStartServer();

  return [
    {
      title: createDownloadServerTitle(),
      textPre: i18n.translate('apmOss.tutorial.windowsServerInstructions.textPre', {
        defaultMessage:
          '1. Download the APM Server Windows zip file from the \
[Download page]({downloadPageLink}).\n2. Extract the contents of \
the zip file into {zipFileExtractFolder}.\n3. Rename the {apmServerDirectory} \
directory to `APM-Server`.\n4. Open a PowerShell prompt as an Administrator \
(right-click the PowerShell icon and select \
**Run As Administrator**). If you are running Windows XP, you might need to download and install \
PowerShell.\n5. From the PowerShell prompt, run the following commands to install APM Server as a Windows service:',
        values: {
          downloadPageLink: 'https://opensearch.org/downloads/apm/apm-server',
          zipFileExtractFolder: '`C:\\Program Files`',
          apmServerDirectory: '`apm-server-{config.opensearchDashboards.version}-windows`',
        },
      }),
      commands: [`cd 'C:\\Program Files\\APM-Server'`, `.\\install-service-apm-server.ps1`],
      textPost: i18n.translate('apmOss.tutorial.windowsServerInstructions.textPost', {
        defaultMessage:
          'Note: If script execution is disabled on your system, \
you need to set the execution policy for the current session \
to allow the script to run. For example: {command}.',
        values: {
          command:
            '`PowerShell.exe -ExecutionPolicy UnRestricted -File .\\install-service-apm-server.ps1`',
        },
      }),
    },
    createEditConfig(),
    {
      title: START_SERVER.title,
      textPre: START_SERVER.textPre,
      commands: ['Start-Service apm-server'],
    },
  ];
}
