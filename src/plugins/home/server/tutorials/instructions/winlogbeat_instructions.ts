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
import { INSTRUCTION_VARIANT } from '../../../common/instruction_variant';
import { getSpaceIdForBeatsTutorial } from './get_space_id_for_beats_tutorial';
import { TutorialContext } from '../../services/tutorials/lib/tutorials_registry_types';

export const createWinlogbeatInstructions = (context?: TutorialContext) => ({
  INSTALL: {
    WINDOWS: {
      title: i18n.translate('home.tutorials.common.winlogbeatInstructions.install.windowsTitle', {
        defaultMessage: 'Download and install Winlogbeat',
      }),
      textPre: i18n.translate(
        'home.tutorials.common.winlogbeatInstructions.install.windowsTextPre',
        {
          defaultMessage:
            'First time using Winlogbeat? See the [Quick Start]({winlogbeatLink}).\n\
 1. Download the Winlogbeat Windows zip file from the [Download]({opensearchLink}) page.\n\
 2. Extract the contents of the zip file into {folderPath}.\n\
 3. Rename the {directoryName} directory to `Winlogbeat`.\n\
 4. Open a PowerShell prompt as an Administrator (right-click the PowerShell icon and select \
**Run As Administrator**). If you are running Windows XP, you might need to download and install PowerShell.\n\
 5. From the PowerShell prompt, run the following commands to install Winlogbeat as a Windows service.',
          values: {
            directoryName: '`winlogbeat-{config.opensearchDashboards.version}-windows`',
            folderPath: '`C:\\Program Files`',
            winlogbeatLink:
              '{config.docs.beats.winlogbeat}/winlogbeat-installation-configuration.html',
            opensearchLink: 'https://opensearch.org/downloads/beats/winlogbeat',
          },
        }
      ),
      commands: ['cd "C:\\Program Files\\Winlogbeat"', '.\\install-service-winlogbeat.ps1'],
      textPost: i18n.translate(
        'home.tutorials.common.winlogbeatInstructions.install.windowsTextPost',
        {
          defaultMessage:
            'Modify the settings under `output.opensearch` in the {path} file to point to your opensearch installation.',
          values: { path: '`C:\\Program Files\\Winlogbeat\\winlogbeat.yml`' },
        }
      ),
    },
  },
  START: {
    WINDOWS: {
      title: i18n.translate('home.tutorials.common.winlogbeatInstructions.start.windowsTitle', {
        defaultMessage: 'Start Winlogbeat',
      }),
      textPre: i18n.translate('home.tutorials.common.winlogbeatInstructions.start.windowsTextPre', {
        defaultMessage:
          'The `setup` command loads the OpenSearch Dashboards dashboards. If the dashboards are already set up, omit this command.',
      }),
      commands: ['.\\winlogbeat.exe setup', 'Start-Service winlogbeat'],
    },
  },
  CONFIG: {
    WINDOWS: {
      title: i18n.translate('home.tutorials.common.winlogbeatInstructions.config.windowsTitle', {
        defaultMessage: 'Edit the configuration',
      }),
      textPre: i18n.translate(
        'home.tutorials.common.winlogbeatInstructions.config.windowsTextPre',
        {
          defaultMessage: 'Modify {path} to set the connection information:',
          values: {
            path: '`C:\\Program Files\\Winlogbeat\\winlogbeat.yml`',
          },
        }
      ),
      commands: [
        'output.opensearch:',
        '  hosts: ["<opensearch_url>"]',
        '  username: "opensearch"',
        '  password: "<password>"',
        'setup.opensearchDashboards:',
        '  host: "<opensearch_dashboards_url>"',
        getSpaceIdForBeatsTutorial(context),
      ],
      textPost: i18n.translate(
        'home.tutorials.common.winlogbeatInstructions.config.windowsTextPost',
        {
          defaultMessage:
            'Where {passwordTemplate} is the password of the `opensearch` user, {opensearchUrlTemplate} is the URL of opensearch, \
and {opensearchDashboardsUrlTemplate} is the URL of OpenSearch Dashboards.',
          values: {
            passwordTemplate: '`<password>`',
            opensearchUrlTemplate: '`<opensearch_url>`',
            opensearchDashboardsUrlTemplate: '`<opensearch_dashboards_url>`',
          },
        }
      ),
    },
  },
});

export function winlogbeatStatusCheck() {
  return {
    title: i18n.translate('home.tutorials.common.winlogbeatStatusCheck.title', {
      defaultMessage: 'Module status',
    }),
    text: i18n.translate('home.tutorials.common.winlogbeatStatusCheck.text', {
      defaultMessage: 'Check that data is received from Winlogbeat',
    }),
    btnLabel: i18n.translate('home.tutorials.common.winlogbeatStatusCheck.buttonLabel', {
      defaultMessage: 'Check data',
    }),
    success: i18n.translate('home.tutorials.common.winlogbeatStatusCheck.successText', {
      defaultMessage: 'Data successfully received',
    }),
    error: i18n.translate('home.tutorials.common.winlogbeatStatusCheck.errorText', {
      defaultMessage: 'No data has been received yet',
    }),
    opensearchHitsCheck: {
      index: 'winlogbeat-*',
      query: {
        bool: {
          filter: {
            term: {
              'agent.type': 'winlogbeat',
            },
          },
        },
      },
    },
  };
}

export function onPremInstructions(context?: TutorialContext) {
  const WINLOGBEAT_INSTRUCTIONS = createWinlogbeatInstructions(context);

  return {
    instructionSets: [
      {
        title: i18n.translate(
          'home.tutorials.common.winlogbeat.premInstructions.gettingStarted.title',
          {
            defaultMessage: 'Getting Started',
          }
        ),
        instructionVariants: [
          {
            id: INSTRUCTION_VARIANT.WINDOWS,
            instructions: [
              WINLOGBEAT_INSTRUCTIONS.INSTALL.WINDOWS,
              WINLOGBEAT_INSTRUCTIONS.CONFIG.WINDOWS,
              WINLOGBEAT_INSTRUCTIONS.START.WINDOWS,
            ],
          },
        ],
        statusCheck: winlogbeatStatusCheck(),
      },
    ],
  };
}
