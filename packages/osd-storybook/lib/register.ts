/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
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
