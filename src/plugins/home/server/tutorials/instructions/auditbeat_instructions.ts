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
import { Platform, TutorialContext } from '../../services/tutorials/lib/tutorials_registry_types';

export const createAuditbeatInstructions = (context?: TutorialContext) => ({
  INSTALL: {
    OSX: {
      title: i18n.translate('home.tutorials.common.auditbeatInstructions.install.osxTitle', {
        defaultMessage: 'Download and install Auditbeat',
      }),
      textPre: i18n.translate('home.tutorials.common.auditbeatInstructions.install.osxTextPre', {
        defaultMessage: 'First time using Auditbeat? See the [Quick Start]({linkUrl}).',
        values: {
          linkUrl: '{config.docs.beats.auditbeat}/auditbeat-installation-configuration.html',
        },
      }),
      commands: [
        'curl -L -O https://artifacts.opensearch.org/downloads/beats/auditbeat/auditbeat-{config.opensearchDashboards.version}-darwin-x64.tar.gz',
        'tar xzvf auditbeat-{config.opensearchDashboards.version}-darwin-x64.tar.gz',
        'cd auditbeat-{config.opensearchDashboards.version}-darwin-x64/',
      ],
    },
    DEB: {
      title: i18n.translate('home.tutorials.common.auditbeatInstructions.install.debTitle', {
        defaultMessage: 'Download and install Auditbeat',
      }),
      textPre: i18n.translate('home.tutorials.common.auditbeatInstructions.install.debTextPre', {
        defaultMessage: 'First time using Auditbeat? See the [Quick Start]({linkUrl}).',
        values: {
          linkUrl: '{config.docs.beats.auditbeat}/auditbeat-installation-configuration.html',
        },
      }),
      commands: [
        'curl -L -O https://artifacts.opensearch.org/downloads/beats/auditbeat/auditbeat-{config.opensearchDashboards.version}-amd64.deb',
        'sudo dpkg -i auditbeat-{config.opensearchDashboards.version}-amd64.deb',
      ],
      textPost: i18n.translate('home.tutorials.common.auditbeatInstructions.install.debTextPost', {
        defaultMessage: 'Looking for the 32-bit packages? See the [Download page]({linkUrl}).',
        values: {
          linkUrl: 'https://opensearch.org/docs/latest/downloads/beats/auditbeat',
        },
      }),
    },
    RPM: {
      title: i18n.translate('home.tutorials.common.auditbeatInstructions.install.rpmTitle', {
        defaultMessage: 'Download and install Auditbeat',
      }),
      textPre: i18n.translate('home.tutorials.common.auditbeatInstructions.install.rpmTextPre', {
        defaultMessage: 'First time using Auditbeat? See the [Quick Start]({linkUrl}).',
        values: {
          linkUrl: '{config.docs.beats.auditbeat}/auditbeat-installation-configuration.html',
        },
      }),
      commands: [
        'curl -L -O https://artifacts.opensearch.org/downloads/beats/auditbeat/auditbeat-{config.opensearchDashboards.version}-x64.rpm',
        'sudo rpm -vi auditbeat-{config.opensearchDashboards.version}-x64.rpm',
      ],
      textPost: i18n.translate('home.tutorials.common.auditbeatInstructions.install.rpmTextPost', {
        defaultMessage: 'Looking for the 32-bit packages? See the [Download page]({linkUrl}).',
        values: {
          linkUrl: 'https://opensearch.org/docs/latest/downloads/beats/auditbeat',
        },
      }),
    },
    WINDOWS: {
      title: i18n.translate('home.tutorials.common.auditbeatInstructions.install.windowsTitle', {
        defaultMessage: 'Download and install Auditbeat',
      }),
      textPre: i18n.translate(
        'home.tutorials.common.auditbeatInstructions.install.windowsTextPre',
        {
          defaultMessage:
            'First time using Auditbeat? See the [Quick Start]({guideLinkUrl}).\n\
 1. Download the Auditbeat Windows zip file from the [Download]({auditbeatLinkUrl}) page.\n\
 2. Extract the contents of the zip file into {folderPath}.\n\
 3. Rename the `{directoryName}` directory to `Auditbeat`.\n\
 4. Open a PowerShell prompt as an Administrator (right-click the PowerShell icon and select \
**Run As Administrator**). If you are running Windows XP, you might need to download and install PowerShell.\n\
 5. From the PowerShell prompt, run the following commands to install Auditbeat as a Windows service.',
          values: {
            folderPath: '`C:\\Program Files`',
            guideLinkUrl: '{config.docs.beats.auditbeat}/auditbeat-installation-configuration.html',
            auditbeatLinkUrl: 'https://opensearch.org/docs/latest/downloads/beats/auditbeat',
            directoryName: 'auditbeat-{config.opensearchDashboards.version}-windows',
          },
        }
      ),
      commands: ['cd "C:\\Program Files\\Auditbeat"', '.\\install-service-auditbeat.ps1'],
      textPost: i18n.translate(
        'home.tutorials.common.auditbeatInstructions.install.windowsTextPost',
        {
          defaultMessage:
            'Modify the settings under {propertyName} in the {auditbeatPath} file to point to your OpenSearch installation.',
          values: {
            propertyName: '`output.opensearch`',
            auditbeatPath: '`C:\\Program Files\\Auditbeat\\auditbeat.yml`',
          },
        }
      ),
    },
  },
  START: {
    OSX: {
      title: i18n.translate('home.tutorials.common.auditbeatInstructions.start.osxTitle', {
        defaultMessage: 'Start Auditbeat',
      }),
      textPre: i18n.translate('home.tutorials.common.auditbeatInstructions.start.osxTextPre', {
        defaultMessage:
          'The `setup` command loads the OpenSearch Dashboards dashboards. If the dashboards are already set up, omit this command.',
      }),
      commands: ['./auditbeat setup', './auditbeat -e'],
    },
    DEB: {
      title: i18n.translate('home.tutorials.common.auditbeatInstructions.start.debTitle', {
        defaultMessage: 'Start Auditbeat',
      }),
      textPre: i18n.translate('home.tutorials.common.auditbeatInstructions.start.debTextPre', {
        defaultMessage:
          'The `setup` command loads the OpenSearch Dashboards dashboards. If the dashboards are already set up, omit this command.',
      }),
      commands: ['sudo auditbeat setup', 'sudo service auditbeat start'],
    },
    RPM: {
      title: i18n.translate('home.tutorials.common.auditbeatInstructions.start.rpmTitle', {
        defaultMessage: 'Start Auditbeat',
      }),
      textPre: i18n.translate('home.tutorials.common.auditbeatInstructions.start.rpmTextPre', {
        defaultMessage:
          'The `setup` command loads the OpenSearch Dashboards dashboards. If the dashboards are already set up, omit this command.',
      }),
      commands: ['sudo auditbeat setup', 'sudo service auditbeat start'],
    },
    WINDOWS: {
      title: i18n.translate('home.tutorials.common.auditbeatInstructions.start.windowsTitle', {
        defaultMessage: 'Start Auditbeat',
      }),
      textPre: i18n.translate('home.tutorials.common.auditbeatInstructions.start.windowsTextPre', {
        defaultMessage:
          'The `setup` command loads the OpenSearch Dashboards dashboards. If the dashboards are already set up, omit this command.',
      }),
      commands: ['.\\auditbeat.exe setup', 'Start-Service auditbeat'],
    },
  },
  CONFIG: {
    OSX: {
      title: i18n.translate('home.tutorials.common.auditbeatInstructions.config.osxTitle', {
        defaultMessage: 'Edit the configuration',
      }),
      textPre: i18n.translate('home.tutorials.common.auditbeatInstructions.config.osxTextPre', {
        defaultMessage: 'Modify {path} to set the connection information:',
        values: {
          path: '`auditbeat.yml`',
        },
      }),
      commands: [
        'output.opensearch:',
        '  hosts: ["<opensearch_url>"]',
        '  username: "opensearch"',
        '  password: "<password>"',
        'setup.opensearchDashboards:',
        '  host: "<opensearch_dashboards_url>"',
        getSpaceIdForBeatsTutorial(context),
      ],
      textPost: i18n.translate('home.tutorials.common.auditbeatInstructions.config.osxTextPost', {
        defaultMessage:
          'Where {passwordTemplate} is the password of the `opensearch` user, {opensearchUrlTemplate} is the URL of OpenSearch, \
and {opensearchDashboardsUrlTemplate} is the URL of OpenSearch Dashboards.',
        values: {
          passwordTemplate: '`<password>`',
          opensearchUrlTemplate: '`<opensearch_url>`',
          opensearchDashboardsUrlTemplate: '`<opensearch_dashboards_url>`',
        },
      }),
    },
    DEB: {
      title: i18n.translate('home.tutorials.common.auditbeatInstructions.config.debTitle', {
        defaultMessage: 'Edit the configuration',
      }),
      textPre: i18n.translate('home.tutorials.common.auditbeatInstructions.config.debTextPre', {
        defaultMessage: 'Modify {path} to set the connection information:',
        values: {
          path: '`/etc/auditbeat/auditbeat.yml`',
        },
      }),
      commands: [
        'output.opensearch:',
        '  hosts: ["<opensearch_url>"]',
        '  username: "opensearch"',
        '  password: "<password>"',
        'setup.opensearchDashboards:',
        '  host: "<opensearch_dashboards_url>"',
        getSpaceIdForBeatsTutorial(context),
      ],
      textPost: i18n.translate('home.tutorials.common.auditbeatInstructions.config.debTextPost', {
        defaultMessage:
          'Where {passwordTemplate} is the password of the `opensearch` user, {opensearchUrlTemplate} is the URL of OpenSearch, \
and {opensearchDashboardsUrlTemplate} is the URL of OpenSearch Dashboards.',
        values: {
          passwordTemplate: '`<password>`',
          opensearchUrlTemplate: '`<opensearch_url>`',
          opensearchDashboardsUrlTemplate: '`<opensearch_dashboards_url>`',
        },
      }),
    },
    RPM: {
      title: i18n.translate('home.tutorials.common.auditbeatInstructions.config.rpmTitle', {
        defaultMessage: 'Edit the configuration',
      }),
      textPre: i18n.translate('home.tutorials.common.auditbeatInstructions.config.rpmTextPre', {
        defaultMessage: 'Modify {path} to set the connection information:',
        values: {
          path: '`/etc/auditbeat/auditbeat.yml`',
        },
      }),
      commands: [
        'output.opensearch:',
        '  hosts: ["<opensearch_url>"]',
        '  username: "opensearch"',
        '  password: "<password>"',
        'setup.opensearchDashboards:',
        '  host: "<opensearch_dashboards_url>"',
        getSpaceIdForBeatsTutorial(context),
      ],
      textPost: i18n.translate('home.tutorials.common.auditbeatInstructions.config.rpmTextPost', {
        defaultMessage:
          'Where {passwordTemplate} is the password of the `opensearch` user, {opensearchUrlTemplate} is the URL of OpenSearch, \
and {opensearchDashboardsUrlTemplate} is the URL of OpenSearch Dashboards.',
        values: {
          passwordTemplate: '`<password>`',
          opensearchUrlTemplate: '`<opensearch_url>`',
          opensearchDashboardsUrlTemplate: '`<opensearch_dashboards_url>`',
        },
      }),
    },
    WINDOWS: {
      title: i18n.translate('home.tutorials.common.auditbeatInstructions.config.windowsTitle', {
        defaultMessage: 'Edit the configuration',
      }),
      textPre: i18n.translate('home.tutorials.common.auditbeatInstructions.config.windowsTextPre', {
        defaultMessage: 'Modify {path} to set the connection information:',
        values: {
          path: '`C:\\Program Files\\Auditbeat\\auditbeat.yml`',
        },
      }),
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
        'home.tutorials.common.auditbeatInstructions.config.windowsTextPost',
        {
          defaultMessage:
            'Where {passwordTemplate} is the password of the `opensearch` user, {opensearchUrlTemplate} is the URL of OpenSearch, \
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

export function auditbeatStatusCheck() {
  return {
    title: i18n.translate('home.tutorials.common.auditbeatStatusCheck.title', {
      defaultMessage: 'Status',
    }),
    text: i18n.translate('home.tutorials.common.auditbeatStatusCheck.text', {
      defaultMessage: 'Check that data is received from Auditbeat',
    }),
    btnLabel: i18n.translate('home.tutorials.common.auditbeatStatusCheck.buttonLabel', {
      defaultMessage: 'Check data',
    }),
    success: i18n.translate('home.tutorials.common.auditbeatStatusCheck.successText', {
      defaultMessage: 'Data successfully received',
    }),
    error: i18n.translate('home.tutorials.common.auditbeatStatusCheck.errorText', {
      defaultMessage: 'No data has been received yet',
    }),
    opensearchHitsCheck: {
      index: 'auditbeat-*',
      query: {
        bool: {
          filter: {
            term: {
              'agent.type': 'auditbeat',
            },
          },
        },
      },
    },
  };
}

export function onPremInstructions(platforms: readonly Platform[], context?: TutorialContext) {
  const AUDITBEAT_INSTRUCTIONS = createAuditbeatInstructions(context);

  const variants = [];
  for (let i = 0; i < platforms.length; i++) {
    const platform = platforms[i];
    const instructions = [];
    instructions.push(AUDITBEAT_INSTRUCTIONS.INSTALL[platform]);
    instructions.push(AUDITBEAT_INSTRUCTIONS.CONFIG[platform]);
    instructions.push(AUDITBEAT_INSTRUCTIONS.START[platform]);
    variants.push({
      id: INSTRUCTION_VARIANT[platform],
      instructions,
    });
  }
  return {
    instructionSets: [
      {
        title: i18n.translate(
          'home.tutorials.common.auditbeat.premInstructions.gettingStarted.title',
          {
            defaultMessage: 'Getting Started',
          }
        ),
        instructionVariants: variants,
        statusCheck: auditbeatStatusCheck(),
      },
    ],
  };
}
