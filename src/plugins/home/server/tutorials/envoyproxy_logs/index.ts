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

export function envoyproxyLogsSpecProvider(context: TutorialContext): TutorialSchema {
  const moduleName = 'envoyproxy';
  const platforms = ['OSX', 'DEB', 'RPM', 'WINDOWS'] as const;
  return {
    id: 'envoyproxyLogs',
    name: i18n.translate('home.tutorials.envoyproxyLogs.nameTitle', {
      defaultMessage: 'Envoy Proxy logs',
    }),
    moduleName,
    category: TutorialsCategory.SECURITY_SOLUTION,
    shortDescription: i18n.translate('home.tutorials.envoyproxyLogs.shortDescription', {
      defaultMessage: 'Collect Envoy Proxy logs.',
    }),
    longDescription: i18n.translate('home.tutorials.envoyproxyLogs.longDescription', {
      defaultMessage:
        'This is a Filebeat module for Envoy proxy access log ( https://www.envoyproxy.io/docs/envoy/v1.10.0/configuration/access_log). It supports both standalone deployment and Envoy proxy deployment in Kubernetes. \
[Learn more]({learnMoreLink}).',
      values: {
        learnMoreLink: '{config.docs.beats.filebeat}/filebeat-module-envoyproxy.html',
      },
    }),
    euiIconType: '/plugins/home/assets/tutorials/logos/envoyproxy.svg',
    artifacts: {
      dashboards: [
        {
          id: '0c610510-5cbd-11e9-8477-077ec9664dbd',
          linkLabel: i18n.translate(
            'home.tutorials.envoyproxyLogs.artifacts.dashboards.linkLabel',
            {
              defaultMessage: 'Envoy Proxy Overview',
            }
          ),
          isOverview: true,
        },
      ],
      exportedFields: {
        documentationUrl: '{config.docs.beats.filebeat}/exported-fields-envoyproxy.html',
      },
    },
    completionTimeMinutes: 10,
    onPrem: onPremInstructions(moduleName, platforms, context),
  };
}
