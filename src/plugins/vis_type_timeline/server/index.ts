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

import { PluginConfigDescriptor, PluginInitializerContext } from '../../../core/server';
import { configSchema, ConfigSchema } from '../config';
import { Plugin } from './plugin';

export const config: PluginConfigDescriptor<ConfigSchema> = {
  schema: configSchema,
  deprecations: ({ renameFromRoot, renameFromRootWithoutMap }) => [
    // timelion.enabled and timelion_vis.enabled deprecation
    renameFromRoot('timelion.enabled', 'vis_type_timeline.enabled'),
    renameFromRoot('timelion_vis.enabled', 'vis_type_timeline.enabled'),
    renameFromRoot('vis_type_timelion.enabled', 'vis_type_timeline.enabled'),
    renameFromRoot('timeline.enabled', 'vis_type_timeline.enabled'),
    renameFromRoot('timeline_vis.enabled', 'vis_type_timeline.enabled'),

    // timelion.graphiteUrls deprecation
    renameFromRoot('timelion.graphiteUrls', 'vis_type_timeline.graphiteAllowedUrls'),
    renameFromRoot('vis_type_timelion.graphiteUrls', 'vis_type_timeline.graphiteAllowedUrls'),
    renameFromRoot(
      'vis_type_timelion.graphiteAllowedUrls',
      'vis_type_timeline.graphiteAllowedUrls'
    ),
    renameFromRoot('timeline.graphiteUrls', 'vis_type_timeline.graphiteAllowedUrls'),
    renameFromRoot('vis_type_timeline.graphiteUrls', 'vis_type_timeline.graphiteAllowedUrls'),

    // timelion.ui.enabled deprecation
    renameFromRoot('timelion.ui.enabled', 'vis_type_timeline.ui.enabled', true),
    renameFromRoot('vis_type_timelion.ui.enabled', 'vis_type_timeline.ui.enabled', true),
    renameFromRoot('timeline.ui.enabled', 'vis_type_timeline.ui.enabled', true),

    renameFromRootWithoutMap(
      'vis_type_timeline.graphiteBlockedIPs',
      'vis_type_timeline.graphiteDeniedIPs'
    ),
  ],
};
export const plugin = (initializerContext: PluginInitializerContext) =>
  new Plugin(initializerContext);
