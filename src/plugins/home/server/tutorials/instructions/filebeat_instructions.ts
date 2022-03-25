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

export const createFilebeatInstructions = (context?: TutorialContext) => ({
  INSTALL: {
    OSX: {
      title: i18n.translate('home.tutorials.common.filebeatInstructions.install.osxTitle', {
        defaultMessage: 'Download and install Filebeat',
      }),
      textPre: i18n.translate('home.tutorials.common.filebeatInstructions.install.osxTextPre', {
        defaultMessage: 'First time using Filebeat? See the [Quick Start]({linkUrl}).',
        values: {
          linkUrl: '{config.docs.beats.filebeat}/filebeat-installation-configuration.html',
        },
      }),
      commands: [
        'curl -L -O https://artifacts.opensearch.org/downloads/beats/filebeat/filebeat-{config.opensearchDashboards.version}-darwin-x64.tar.gz',
        'tar xzvf filebeat-{config.opensearchDashboards.version}-darwin-x64.tar.gz',
        'cd filebeat-{config.opensearchDashboards.version}-darwin-x64/',
      ],
    },
    DEB: {
      title: i18n.translate('home.tutorials.common.filebeatInstructions.install.debTitle', {
        defaultMessage: 'Download and install Filebeat',
      }),
      textPre: i18n.translate('home.tutorials.common.filebeatInstructions.install.debTextPre', {
        defaultMessage: 'First time using Filebeat? See the [Quick Start]({linkUrl}).',
        values: {
          linkUrl: '{config.docs.beats.filebeat}/filebeat-installation-configuration.html',
        },
      }),
      commands: [
        'curl -L -O https://artifacts.opensearch.org/downloads/beats/filebeat/filebeat-{config.opensearchDashboards.version}-amd64.deb',
        'sudo dpkg -i filebeat-{config.opensearchDashboards.version}-amd64.deb',
      ],
      textPost: i18n.translate('home.tutorials.common.filebeatInstructions.install.debTextPost', {
        defaultMessage: 'Looking for the 32-bit packages? See the [Download page]({linkUrl}).',
        values: {
          linkUrl: 'https://opensearch.org/docs/latest/downloads/beats/filebeat',
        },
      }),
    },
    RPM: {
      title: i18n.translate('home.tutorials.common.filebeatInstructions.install.rpmTitle', {
        defaultMessage: 'Download and install Filebeat',
      }),
      textPre: i18n.translate('home.tutorials.common.filebeatInstructions.install.rpmTextPre', {
        defaultMessage: 'First time using Filebeat? See the [Quick Start]({linkUrl}).',
        values: {
          linkUrl: '{config.docs.beats.filebeat}/filebeat-installation-configuration.html',
        },
      }),
      commands: [
        'curl -L -O https://artifacts.opensearch.org/downloads/beats/filebeat/filebeat-{config.opensearchDashboards.version}-x64.rpm',
        'sudo rpm -vi filebeat-{config.opensearchDashboards.version}-x64.rpm',
      ],
      textPost: i18n.translate('home.tutorials.common.filebeatInstructions.install.rpmTextPost', {
        defaultMessage: 'Looking for the 32-bit packages? See the [Download page]({linkUrl}).',
        values: {
          linkUrl: 'https://opensearch.org/docs/latest/downloads/beats/filebeat',
        },
      }),
    },
    WINDOWS: {
      title: i18n.translate('home.tutorials.common.filebeatInstructions.install.windowsTitle', {
        defaultMessage: 'Download and install Filebeat',
      }),
      textPre: i18n.translate('home.tutorials.common.filebeatInstructions.install.windowsTextPre', {
        defaultMessage:
          'First time using Filebeat? See the [Quick Start]({guideLinkUrl}).\n\
 1. Download the Filebeat Windows zip file from the [Download]({filebeatLinkUrl}) page.\n\
 2. Extract the contents of the zip file into {folderPath}.\n\
 3. Rename the `{directoryName}` directory to `Filebeat`.\n\
 4. Open a PowerShell prompt as an Administrator (right-click the PowerShell icon and select \
**Run As Administrator**). If you are running Windows XP, you might need to download and install PowerShell.\n\
 5. From the PowerShell prompt, run the following commands to install Filebeat as a Windows service.',
        values: {
          folderPath: '`C:\\Program Files`',
          guideLinkUrl: '{config.docs.beats.filebeat}/filebeat-installation-configuration.html',
          filebeatLinkUrl: 'https://opensearch.org/docs/latest/downloads/beats/filebeat',
          directoryName: 'filebeat-{config.opensearchDashboards.version}-windows',
        },
      }),
      commands: ['cd "C:\\Program Files\\Filebeat"', '.\\install-service-filebeat.ps1'],
      textPost: i18n.translate(
        'home.tutorials.common.filebeatInstructions.install.windowsTextPost',
        {
          defaultMessage:
            'Modify the settings under {propertyName} in the {filebeatPath} file to point to your OpenSearch installation.',
          values: {
            propertyName: '`output.opensearch`',
            filebeatPath: '`C:\\Program Files\\Filebeat\\filebeat.yml`',
          },
        }
      ),
    },
  },
  START: {
    OSX: {
      title: i18n.translate('home.tutorials.common.filebeatInstructions.start.osxTitle', {
        defaultMessage: 'Start Filebeat',
      }),
      textPre: i18n.translate('home.tutorials.common.filebeatInstructions.start.osxTextPre', {
        defaultMessage:
          'The `setup` command loads the OpenSearch Dashboards dashboards. If the dashboards are already set up, omit this command.',
      }),
      commands: ['./filebeat setup', './filebeat -e'],
    },
    DEB: {
      title: i18n.translate('home.tutorials.common.filebeatInstructions.start.debTitle', {
        defaultMessage: 'Start Filebeat',
      }),
      textPre: i18n.translate('home.tutorials.common.filebeatInstructions.start.debTextPre', {
        defaultMessage:
          'The `setup` command loads the OpenSearch Dashboards dashboards. If the dashboards are already set up, omit this command.',
      }),
      commands: ['sudo filebeat setup', 'sudo service filebeat start'],
    },
    RPM: {
      title: i18n.translate('home.tutorials.common.filebeatInstructions.start.rpmTitle', {
        defaultMessage: 'Start Filebeat',
      }),
      textPre: i18n.translate('home.tutorials.common.filebeatInstructions.start.rpmTextPre', {
        defaultMessage:
          'The `setup` command loads the OpenSearch Dashboards dashboards. If the dashboards are already set up, omit this command.',
      }),
      commands: ['sudo filebeat setup', 'sudo service filebeat start'],
    },
    WINDOWS: {
      title: i18n.translate('home.tutorials.common.filebeatInstructions.start.windowsTitle', {
        defaultMessage: 'Start Filebeat',
      }),
      textPre: i18n.translate('home.tutorials.common.filebeatInstructions.start.windowsTextPre', {
        defaultMessage:
          'The `setup` command loads the OpenSearch Dashboards dashboards. If the dashboards are already set up, omit this command.',
      }),
      commands: ['.\\filebeat.exe setup', 'Start-Service filebeat'],
    },
  },
  CONFIG: {
    OSX: {
      title: i18n.translate('home.tutorials.common.filebeatInstructions.config.osxTitle', {
        defaultMessage: 'Edit the configuration',
      }),
      textPre: i18n.translate('home.tutorials.common.filebeatInstructions.config.osxTextPre', {
        defaultMessage: 'Modify {path} to set the connection information:',
        values: {
          path: '`filebeat.yml`',
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
      textPost: i18n.translate('home.tutorials.common.filebeatInstructions.config.osxTextPost', {
        defaultMessage:
          'Where {passwordTemplate} is the password of the `opensearch` user, {opensearchUrlTemplate} is the URL of opensearch, \
and {opensearchDashboardsUrlTemplate} is the URL of OpenSearch Dashboards.',
        values: {
          passwordTemplate: '`<password>`',
          opensearchUrlTemplate: '`<opensearch_url>`',
          opensearchDashboardsUrlTemplate: '`<opensearch_dashboards_url>`',
        },
      }),
    },
    DEB: {
      title: i18n.translate('home.tutorials.common.filebeatInstructions.config.debTitle', {
        defaultMessage: 'Edit the configuration',
      }),
      textPre: i18n.translate('home.tutorials.common.filebeatInstructions.config.debTextPre', {
        defaultMessage: 'Modify {path} to set the connection information:',
        values: {
          path: '`/etc/filebeat/filebeat.yml`',
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
      textPost: i18n.translate('home.tutorials.common.filebeatInstructions.config.debTextPost', {
        defaultMessage:
          'Where {passwordTemplate} is the password of the `opensearch` user, {opensearchUrlTemplate} is the URL of opensearch, \
and {opensearchDashboardsUrlTemplate} is the URL of OpenSearch Dashboards.',
        values: {
          passwordTemplate: '`<password>`',
          opensearchUrlTemplate: '`<opensearch_url>`',
          opensearchDashboardsUrlTemplate: '`<opensearch_dashboards_url>`',
        },
      }),
    },
    RPM: {
      title: i18n.translate('home.tutorials.common.filebeatInstructions.config.rpmTitle', {
        defaultMessage: 'Edit the configuration',
      }),
      textPre: i18n.translate('home.tutorials.common.filebeatInstructions.config.rpmTextPre', {
        defaultMessage: 'Modify {path} to set the connection information:',
        values: {
          path: '`/etc/filebeat/filebeat.yml`',
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
      textPost: i18n.translate('home.tutorials.common.filebeatInstructions.config.rpmTextPost', {
        defaultMessage:
          'Where {passwordTemplate} is the password of the `opensearch` user, {opensearchUrlTemplate} is the URL of opensearch, \
and {opensearchDashboardsUrlTemplate} is the URL of OpenSearch Dashboards.',
        values: {
          passwordTemplate: '`<password>`',
          opensearchUrlTemplate: '`<opensearch_url>`',
          opensearchDashboardsUrlTemplate: '`<opensearch_dashboards_url>`',
        },
      }),
    },
    WINDOWS: {
      title: i18n.translate('home.tutorials.common.filebeatInstructions.config.windowsTitle', {
        defaultMessage: 'Edit the configuration',
      }),
      textPre: i18n.translate('home.tutorials.common.filebeatInstructions.config.windowsTextPre', {
        defaultMessage: 'Modify {path} to set the connection information:',
        values: {
          path: '`C:\\Program Files\\Filebeat\\filebeat.yml`',
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
        'home.tutorials.common.filebeatInstructions.config.windowsTextPost',
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

export function filebeatEnableInstructions(moduleName: string) {
  return {
    OSX: {
      title: i18n.translate('home.tutorials.common.filebeatEnableInstructions.osxTitle', {
        defaultMessage: 'Enable and configure the {moduleName} module',
        values: { moduleName },
      }),
      textPre: i18n.translate('home.tutorials.common.filebeatEnableInstructions.osxTextPre', {
        defaultMessage: 'From the installation directory, run:',
      }),
      commands: ['./filebeat modules enable ' + moduleName],
      textPost: i18n.translate('home.tutorials.common.filebeatEnableInstructions.osxTextPost', {
        defaultMessage: 'Modify the settings in the `modules.d/{moduleName}.yml` file.',
        values: { moduleName },
      }),
    },
    DEB: {
      title: i18n.translate('home.tutorials.common.filebeatEnableInstructions.debTitle', {
        defaultMessage: 'Enable and configure the {moduleName} module',
        values: { moduleName },
      }),
      commands: ['sudo filebeat modules enable ' + moduleName],
      textPost: i18n.translate('home.tutorials.common.filebeatEnableInstructions.debTextPost', {
        defaultMessage:
          'Modify the settings in the `/etc/filebeat/modules.d/{moduleName}.yml` file.',
        values: { moduleName },
      }),
    },
    RPM: {
      title: i18n.translate('home.tutorials.common.filebeatEnableInstructions.rpmTitle', {
        defaultMessage: 'Enable and configure the {moduleName} module',
        values: { moduleName },
      }),
      commands: ['sudo filebeat modules enable ' + moduleName],
      textPost: i18n.translate('home.tutorials.common.filebeatEnableInstructions.rpmTextPost', {
        defaultMessage:
          'Modify the settings in the `/etc/filebeat/modules.d/{moduleName}.yml` file.',
        values: { moduleName },
      }),
    },
    WINDOWS: {
      title: i18n.translate('home.tutorials.common.filebeatEnableInstructions.windowsTitle', {
        defaultMessage: 'Enable and configure the {moduleName} module',
        values: { moduleName },
      }),
      textPre: i18n.translate('home.tutorials.common.filebeatEnableInstructions.windowsTextPre', {
        defaultMessage: 'From the {path} folder, run:',
        values: { path: `C:\\Program Files\\Filebeat` },
      }),
      commands: ['filebeat.exe modules enable ' + moduleName],
      textPost: i18n.translate('home.tutorials.common.filebeatEnableInstructions.windowsTextPost', {
        defaultMessage: 'Modify the settings in the `modules.d/{moduleName}.yml` file.',
        values: { moduleName },
      }),
    },
  };
}

export function filebeatStatusCheck(moduleName: string) {
  return {
    title: i18n.translate('home.tutorials.common.filebeatStatusCheck.title', {
      defaultMessage: 'Module status',
    }),
    text: i18n.translate('home.tutorials.common.filebeatStatusCheck.text', {
      defaultMessage: 'Check that data is received from the Filebeat `{moduleName}` module',
      values: { moduleName },
    }),
    btnLabel: i18n.translate('home.tutorials.common.filebeatStatusCheck.buttonLabel', {
      defaultMessage: 'Check data',
    }),
    success: i18n.translate('home.tutorials.common.filebeatStatusCheck.successText', {
      defaultMessage: 'Data successfully received from this module',
    }),
    error: i18n.translate('home.tutorials.common.filebeatStatusCheck.errorText', {
      defaultMessage: 'No data has been received from this module yet',
    }),
    opensearchHitsCheck: {
      index: 'filebeat-*',
      query: {
        bool: {
          filter: {
            term: {
              'event.module': moduleName,
            },
          },
        },
      },
    },
  };
}

export function onPremInstructions(
  moduleName: string,
  platforms: readonly Platform[] = [],
  context?: TutorialContext
) {
  const FILEBEAT_INSTRUCTIONS = createFilebeatInstructions(context);

  const variants = [];
  for (let i = 0; i < platforms.length; i++) {
    const platform = platforms[i];
    const instructions = [];
    instructions.push(FILEBEAT_INSTRUCTIONS.INSTALL[platform]);
    instructions.push(FILEBEAT_INSTRUCTIONS.CONFIG[platform]);
    instructions.push(filebeatEnableInstructions(moduleName)[platform]);
    instructions.push(FILEBEAT_INSTRUCTIONS.START[platform]);
    variants.push({
      id: INSTRUCTION_VARIANT[platform],
      instructions,
    });
  }
  return {
    instructionSets: [
      {
        title: i18n.translate(
          'home.tutorials.common.filebeat.premInstructions.gettingStarted.title',
          {
            defaultMessage: 'Getting Started',
          }
        ),
        instructionVariants: variants,
        statusCheck: filebeatStatusCheck(moduleName),
      },
    ],
  };
}
