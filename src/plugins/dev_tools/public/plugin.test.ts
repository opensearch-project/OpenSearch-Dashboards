/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreSetup } from 'opensearch-dashboards/public';
import { DevToolsPlugin, DevToolsSetupDependencies } from './plugin';
import { coreMock } from '../../../core/public/mocks';
import { urlForwardingPluginMock } from '../../url_forwarding/public/mocks';
import { uiActionsPluginMock } from '../../ui_actions/public/mocks';

describe('DevToolsPlugin', () => {
  describe('setup', () => {
    const plugin = new DevToolsPlugin();

    const coreSetup: CoreSetup = coreMock.createSetup();
    const deps: DevToolsSetupDependencies = {
      urlForwarding: urlForwardingPluginMock.createSetupContract(),
      uiActions: uiActionsPluginMock.createSetupContract(),
    };

    const getNavGroupEnabledMock = jest.fn().mockReturnValue(true);
    const coreSetupMock = {
      ...coreSetup,
      chrome: {
        ...coreSetup.chrome,
        navGroup: {
          ...coreSetup.chrome.navGroup,
          getNavGroupEnabled: getNavGroupEnabledMock,
        },
      },
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should register global search strategy for dev tools when new home is enabled', () => {
      plugin.setup(coreSetupMock, deps);
      expect(coreSetupMock.chrome.globalSearch.registerSearchCommand).toHaveBeenCalled();
      expect(deps.uiActions.registerTrigger).toHaveBeenCalled();
    });

    it('should not register global search strategy for dev tools when new home is not enabled', () => {
      getNavGroupEnabledMock.mockReturnValue(false);
      plugin.setup(coreSetupMock, deps);
      expect(coreSetupMock.chrome.globalSearch.registerSearchCommand).not.toHaveBeenCalled();
      expect(deps.uiActions.registerTrigger).not.toHaveBeenCalled();
    });
  });
});
