/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { coreMock } from '../../../core/public/mocks';
import { IndexPatternManagementPlugin } from './plugin';
import { urlForwardingPluginMock } from '../../url_forwarding/public/mocks';
import { managementPluginMock } from '../../management/public/mocks';
import {
  ManagementApp,
  ManagementAppMountParams,
  RegisterManagementAppArgs,
} from 'src/plugins/management/public';
import { waitFor } from '@testing-library/dom';

describe('DiscoverPlugin', () => {
  it('setup successfully', () => {
    const setupMock = coreMock.createSetup();
    const initializerContext = coreMock.createPluginInitializerContext();
    const pluginInstance = new IndexPatternManagementPlugin(initializerContext);
    expect(() =>
      pluginInstance.setup(setupMock, {
        urlForwarding: urlForwardingPluginMock.createSetupContract(),
        management: managementPluginMock.createSetupContract(),
      })
    ).not.toThrow();
    expect(setupMock.application.register).toBeCalledTimes(1);
    waitFor(() => {
      expect(setupMock.chrome.navGroup.addNavLinksToGroup).toBeCalledTimes(1);
    });
  });

  it('when new navigation is enabled, should navigate to standard IPM app', async () => {
    const setupMock = coreMock.createSetup();
    const startMock = coreMock.createStart();
    setupMock.getStartServices.mockResolvedValue([startMock, {}, {}]);
    const initializerContext = coreMock.createPluginInitializerContext();
    const pluginInstance = new IndexPatternManagementPlugin(initializerContext);
    const managementMock = managementPluginMock.createSetupContract();
    let applicationRegistration = {} as Omit<RegisterManagementAppArgs, 'basePath'>;
    managementMock.sections.section.opensearchDashboards.registerApp = (
      app: Omit<RegisterManagementAppArgs, 'basePath'>
    ) => {
      applicationRegistration = app;
      return {} as ManagementApp;
    };

    setupMock.chrome.navGroup.getNavGroupEnabled.mockReturnValue(true);
    startMock.application.getUrlForApp.mockReturnValue('/app/indexPatterns');

    pluginInstance.setup(setupMock, {
      urlForwarding: urlForwardingPluginMock.createSetupContract(),
      management: managementMock,
    });

    await applicationRegistration.mount({} as ManagementAppMountParams);

    expect(startMock.application.getUrlForApp).toBeCalledWith('indexPatterns');
    expect(startMock.application.navigateToUrl).toBeCalledWith(
      'http://localhost/app/indexPatterns'
    );
  });
});
