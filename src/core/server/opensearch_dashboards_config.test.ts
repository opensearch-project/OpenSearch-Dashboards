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

import { applyDeprecations, configDeprecationFactory } from '@osd/config';
import { config } from './opensearch_dashboards_config';

const DEFAULT_CONFIG_PATH = 'opensearchDashboards';
const LEGACY_CONFIG_PATH = 'kibana';

const applyOpenSearchDashboardsDeprecations = (
  settings: Record<string, any> = {},
  path = DEFAULT_CONFIG_PATH
) => {
  const deprecations = config.deprecations!(configDeprecationFactory);
  const deprecationMessages: string[] = [];
  const _config: any = {};
  _config[path] = settings;
  const migrated = applyDeprecations(
    _config,
    deprecations.map((deprecation) => ({
      deprecation,
      path,
    })),
    (msg) => deprecationMessages.push(msg)
  );
  return {
    messages: deprecationMessages,
    migrated,
  };
};

const applyLegacyDeprecations = (settings: Record<string, any> = {}) => {
  return applyOpenSearchDashboardsDeprecations(settings, LEGACY_CONFIG_PATH);
};

describe('deprecations', () => {
  it('logs a warning if kibana.enabled is set and opensearchDashboards.enabled is not', () => {
    const { messages } = applyLegacyDeprecations({ enabled: true });
    expect(messages).toMatchInlineSnapshot(`
        Array [
          "\\"kibana.enabled\\" is deprecated and has been replaced by \\"opensearchDashboards.enabled\\"",
        ]
      `);
  });

  it('logs a warning if kibana.index is set and opensearchDashboards.index is not', () => {
    const { messages } = applyLegacyDeprecations({ index: '' });
    expect(messages).toMatchInlineSnapshot(`
        Array [
          "\\"kibana.index\\" is deprecated and has been replaced by \\"opensearchDashboards.index\\"",
        ]
      `);
  });

  it('logs a warning if kibana.autocompleteTerminateAfter is set and opensearchDashboards.autocompleteTerminateAfter is not', () => {
    const { messages } = applyLegacyDeprecations({ autocompleteTerminateAfter: 100 });
    expect(messages).toMatchInlineSnapshot(`
        Array [
          "\\"kibana.autocompleteTerminateAfter\\" is deprecated and has been replaced by \\"opensearchDashboards.autocompleteTerminateAfter\\"",
        ]
      `);
  });

  it('logs a warning if kibana.autocompleteTimeout is set and opensearchDashboards.autocompleteTimeout is not', () => {
    const { messages } = applyLegacyDeprecations({ autocompleteTimeout: 100 });
    expect(messages).toMatchInlineSnapshot(`
        Array [
          "\\"kibana.autocompleteTimeout\\" is deprecated and has been replaced by \\"opensearchDashboards.autocompleteTimeout\\"",
        ]
      `);
  });
});
