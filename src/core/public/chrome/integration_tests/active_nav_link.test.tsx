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

import React, { act } from 'react';
import { createMemoryHistory } from 'history';
import { shallow } from 'enzyme';
import { Observable } from 'rxjs';

import { ApplicationService } from '../../application/application_service';
import { createRenderer } from '../../application/integration_tests/utils';
import { contextServiceMock } from '../../context/context_service.mock';
import { docLinksServiceMock } from '../../doc_links/doc_links_service.mock';
import { httpServiceMock } from '../../http/http_service.mock';
import { injectedMetadataServiceMock } from '../../injected_metadata/injected_metadata_service.mock';
import { keyboardShortcutServiceMock } from '../../keyboard_shortcut/keyboard_shortcut_service.mock';
import { notificationServiceMock } from '../../notifications/notifications_service.mock';
import { overlayServiceMock } from '../../overlays/overlay_service.mock';
import { uiSettingsServiceMock } from '../../ui_settings/ui_settings_service.mock';
import { workspacesServiceMock } from '../../workspace/workspaces_service.mock';
import { ChromeService } from '../chrome_service';

const createDeferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((next) => {
    resolve = next;
  });
  return { promise, resolve };
};

describe('active nav link application lifecycle', () => {
  it('keeps app B active when app A writes after its asynchronous mount resumes', async () => {
    const history = createMemoryHistory();
    const http = httpServiceMock.createSetupContract();
    const applicationService = new ApplicationService();
    const chromeService = new ChromeService();
    const startServicesDeferred = createDeferred();
    const lateWriteCompleted = createDeferred();
    const dataExplorerUnmount = jest.fn();
    const dashboardUnmount = jest.fn();

    http.post.mockResolvedValue({
      catalogue: {},
      management: {},
      navLinks: {},
      workspaces: {},
    });

    const applicationSetup = applicationService.setup({
      context: contextServiceMock.createSetupContract(),
      history,
      http,
    });

    const dataExplorerMount = jest.fn(async () => {
      await startServicesDeferred.promise;
      chromeStart.setActiveNavLink('discover', 'data-explorer');
      lateWriteCompleted.resolve();
      return dataExplorerUnmount;
    });
    const dashboardMount = jest.fn(() => dashboardUnmount);

    applicationSetup.register(Symbol(), {
      id: 'data-explorer',
      title: 'Data Explorer',
      mount: dataExplorerMount,
    });
    applicationSetup.register(Symbol(), {
      id: 'dashboard',
      title: 'Dashboard',
      mount: dashboardMount,
    });

    const workspaces = workspacesServiceMock.createStartContract();
    const applicationStart = await applicationService.start({
      http,
      overlays: overlayServiceMock.createStartContract(),
      workspaces,
    });
    const uiSettings = uiSettingsServiceMock.createStartContract();
    const injectedMetadata = injectedMetadataServiceMock.createStartContract();

    chromeService.setup({ uiSettings, injectedMetadata });
    const chromeStart = await chromeService.start({
      application: applicationStart,
      docLinks: docLinksServiceMock.createStartContract(),
      http,
      injectedMetadata,
      notifications: notificationServiceMock.createStartContract(),
      uiSettings,
      overlays: overlayServiceMock.createStartContract(),
      workspaces,
      keyboardShortcut: keyboardShortcutServiceMock.createStart(),
    });

    const setActiveNavLinkSpy = jest.spyOn(chromeStart, 'setActiveNavLink');
    const header = shallow(React.createElement(() => chromeStart.getHeaderComponent()));
    const activeNavLinkId$ = header.prop('activeNavLinkId$') as Observable<string | undefined>;
    const activeNavLinkIds: Array<string | undefined> = [];
    const subscription = activeNavLinkId$.subscribe((appId) => activeNavLinkIds.push(appId));
    const renderApplication = createRenderer(applicationStart.getComponent());
    const applicationWrapper = await renderApplication();

    try {
      await act(async () => {
        await applicationStart.navigateToApp('data-explorer');
      });
      await renderApplication();

      expect(dataExplorerMount).toHaveBeenCalledTimes(1);
      expect(activeNavLinkIds.at(-1)).toBe('data-explorer');
      expect(setActiveNavLinkSpy).not.toHaveBeenCalled();

      await act(async () => {
        await applicationStart.navigateToApp('dashboard');
      });
      await renderApplication();

      expect(dashboardMount).toHaveBeenCalledTimes(1);
      expect(history.location.pathname).toBe('/app/dashboard');
      expect(activeNavLinkIds.at(-1)).toBe('dashboard');

      const activeNavLinkIdsAfterDashboardMount = [...activeNavLinkIds];

      await act(async () => {
        startServicesDeferred.resolve();
        await lateWriteCompleted.promise;
      });

      expect(setActiveNavLinkSpy).toHaveBeenCalledWith('discover', 'data-explorer');
      expect(dashboardMount.mock.invocationCallOrder[0]).toBeLessThan(
        setActiveNavLinkSpy.mock.invocationCallOrder[0]
      );
      expect(activeNavLinkIds).toEqual(activeNavLinkIdsAfterDashboardMount);
      expect(activeNavLinkIds.at(-1)).toBe('dashboard');
      expect(history.location.pathname).toBe('/app/dashboard');
    } finally {
      startServicesDeferred.resolve();
      if (dataExplorerMount.mock.calls.length > 0) {
        await lateWriteCompleted.promise;
      }
      subscription.unsubscribe();
      header.unmount();
      applicationWrapper?.unmount();
      chromeService.stop();
      applicationService.stop();
      jest.restoreAllMocks();
    }
  });
});
