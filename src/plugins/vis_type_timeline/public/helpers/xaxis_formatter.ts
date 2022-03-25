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

import moment from 'moment';

import { i18n } from '@osd/i18n';
import { IUiSettingsClient } from 'opensearch-dashboards/public';

export function xaxisFormatterProvider(config: IUiSettingsClient) {
  function getFormat(opensearchInterval: any) {
    const parts = opensearchInterval.match(/(\d+)(ms|s|m|h|d|w|M|y|)/);

    if (parts === null || parts[1] === null || parts[2] === null) {
      throw new Error(
        i18n.translate('timeline.panels.timechart.unknownIntervalErrorMessage', {
          defaultMessage: 'Unknown interval',
        })
      );
    }

    const interval = moment.duration(Number(parts[1]), parts[2]);

    // Cribbed from OpenSearch Dashboards's TimeBuckets class
    const rules = config.get('dateFormat:scaled');

    for (let i = rules.length - 1; i >= 0; i--) {
      const rule = rules[i];
      if (!rule[0] || interval >= moment.duration(rule[0])) {
        return rule[1];
      }
    }

    return config.get('dateFormat');
  }

  return (opensearchInterval: any) => getFormat(opensearchInterval);
}
