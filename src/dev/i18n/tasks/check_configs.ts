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
import { resolve, join } from 'path';
import { ListrContext } from '.';
import { I18N_RC } from '../constants';
import { checkConfigNamespacePrefix, arrayify } from '..';

export function checkConfigs(additionalConfigPaths: string | string[] = []) {
  const root = join(__dirname, '../../../../');
  const opensearchDashboardsRC = resolve(root, I18N_RC);

  const configPaths = [opensearchDashboardsRC, ...arrayify(additionalConfigPaths)];

  return configPaths.map((configPath) => ({
    task: async (context: ListrContext) => {
      try {
        await checkConfigNamespacePrefix(configPath);
      } catch (err) {
        const { reporter } = context;
        const reporterWithContext = reporter.withContext({ name: configPath });
        reporterWithContext.report(err);
        throw reporter;
      }
    },
    title: `Checking configs in ${configPath}`,
  }));
}
