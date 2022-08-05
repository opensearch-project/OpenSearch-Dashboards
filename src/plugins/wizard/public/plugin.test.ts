/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { coreMock, savedObjectsServiceMock } from '../../../core/public/mocks';
import { dashboardPluginMock } from '../../../plugins/dashboard/public/mocks';
import { dataPluginMock } from '../../../plugins/data/public/mocks';
import { embeddablePluginMock } from '../../../plugins/embeddable/public/mocks';
import { navigationPluginMock } from '../../../plugins/navigation/public/mocks';
import { visualizationsPluginMock } from '../../../plugins/visualizations/public/mocks';
import { PLUGIN_ID, PLUGIN_NAME } from '../common';
import { WizardPlugin } from './plugin';

describe('WizardPlugin', () => {
  describe('setup', () => {
    it('initializes the plugin correctly and registers it as an alias visualization', () => {
      const plugin = new WizardPlugin(coreMock.createPluginInitializerContext());
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
