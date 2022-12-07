/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { coreMock, savedObjectsServiceMock } from '../../../core/public/mocks';
import { dashboardPluginMock } from '../../dashboard/public/mocks';
import { dataPluginMock } from '../../data/public/mocks';
import { embeddablePluginMock } from '../../embeddable/public/mocks';
import { navigationPluginMock } from '../../navigation/public/mocks';
import { visualizationsPluginMock } from '../../visualizations/public/mocks';
import { PLUGIN_ID, PLUGIN_NAME } from '../common';
import { VisBuilderPlugin } from './plugin';

describe('VisBuilderPlugin', () => {
  describe('setup', () => {
    it('initializes the plugin correctly and registers it as an alias visualization', () => {
      const plugin = new VisBuilderPlugin(coreMock.createPluginInitializerContext());
      const pluginStartContract = {
        data: dataPluginMock.createStartContract(),
        savedObject: savedObjectsServiceMock.createStartContract(),
        navigation: navigationPluginMock.createStartContract(),
        dashboard: dashboardPluginMock.createStartContract(),
      };
      const coreSetup = coreMock.createSetup({
        pluginStartContract,
      }) as any;
      const setupDeps = {
        visualizations: visualizationsPluginMock.createSetupContract(),
        embeddable: embeddablePluginMock.createSetupContract(),
        data: dataPluginMock.createSetupContract(),
      };

      const setup = plugin.setup(coreSetup, setupDeps);
      expect(setup).toHaveProperty('createVisualizationType');
      expect(setupDeps.visualizations.registerAlias).toHaveBeenCalledWith(
        expect.objectContaining({
          name: PLUGIN_ID,
          title: PLUGIN_NAME,
          aliasPath: '#/',
          aliasApp: PLUGIN_ID,
          stage: 'experimental',
        })
      );
    });
  });
});
