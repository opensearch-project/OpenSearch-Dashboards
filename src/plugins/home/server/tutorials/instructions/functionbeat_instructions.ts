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

export const createFunctionbeatInstructions = (context?: TutorialContext) => ({
  INSTALL: {
    OSX: {
      title: i18n.translate('home.tutorials.common.functionbeatInstructions.install.osxTitle', {
        defaultMessage: 'Download and install Functionbeat',
      }),
      textPre: i18n.translate('home.tutorials.common.functionbeatInstructions.install.osxTextPre', {
        defaultMessage: 'First time using Functionbeat? See the [Quick Start]({link}).',
        values: {
          link: '{config.docs.beats.functionbeat}/functionbeat-installation-configuration.html',
        },
      }),
      commands: [
        'curl -L -O https://artifacts.opensearch.org/downloads/beats/functionbeat/functionbeat-{config.opensearchDashboards.version}-darwin-x64.tar.gz',
        'tar xzvf functionbeat-{config.opensearchDashboards.version}-darwin-x64.tar.gz',
        'cd functionbeat-{config.opensearchDashboards.version}-darwin-x64/',
      ],
    },
    LINUX: {
      title: i18n.translate('home.tutorials.common.functionbeatInstructions.install.linuxTitle', {
        defaultMessage: 'Download and install Functionbeat',
      }),
      textPre: i18n.translate(
        'home.tutorials.common.functionbeatInstructions.install.linuxTextPre',
        {
          defaultMessage: 'First time using Functionbeat? See the [Quick Start]({link}).',
          values: {
            link: '{config.docs.beats.functionbeat}/functionbeat-installation-configuration.html',
          },
        }
      ),
      commands: [
        'curl -L -O https://artifacts.opensearch.org/downloads/beats/functionbeat/functionbeat-{config.opensearchDashboards.version}-linux-x64.tar.gz',
        'tar xzvf functionbeat-{config.opensearchDashboards.version}-linux-x64.tar.gz',
        'cd functionbeat-{config.opensearchDashboards.version}-linux-x64/',
      ],
    },
    WINDOWS: {
      title: i18n.translate('home.tutorials.common.functionbeatInstructions.install.windowsTitle', {
        defaultMessage: 'Download and install Functionbeat',
      }),
      textPre: i18n.translate(
        'home.tutorials.common.functionbeatInstructions.install.windowsTextPre',
        {
          defaultMessage:
            'First time using Functionbeat? See the [Quick Start]({functionbeatLink}).\n\
 1. Download the Functionbeat Windows zip file from the [Download]({opensearchLink}) page.\n\
 2. Extract the contents of the zip file into {folderPath}.\n\
 3. Rename the {directoryName} directory to `Functionbeat`.\n\
 4. Open a PowerShell prompt as an Administrator (right-click the PowerShell icon and select \
**Run As Administrator**). If you are running Windows XP, you might need to download and install PowerShell.\n\
 5. From the PowerShell prompt, go to the Functionbeat directory:',
          values: {
            directoryName: '`functionbeat-{config.opensearchDashboards.version}-windows`',
            folderPath: '`C:\\Program Files`',
            functionbeatLink:
              '{config.docs.beats.functionbeat}/functionbeat-installation-configuration.html',
            opensearchLink: 'https://opensearch.org/docs/latest/downloads/beats/functionbeat',
          },
        }
      ),
      commands: ['cd "C:\\Program Files\\Functionbeat"'],
    },
  },
  DEPLOY: {
    OSX_LINUX: {
      title: i18n.translate('home.tutorials.common.functionbeatInstructions.deploy.osxTitle', {
        defaultMessage: 'Deploy Functionbeat to AWS Lambda',
      }),
      textPre: i18n.translate('home.tutorials.common.functionbeatInstructions.deploy.osxTextPre', {
        defaultMessage:
          'This installs Functionbeat as a Lambda function.\
The `setup` command checks the opensearch configuration and loads the \
OpenSearch Dashboards index pattern. It is normally safe to omit this command.',
      }),
      commands: ['./functionbeat setup', './functionbeat deploy fn-cloudwatch-logs'],
    },
    WINDOWS: {
      title: i18n.translate('home.tutorials.common.functionbeatInstructions.deploy.windowsTitle', {
        defaultMessage: 'Deploy Functionbeat to AWS Lambda',
      }),
      textPre: i18n.translate(
        'home.tutorials.common.functionbeatInstructions.deploy.windowsTextPre',
        {
          defaultMessage:
            'This installs Functionbeat as a Lambda function.\
The `setup` command checks the opensearch configuration and loads the \
OpenSearch Dashboards index pattern. It is normally safe to omit this command.',
        }
      ),
      commands: ['.\\functionbeat.exe setup', '.\\functionbeat.exe deploy fn-cloudwatch-logs'],
    },
  },
  CONFIG: {
    OSX_LINUX: {
      title: i18n.translate('home.tutorials.common.functionbeatInstructions.config.osxTitle', {
        defaultMessage: 'Configure the OpenSearch cluster',
      }),
      textPre: i18n.translate('home.tutorials.common.functionbeatInstructions.config.osxTextPre', {
        defaultMessage: 'Modify {path} to set the connection information:',
        values: {
          path: '`functionbeat.yml`',
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
        'home.tutorials.common.functionbeatInstructions.config.osxTextPost',
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
    WINDOWS: {
      title: i18n.translate('home.tutorials.common.functionbeatInstructions.config.windowsTitle', {
        defaultMessage: 'Edit the configuration',
      }),
      textPre: i18n.translate(
        'home.tutorials.common.functionbeatInstructions.config.windowsTextPre',
        {
          defaultMessage: 'Modify {path} to set the connection information:',
          values: {
            path: '`C:\\Program Files\\Functionbeat\\functionbeat.yml`',
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
        'home.tutorials.common.functionbeatInstructions.config.windowsTextPost',
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

export function functionbeatEnableInstructions() {
  const defaultTitle = i18n.translate(
    'home.tutorials.common.functionbeatEnableOnPremInstructions.defaultTitle',
    {
      defaultMessage: 'Configure the Cloudwatch log group',
    }
  );
  const defaultCommands = [
    'functionbeat.provider.aws.functions:',
    '  - name: fn-cloudwatch-logs',
    '    enabled: true',
    '    type: cloudwatch_logs',
    '    triggers:',
    '      - log_group_name: <cloudwatch-log-group>',
    'functionbeat.provider.aws.deploy_bucket: <unique-bucket-name>',
  ];
  const defaultTextPost = i18n.translate(
    'home.tutorials.common.functionbeatEnableOnPremInstructions.defaultTextPost',
    {
      defaultMessage:
        'Where `<cloudwatch-log-group>` is the name of the log group you want to ingest, \
and `<unique-bucket-name>` is a valid S3 bucket name which will be used for staging the \
Functionbeat deploy.',
    }
  );
  return {
    OSX_LINUX: {
      title: defaultTitle,
      textPre: i18n.translate(
        'home.tutorials.common.functionbeatEnableOnPremInstructionsOSXLinux.textPre',
        {
          defaultMessage: 'Modify the settings in the `functionbeat.yml` file.',
        }
      ),
      commands: defaultCommands,
      textPost: defaultTextPost,
    },
    WINDOWS: {
      title: defaultTitle,
      textPre: i18n.translate(
        'home.tutorials.common.functionbeatEnableOnPremInstructionsWindows.textPre',
        {
          defaultMessage: 'Modify the settings in the {path} file.',
          values: {
            path: '`C:\\Program Files\\Functionbeat\\functionbeat.yml`',
          },
        }
      ),
      commands: defaultCommands,
      textPost: defaultTextPost,
    },
  };
}

export function functionbeatAWSInstructions() {
  const defaultTitle = i18n.translate('home.tutorials.common.functionbeatAWSInstructions.title', {
    defaultMessage: 'Set AWS credentials',
  });
  const defaultPre = i18n.translate('home.tutorials.common.functionbeatAWSInstructions.textPre', {
    defaultMessage: 'Set your AWS account credentials in the environment:',
  });
  const defaultPost = i18n.translate('home.tutorials.common.functionbeatAWSInstructions.textPost', {
    defaultMessage:
      'Where `<your-access-key>` and `<your-secret-access-key>` are your account credentials and \
`us-east-1` is the desired region.',
  });

  return {
    OSX_LINUX: {
      title: defaultTitle,
      textPre: defaultPre,
      commands: [
        'export AWS_ACCESS_KEY_ID=<your-access-key>',
        'export AWS_SECRET_ACCESS_KEY=<your-secret-access-key>',
        'export AWS_DEFAULT_REGION=us-east-1',
      ],
      textPost: defaultPost,
    },
    WINDOWS: {
      title: defaultTitle,
      textPre: defaultPre,
      commands: [
        'set AWS_ACCESS_KEY_ID=<your-access-key>',
        'set AWS_SECRET_ACCESS_KEY=<your-secret-access-key>',
        'set AWS_DEFAULT_REGION=us-east-1',
      ],
      textPost: defaultPost,
    },
  };
}

export function functionbeatStatusCheck() {
  return {
    title: i18n.translate('home.tutorials.common.functionbeatStatusCheck.title', {
      defaultMessage: 'Functionbeat status',
    }),
    text: i18n.translate('home.tutorials.common.functionbeatStatusCheck.text', {
      defaultMessage: 'Check that data is received from Functionbeat',
    }),
    btnLabel: i18n.translate('home.tutorials.common.functionbeatStatusCheck.buttonLabel', {
      defaultMessage: 'Check data',
    }),
    success: i18n.translate('home.tutorials.common.functionbeatStatusCheck.successText', {
      defaultMessage: 'Data successfully received from Functionbeat',
    }),
    error: i18n.translate('home.tutorials.common.functionbeatStatusCheck.errorText', {
      defaultMessage: 'No data has been received from Functionbeat yet',
    }),
    opensearchHitsCheck: {
      index: 'functionbeat-*',
      query: {
        match_all: {},
      },
    },
  };
}

export function onPremInstructions(platforms: Platform[], context?: TutorialContext) {
  const FUNCTIONBEAT_INSTRUCTIONS = createFunctionbeatInstructions(context);

  return {
    instructionSets: [
      {
        title: i18n.translate(
          'home.tutorials.common.functionbeat.premInstructions.gettingStarted.title',
          {
            defaultMessage: 'Getting Started',
          }
        ),
        instructionVariants: [
          {
            id: INSTRUCTION_VARIANT.OSX,
            instructions: [
              FUNCTIONBEAT_INSTRUCTIONS.INSTALL.OSX,
              functionbeatAWSInstructions().OSX_LINUX,
              functionbeatEnableInstructions().OSX_LINUX,
              FUNCTIONBEAT_INSTRUCTIONS.CONFIG.OSX_LINUX,
              FUNCTIONBEAT_INSTRUCTIONS.DEPLOY.OSX_LINUX,
            ],
          },
          {
            id: INSTRUCTION_VARIANT.LINUX,
            instructions: [
              FUNCTIONBEAT_INSTRUCTIONS.INSTALL.LINUX,
              functionbeatAWSInstructions().OSX_LINUX,
              functionbeatEnableInstructions().OSX_LINUX,
              FUNCTIONBEAT_INSTRUCTIONS.CONFIG.OSX_LINUX,
              FUNCTIONBEAT_INSTRUCTIONS.DEPLOY.OSX_LINUX,
            ],
          },
          {
            id: INSTRUCTION_VARIANT.WINDOWS,
            instructions: [
              FUNCTIONBEAT_INSTRUCTIONS.INSTALL.WINDOWS,
              functionbeatAWSInstructions().WINDOWS,
              functionbeatEnableInstructions().WINDOWS,
              FUNCTIONBEAT_INSTRUCTIONS.CONFIG.WINDOWS,
              FUNCTIONBEAT_INSTRUCTIONS.DEPLOY.WINDOWS,
            ],
          },
        ],
        statusCheck: functionbeatStatusCheck(),
      },
    ],
  };
}
