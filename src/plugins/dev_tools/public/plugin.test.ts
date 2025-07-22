/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreSetup, CoreStart } from 'opensearch-dashboards/public';
import {
  DEVTOOL_TRIGGER_ID,
  DevToolsPlugin,
  DevToolsSetupDependencies,
  DevToolsStartDependencies,
} from './plugin';
import { chromeServiceMock, coreMock } from '../../../core/public/mocks';
import { urlForwardingPluginMock } from '../../url_forwarding/public/mocks';
import { uiActionsPluginMock } from '../../ui_actions/public/mocks';

const createCoreSetupMock = () => {
  const coreSetup: jest.Mocked<CoreSetup> = coreMock.createSetup();
  const getNavGroupEnabledMock = jest.fn().mockReturnValue(true);
  const chrome = chromeServiceMock.createSetupContract();

  return {
    ...coreSetup,
    chrome: {
      ...chrome,
      navGroup: {
        ...chrome.navGroup,
        getNavGroupEnabled: getNavGroupEnabledMock,
      },
    },
  };
};

const createSetupDepsMock = (): DevToolsSetupDependencies => {
  return {
    urlForwarding: urlForwardingPluginMock.createSetupContract(),
    uiActions: uiActionsPluginMock.createSetupContract(),
  };
};

const createCoreStartMock = () => {
  const coreStart: CoreStart = coreMock.createStart();
  const getNavGroupEnabledMock = jest.fn().mockReturnValue(true);

  return {
    ...coreStart,
    chrome: {
      ...coreStart.chrome,
      navGroup: {
        ...coreStart.chrome.navGroup,
        getNavGroupEnabled: getNavGroupEnabledMock,
      },
    },
  };
};

const createStartDepsMock = () => {
  return {
    uiActions: uiActionsPluginMock.createStartContract() as jest.Mocked<
      DevToolsStartDependencies['uiActions']
    >,
  };
};

describe('DevToolsPlugin', () => {
  describe('setup', () => {
    const plugin = new DevToolsPlugin();

    const deps: DevToolsSetupDependencies = createSetupDepsMock();
    const coreSetupMock = createCoreSetupMock();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should register global search strategy for dev tools when new home is enabled', () => {
      plugin.setup(coreSetupMock, deps);
      expect(coreSetupMock.chrome.globalSearch.registerSearchCommand).toHaveBeenCalled();
      expect(deps.uiActions.registerTrigger).toHaveBeenCalled();
    });

    it('should not register global search strategy for dev tools when new home is not enabled', () => {
      coreSetupMock.chrome.navGroup.getNavGroupEnabled.mockReturnValue(false);
      plugin.setup(coreSetupMock, deps);
      expect(coreSetupMock.chrome.globalSearch.registerSearchCommand).not.toHaveBeenCalled();
      expect(deps.uiActions.registerTrigger).not.toHaveBeenCalled();
    });
  });

  describe('start', () => {
    const plugin = new DevToolsPlugin();

    it('should add a dom to body for mounting dev tool modal when nav group enabled', () => {
      const coreSetupMock = createCoreSetupMock();
      const coreStartMock = createCoreStartMock();
      const setupDeps = createSetupDepsMock();
      const startDeps = createStartDepsMock();
      plugin.setup(coreSetupMock, setupDeps);
      plugin.start(coreStartMock, startDeps);
      expect(document.body.querySelector('[data-test-subj="devToolsModalMountDom"]')).toBeTruthy();
      plugin.stop();
      expect(document.body.querySelector('[data-test-subj="devToolsModalMountDom"]')).toBeNull();
    });

    it('onClick function should execute the dev tool trigger with the first dev tool id', () => {
      const coreSetupMock = createCoreSetupMock();
      const coreStartMock = createCoreStartMock();
      const setupDeps = createSetupDepsMock();
      const setup = plugin.setup(coreSetupMock, setupDeps);
      setup.register({
        id: 'foo',
        title: 'Foo Dev Tool',
        mount: jest.fn(),
        enableRouting: true,
        order: 1,
      });
      const navLinks = coreSetupMock.chrome.navGroup.addNavLinksToGroup.mock.calls[0][1];
      const onClick = navLinks[0].onClick;
      const preventDefault = jest.fn();

      const startDeps = createStartDepsMock();
      const execMock = jest.fn();
      startDeps.uiActions.getTrigger.mockReturnValue(({
        exec: execMock,
        id: DEVTOOL_TRIGGER_ID,
      } as unknown) as any); // have to cast to any to avoid type errors because UI Actions trigger is not fully mocked
      plugin.start(coreStartMock, startDeps);

      onClick({ preventDefault });

      expect(preventDefault).toHaveBeenCalled();
      expect(execMock).toHaveBeenCalledWith({ defaultRoute: 'foo' });
    });
  });
});
