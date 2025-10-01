/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginConfigDescriptor, PluginInitializerContext } from '../../../core/server';
import { ConfigSchema, configSchema } from '../common/config';
import { ExplorePlugin } from './plugin';

export function plugin(initializerContext: PluginInitializerContext) {
  return new ExplorePlugin(initializerContext);
}

export { ExplorePluginSetup, ExplorePluginStart } from './types';

export const config: PluginConfigDescriptor<ConfigSchema> = {
  exposeToBrowser: {
    enabled: true,
  },
  schema: configSchema,
  deprecations: ({ rename, unused }) => [
    // This is to ensure that when explore is enabled, the necessary settings for the enhanced experience are also enabled;
    // this is a short-term solution that utilizes the deprecation framework to modify settings while typical deprecation functionality in OSD is not designed for this purpose.
    (settings, fromPath, addDeprecation) => {
      if (settings?.explore?.enabled === true) {
        settings.data = settings.data || {};
        settings.data.savedQueriesNewUI = settings.data.savedQueriesNewUI || {};
        settings.data.savedQueriesNewUI.enabled = true;

        settings.opensearchDashboards = settings.opensearchDashboards || {};
        settings.opensearchDashboards.branding = settings.opensearchDashboards.branding || {};
        settings.opensearchDashboards.branding.useExpandedHeader = false;

        settings.uiSettings = settings.uiSettings || {};
        settings.uiSettings.overrides = {
          ...(settings.uiSettings.overrides || {}),
          'theme:version': 'v9',
          'home:useNewHomePage': true,
          'query:enhancements:enabled': true,
        };
      }

      return settings;
    },
  ],
};
