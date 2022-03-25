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
import { TutorialsCategory } from '../../services/tutorials';
import { onPremInstructions } from '../instructions/filebeat_instructions';
import {
  TutorialContext,
  TutorialSchema,
} from '../../services/tutorials/lib/tutorials_registry_types';

export function azureLogsSpecProvider(context: TutorialContext): TutorialSchema {
  const moduleName = 'azure';
  const platforms = ['OSX', 'DEB', 'RPM', 'WINDOWS'] as const;
  return {
    id: 'azureLogs',
    name: i18n.translate('home.tutorials.azureLogs.nameTitle', {
      defaultMessage: 'Azure logs',
    }),
    moduleName,
    isBeta: true,
    category: TutorialsCategory.LOGGING,
    shortDescription: i18n.translate('home.tutorials.azureLogs.shortDescription', {
      defaultMessage: 'Collects Azure activity and audit related logs.',
    }),
    longDescription: i18n.translate('home.tutorials.azureLogs.longDescription', {
      defaultMessage:
        'The `azure` Filebeat module collects Azure activity and audit related logs. \
[Learn more]({learnMoreLink}).',
      values: {
        learnMoreLink: '{config.docs.beats.filebeat}/filebeat-module-azure.html',
      },
    }),
    euiIconType: 'logoAzure',
    artifacts: {
      dashboards: [
        {
          id: '41e84340-ec20-11e9-90ec-112a988266d5',
          linkLabel: i18n.translate('home.tutorials.azureLogs.artifacts.dashboards.linkLabel', {
            defaultMessage: 'Azure logs dashboard',
          }),
          isOverview: true,
        },
      ],
      exportedFields: {
        documentationUrl: '{config.docs.beats.filebeat}/exported-fields-azure.html',
      },
    },
    completionTimeMinutes: 10,
    onPrem: onPremInstructions(moduleName, platforms, context),
  };
}
