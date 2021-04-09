/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
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

/*
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { addons } from '@storybook/addons';
import { create } from '@storybook/theming';

// This configures the "Manager", or main outer view of Storybook. It is an
// addon that's loaded by the `managerEntries` part of the preset in ../preset.js.
addons.setConfig({
  theme: create({
    base: 'light',
    brandTitle: 'OpenSearch Dashboards Storybook',
    brandUrl:
      'https://github.com/opensearch-project/OpenSearch-Dashboards/tree/master/packages/osd-storybook',
  }),
  showPanel: false,
  isFullscreen: false,
  panelPosition: 'bottom',
  isToolshown: true,
});
