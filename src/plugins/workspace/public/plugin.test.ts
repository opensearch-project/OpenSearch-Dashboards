/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject, Observable, Subscriber } from 'rxjs';
import { waitFor } from '@testing-library/dom';
import { first } from 'rxjs/operators';

import { applicationServiceMock, chromeServiceMock, coreMock } from '../../../core/public/mocks';
import {
  ChromeBreadcrumb,
  NavGroupStatus,
  DEFAULT_NAV_GROUPS,
  AppNavLinkStatus,
} from '../../../core/public';
import { WORKSPACE_FATAL_ERROR_APP_ID, WORKSPACE_DETAIL_APP_ID } from '../common/constants';
import { savedObjectsManagementPluginMock } from '../../saved_objects_management/public/mocks';
import { managementPluginMock } from '../../management/public/mocks';
import { UseCaseService } from './services/use_case_service';
import { workspaceClientMock, WorkspaceClientMock } from './workspace_client.mock';
import { WorkspacePlugin } from './plugin';
import { contentManagementPluginMocks } from '../../content_management/public';
import { navigationPluginMock } from '../../navigation/public/mocks';
import * as applicationExports from './application';
import {
  WorkspaceCreationPostProcessorService,
  WorkspaceDetailCustomizedTabsService,
} from './services';

// Expect 6 app registrations: create, fatal error, detail, initial, navigation, and list apps.
const registrationAppNumber = 6;

// jest.mock('./application', () => ({
//   renderCreatorApp: jest.fn(),
// }));

describe('Workspace plugin', () => {
  const getMockDependencies = () => ({
    contentManagement: contentManagementPluginMocks.createStartContract(),
    navigation: navigationPluginMock.createStartContract(),
  });
  const getSetupMock = () => coreMock.createSetup();

  beforeEach(() => {
    WorkspaceClientMock.mockClear();
    Object.values(workspaceClientMock).forEach((item) => item.mockClear());
  });

  it('#setup', async () => {
    const setupMock = getSetupMock();
    const savedObjectManagementSetupMock = savedObjectsManagementPluginMock.createSetupContract();
    const initializerContext = coreMock.createPluginInitializerContext();
    const workspacePlugin = new WorkspacePlugin(initializerContext);
    await workspacePlugin.setup(setupMock, {
      savedObjectsManagement: savedObjectManagementSetupMock,
      management: managementPluginMock.createSetupContract(),
    });
    expect(setupMock.application.register).toBeCalledTimes(registrationAppNumber);
    expect(WorkspaceClientMock).toBeCalledTimes(1);
    expect(savedObjectManagementSetupMock.columns.register).toBeCalledTimes(1);
  });

  it('#call savedObjectsClient.setCurrentWorkspace when current workspace id changed', async () => {
    const initializerContext = coreMock.createPluginInitializerContext();
    const workspacePlugin = new WorkspacePlugin(initializerContext);
    const setupMock = getSetupMock();
    const coreStart = coreMock.createStart();
    await workspacePlugin.setup(setupMock, {});
    workspacePlugin.start(coreStart, getMockDependencies());
    coreStart.workspaces.currentWorkspaceId$.next('foo');
    expect(coreStart.savedObjects.client.setCurrentWorkspace).toHaveBeenCalledWith('foo');
    expect(setupMock.application.register).toBeCalledTimes(registrationAppNumber);
    expect(WorkspaceClientMock).toBeCalledTimes(1);
    expect(workspaceClientMock.enterWorkspace).toBeCalledTimes(0);
  });

  it('#setup when workspace id is in url and enterWorkspace return error', async () => {
    const windowSpy = jest.spyOn(window, 'window', 'get');
    windowSpy.mockImplementation(
      () =>
        ({
          location: {
            href: 'http://localhost/w/workspaceId/app',
          },
        } as any)
    );
    workspaceClientMock.enterWorkspace.mockResolvedValue({
      success: false,
      error: 'error',
    });
    const setupMock = getSetupMock();
    const applicationStartMock = applicationServiceMock.createStartContract();
    const chromeStartMock = chromeServiceMock.createStartContract();
    setupMock.getStartServices.mockImplementation(() => {
      return Promise.resolve([
        {
          application: applicationStartMock,
          chrome: chromeStartMock,
        },
        {},
        {},
      ]) as any;
    });

    const initializerContext = coreMock.createPluginInitializerContext();
    const workspacePlugin = new WorkspacePlugin(initializerContext);
    await workspacePlugin.setup(setupMock, {
      management: managementPluginMock.createSetupContract(),
    });
    expect(setupMock.application.register).toBeCalledTimes(registrationAppNumber);
    expect(WorkspaceClientMock).toBeCalledTimes(1);
    expect(workspaceClientMock.enterWorkspace).toBeCalledWith('workspaceId');
    expect(setupMock.getStartServices).toBeCalledTimes(2);
    await waitFor(
      () => {
        expect(applicationStartMock.navigateToApp).toBeCalledWith(WORKSPACE_FATAL_ERROR_APP_ID, {
          replace: true,
          state: {
            error: 'error',
          },
        });
      },
      {
        container: document.body,
      }
    );
    windowSpy.mockRestore();
  });

  it('#setup when workspace id is in url and enterWorkspace return success', async () => {
    const windowSpy = jest.spyOn(window, 'window', 'get');
    windowSpy.mockImplementation(
      () =>
        ({
          location: {
            href: 'http://localhost/w/workspaceId/app',
          },
        } as any)
    );
    workspaceClientMock.enterWorkspace.mockResolvedValue({
      success: true,
      error: 'error',
    });
    const setupMock = getSetupMock();
    const applicationStartMock = applicationServiceMock.createStartContract();
    const chromeStartMock = chromeServiceMock.createStartContract();
    let currentAppIdSubscriber: Subscriber<string> | undefined;
    setupMock.getStartServices.mockImplementation(() => {
      return Promise.resolve([
        {
          application: {
            ...applicationStartMock,
            currentAppId$: new Observable((subscriber) => {
              currentAppIdSubscriber = subscriber;
            }),
          },
          chrome: chromeStartMock,
        },
        {},
        {},
      ]) as any;
    });

    const initializerContext = coreMock.createPluginInitializerContext();
    const workspacePlugin = new WorkspacePlugin(initializerContext);
    await workspacePlugin.setup(setupMock, {
      management: managementPluginMock.createSetupContract(),
    });
    currentAppIdSubscriber?.next(WORKSPACE_FATAL_ERROR_APP_ID);
    expect(applicationStartMock.navigateToApp).toBeCalledWith(WORKSPACE_DETAIL_APP_ID);
    windowSpy.mockRestore();
  });

  it('#setup should register workspace list with a visible application and register to settingsAndSetup nav group', async () => {
    const setupMock = coreMock.createSetup();
    setupMock.chrome.navGroup.getNavGroupEnabled.mockReturnValue(true);
    const initializerContext = coreMock.createPluginInitializerContext();
    const workspacePlugin = new WorkspacePlugin(initializerContext);
    await workspacePlugin.setup(setupMock, {});

    expect(setupMock.application.register).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'workspace_list',
        navLinkStatus: AppNavLinkStatus.visible,
      })
    );
    expect(setupMock.chrome.navGroup.addNavLinksToGroup).toHaveBeenCalledWith(
      DEFAULT_NAV_GROUPS.settingsAndSetup,
      expect.arrayContaining([
        {
          id: 'workspace_list',
          order: 350,
          title: 'Workspaces',
        },
      ])
    );
  });

  it('#setup should register workspace detail with a hidden application and not register to all nav group', async () => {
    const setupMock = coreMock.createSetup();
    setupMock.chrome.navGroup.getNavGroupEnabled.mockReturnValue(true);
    const initializerContext = coreMock.createPluginInitializerContext();
    const workspacePlugin = new WorkspacePlugin(initializerContext);
    await workspacePlugin.setup(setupMock, {});

    expect(setupMock.application.register).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'workspace_detail',
      })
    );

    // not register to all nav group
    expect(setupMock.chrome.navGroup.addNavLinksToGroup).not.toHaveBeenCalledWith(
      DEFAULT_NAV_GROUPS.all,
      expect.arrayContaining([
        {
          id: 'workspace_detail',
          title: 'Overview',
          order: 100,
        },
      ])
    );
  });

  it('#setup should register workspace initial with a visible application', async () => {
    const setupMock = coreMock.createSetup();
    const initializerContext = coreMock.createPluginInitializerContext();
    const workspacePlugin = new WorkspacePlugin(initializerContext);
    await workspacePlugin.setup(setupMock, {});

    expect(setupMock.application.register).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'workspace_initial',
        navLinkStatus: AppNavLinkStatus.hidden,
      })
    );
  });

  it('#setup should register registerCollapsibleNavHeader when enter a workspace', async () => {
    const windowSpy = jest.spyOn(window, 'window', 'get');
    windowSpy.mockImplementation(
      () =>
        ({
          location: {
            href: 'http://localhost/w/workspaceId/app',
          },
        } as any)
    );
    workspaceClientMock.enterWorkspace.mockResolvedValueOnce({
      success: true,
      error: 'error',
    });
    const setupMock = coreMock.createSetup();
    let collapsibleNavHeaderImplementation = () => null;
    setupMock.chrome.navGroup.getNavGroupEnabled.mockReturnValue(true);
    setupMock.chrome.registerCollapsibleNavHeader.mockImplementation(
      (func) => (collapsibleNavHeaderImplementation = func)
    );
    const initializerContext = coreMock.createPluginInitializerContext();
    const workspacePlugin = new WorkspacePlugin(initializerContext);
    await workspacePlugin.setup(setupMock, {});
    expect(collapsibleNavHeaderImplementation()).toEqual(null);
    const startMock = coreMock.createStart();
    await workspacePlugin.start(startMock, getMockDependencies());
    expect(collapsibleNavHeaderImplementation()).not.toEqual(null);
    windowSpy.mockRestore();
  });

  it('#setup workspace create mounter should invoke with collaboratorEditorEnabled flag', async () => {
    const setupMock = coreMock.createSetup();
    const initializerContext = coreMock.createPluginInitializerContext();
    jest
      .spyOn(initializerContext.config, 'get')
      .mockReturnValue({ collaboratorEditorEnabled: true });
    setupMock.getStartServices.mockResolvedValue([
      coreMock.createStart(),
      { navigation: { ui: {} } },
      {},
    ]);

    // const { renderCreatorApp } = await import('./application');
    const renderCreatorAppMock = jest.fn();
    jest.spyOn(applicationExports, 'renderCreatorApp').mockImplementationOnce(renderCreatorAppMock);

    const workspacePlugin = new WorkspacePlugin(initializerContext);
    await workspacePlugin.setup(setupMock, {});

    let workspaceCreatorMounter: Function = () => {};
    for (const params of setupMock.application.register.mock.calls) {
      if (params[0].id === 'workspace_create') {
        workspaceCreatorMounter = params[0].mount;
      }
    }

    await workspaceCreatorMounter();
    expect(renderCreatorAppMock).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        collaboratorEditorEnabled: true,
      }),
      expect.anything()
    );
  });

  it('#setup should register workspace essential use case when new home is disabled', async () => {
    const setupMock = {
      ...coreMock.createSetup(),
      chrome: {
        ...coreMock.createSetup().chrome,
        navGroup: {
          ...coreMock.createSetup().chrome.navGroup,
          getNavGroupEnabled: jest.fn().mockReturnValue(false),
        },
      },
    };
    const initializerContext = coreMock.createPluginInitializerContext();
    const workspacePlugin = new WorkspacePlugin(initializerContext);
    await workspacePlugin.setup(setupMock, {
      contentManagement: {
        registerPage: jest.fn(),
      },
    });

    expect(setupMock.application.register).not.toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'essential_overview',
      })
    );
    expect(setupMock.application.register).not.toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'analytics_all_overview',
      })
    );
  });

  it('#setup should register workspace essential use case when new nav is enabled', async () => {
    const setupMock = {
      ...coreMock.createSetup(),
      chrome: {
        ...coreMock.createSetup().chrome,
        navGroup: {
          ...coreMock.createSetup().chrome.navGroup,
          getNavGroupEnabled: jest.fn().mockReturnValue(true),
        },
      },
    };
    const initializerContext = coreMock.createPluginInitializerContext();
    const workspacePlugin = new WorkspacePlugin(initializerContext);
    await workspacePlugin.setup(setupMock, {
      contentManagement: {
        registerPage: jest.fn(),
      },
    });

    expect(setupMock.application.register).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'essentials_overview',
      })
    );
  });

  it('#setup should register workspace analytics(All) use case when new nav is enabled', async () => {
    const setupMock = {
      ...coreMock.createSetup(),
      chrome: {
        ...coreMock.createSetup().chrome,
        navGroup: {
          ...coreMock.createSetup().chrome.navGroup,
          getNavGroupEnabled: jest.fn().mockReturnValue(true),
        },
      },
    };
    const initializerContext = coreMock.createPluginInitializerContext();
    const workspacePlugin = new WorkspacePlugin(initializerContext);
    await workspacePlugin.setup(setupMock, {
      contentManagement: {
        registerPage: jest.fn(),
      },
    });
  });

  it('#setup should register workspace navigation with a visible application', async () => {
    const setupMock = coreMock.createSetup();
    const initializerContext = coreMock.createPluginInitializerContext();
    const workspacePlugin = new WorkspacePlugin(initializerContext);
    await workspacePlugin.setup(setupMock, {});
    expect(setupMock.application.register).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'workspace_navigation',
        navLinkStatus: AppNavLinkStatus.hidden,
      })
    );
  });

  it('#setup able to registerWorkspaceCreationPostProcessor', async () => {
    const setupMock = coreMock.createSetup();
    const initializerContext = coreMock.createPluginInitializerContext();
    const workspacePlugin = new WorkspacePlugin(initializerContext);
    const workspacePluginSetup = await workspacePlugin.setup(setupMock, {});

    const mockProcessor = () => {};
    workspacePluginSetup.registerWorkspaceCreationPostProcessor(mockProcessor);

    expect(WorkspaceCreationPostProcessorService.getInstance().getProcessor()).toBe(mockProcessor);
  });

  it('#setup able to registerWorkspaceDetailCustomizedTab', async () => {
    const setupMock = coreMock.createSetup();
    const initializerContext = coreMock.createPluginInitializerContext();
    const workspacePlugin = new WorkspacePlugin(initializerContext);
    const workspacePluginSetup = await workspacePlugin.setup(setupMock, {});

    const mockTab = { id: 'tab-1', title: 'Tab 1', order: 123, render: () => null };
    workspacePluginSetup.registerWorkspaceDetailCustomizedTab(mockTab);

    expect(
      WorkspaceDetailCustomizedTabsService.getInstance().getCustomizedTabs$().getValue()[0]
    ).toBe(mockTab);
  });

  it('#start add workspace detail page to breadcrumbs when start', async () => {
    const startMock = coreMock.createStart();
    const workspaceObject = {
      id: 'foo',
      name: 'bar',
    };
    startMock.workspaces.currentWorkspace$.next(workspaceObject);
    const breadcrumbs = new BehaviorSubject<ChromeBreadcrumb[]>([{ text: 'dashboards' }]);
    startMock.chrome.getBreadcrumbs$.mockReturnValue(breadcrumbs);
    const initializerContext = coreMock.createPluginInitializerContext();
    const workspacePlugin = new WorkspacePlugin(initializerContext);
    workspacePlugin.start(startMock, getMockDependencies());
    expect(startMock.chrome.setBreadcrumbs).toBeCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          text: 'bar',
        }),
        expect.objectContaining({
          text: 'Home',
        }),
      ])
    );
  });

  it('#start do not add workspace detail page to breadcrumbs when already exists', async () => {
    const startMock = coreMock.createStart();
    const workspaceObject = {
      id: 'foo',
      name: 'bar',
    };
    startMock.workspaces.currentWorkspace$.next(workspaceObject);
    const breadcrumbs = new BehaviorSubject<ChromeBreadcrumb[]>([
      { text: 'home' },
      { text: 'bar' },
    ]);
    startMock.chrome.getBreadcrumbs$.mockReturnValue(breadcrumbs);
    const initializerContext = coreMock.createPluginInitializerContext();
    const workspacePlugin = new WorkspacePlugin(initializerContext);
    workspacePlugin.start(startMock, getMockDependencies());
    expect(startMock.chrome.setBreadcrumbs).not.toHaveBeenCalled();
  });

  it('#start should register workspace list card into new home page', async () => {
    const startMock = coreMock.createStart();
    const initializerContext = coreMock.createPluginInitializerContext();
    startMock.chrome.navGroup.getNavGroupEnabled.mockReturnValue(true);
    const workspacePlugin = new WorkspacePlugin(initializerContext);
    const mockDependencies = getMockDependencies();
    workspacePlugin.start(startMock, mockDependencies);
    expect(mockDependencies.contentManagement.registerContentProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'workspace_list_card_home',
      })
    );
  });

  it('#start should call navGroupUpdater$.next after currentWorkspace set', async () => {
    const initializerContext = coreMock.createPluginInitializerContext();
    const workspacePlugin = new WorkspacePlugin(initializerContext);
    const setupMock = getSetupMock();
    const coreStart = coreMock.createStart();
    await workspacePlugin.setup(setupMock, {});

    expect(setupMock.chrome.navGroup.registerNavGroupUpdater).toHaveBeenCalled();
    const navGroupUpdater$ = setupMock.chrome.navGroup.registerNavGroupUpdater.mock.calls[0][0];

    expect(navGroupUpdater$).toBeTruthy();
    jest.spyOn(navGroupUpdater$, 'next');

    expect(navGroupUpdater$.next).not.toHaveBeenCalled();
    workspacePlugin.start(coreStart, getMockDependencies());
    coreStart.workspaces.currentWorkspace$.next({
      id: 'foo',
      name: 'foo',
    });

    await waitFor(() => {
      expect(navGroupUpdater$.next).toHaveBeenCalled();
    });
  });

  it('#start register workspace dropdown menu at left navigation bottom when start', async () => {
    const coreStart = coreMock.createStart();
    coreStart.chrome.navGroup.getNavGroupEnabled.mockReturnValue(true);
    const initializerContext = coreMock.createPluginInitializerContext();
    const workspacePlugin = new WorkspacePlugin(initializerContext);
    workspacePlugin.start(coreStart, getMockDependencies());

    expect(coreStart.chrome.navControls.registerLeftBottom).toBeCalledTimes(1);
  });

  it('#start should not update systematic use case features after currentWorkspace set', async () => {
    const registeredUseCases$ = new BehaviorSubject([
      {
        id: 'foo',
        title: 'Foo',
        features: [{ id: 'system-feature', title: 'System feature' }],
        systematic: true,
        description: '',
      },
    ]);
    jest.spyOn(UseCaseService.prototype, 'start').mockImplementationOnce(() => ({
      getRegisteredUseCases$: jest.fn(() => registeredUseCases$),
    }));
    const initializerContext = coreMock.createPluginInitializerContext();
    const workspacePlugin = new WorkspacePlugin(initializerContext);
    const setupMock = getSetupMock();
    const coreStart = coreMock.createStart();
    await workspacePlugin.setup(setupMock, {});
    const workspaceObject = {
      id: 'foo',
      name: 'bar',
      features: ['baz'],
    };
    coreStart.workspaces.currentWorkspace$.next(workspaceObject);

    const appUpdater$ = setupMock.application.registerAppUpdater.mock.calls[0][0];

    workspacePlugin.start(coreStart, getMockDependencies());

    const appUpdater = await appUpdater$.pipe(first()).toPromise();

    expect(appUpdater({ id: 'system-feature', title: '', mount: () => () => {} })).toBeUndefined();
  });

  it('#start should update nav group status after currentWorkspace set', async () => {
    const initializerContext = coreMock.createPluginInitializerContext();
    const workspacePlugin = new WorkspacePlugin(initializerContext);
    const setupMock = getSetupMock();
    const coreStart = coreMock.createStart();
    await workspacePlugin.setup(setupMock, {});
    const workspaceObject = {
      id: 'foo',
      name: 'bar',
      features: ['use-case-foo'],
    };
    coreStart.workspaces.currentWorkspace$.next(workspaceObject);

    const navGroupUpdater$ = setupMock.chrome.navGroup.registerNavGroupUpdater.mock.calls[0][0];

    workspacePlugin.start(coreStart, getMockDependencies());

    const navGroupUpdater = await navGroupUpdater$.pipe(first()).toPromise();

    expect(navGroupUpdater({ id: 'foo' })).toBeUndefined();
    expect(navGroupUpdater({ id: 'bar' })).toEqual({
      status: NavGroupStatus.Hidden,
    });
  });

  it('#start should only register get started cards of use cases to new home page', async () => {
    const initializerContext = coreMock.createPluginInitializerContext();
    const workspacePlugin = new WorkspacePlugin(initializerContext);
    const setupMock = getSetupMock();
    const coreStart = coreMock.createStart();
    await workspacePlugin.setup(setupMock, {});
    const registeredUseCases$ = new BehaviorSubject([
      {
        id: 'foo',
        title: 'Foo',
        systematic: true,
        description: '',
        features: [],
      },
      {
        id: 'bar',
        title: 'Bar',
        description: '',
        features: [],
      },
    ]);
    jest.spyOn(UseCaseService.prototype, 'start').mockImplementationOnce(() => ({
      getRegisteredUseCases$: jest.fn(() => registeredUseCases$),
    }));

    coreStart.chrome.navGroup.getNavGroupEnabled.mockReturnValue(true);

    const mockDependencies = getMockDependencies();

    workspacePlugin.start(coreStart, mockDependencies);
    await waitFor(() => {
      expect(mockDependencies.contentManagement.registerContentProvider).toBeCalledWith(
        expect.objectContaining({
          id: `home_get_start_bar`,
        })
      );
      expect(mockDependencies.contentManagement.registerContentProvider).not.toBeCalledWith(
        expect.objectContaining({
          id: `home_get_start_foo`,
        })
      );
    });
  });

  it('#stop should call unregisterNavGroupUpdater', async () => {
    const initializerContext = coreMock.createPluginInitializerContext();
    const workspacePlugin = new WorkspacePlugin(initializerContext);
    const setupMock = getSetupMock();
    const unregisterNavGroupUpdater = jest.fn();
    setupMock.chrome.navGroup.registerNavGroupUpdater.mockReturnValueOnce(
      unregisterNavGroupUpdater
    );
    await workspacePlugin.setup(setupMock, {});

    workspacePlugin.stop();

    expect(unregisterNavGroupUpdater).toHaveBeenCalled();
  });

  it('#stop should not call appUpdater$.next anymore', async () => {
    const registeredUseCases$ = new BehaviorSubject([
      {
        id: 'foo',
        title: 'Foo',
        features: [
          {
            id: 'system-feature',
          },
        ],
        systematic: true,
        description: '',
      },
    ]);
    jest.spyOn(UseCaseService.prototype, 'start').mockImplementationOnce(() => ({
      getRegisteredUseCases$: jest.fn(() => registeredUseCases$),
    }));
    const initializerContext = coreMock.createPluginInitializerContext();
    const workspacePlugin = new WorkspacePlugin(initializerContext);
    const setupMock = getSetupMock();
    const coreStart = coreMock.createStart();
    await workspacePlugin.setup(setupMock, {});
    const workspaceObject = {
      id: 'foo',
      name: 'bar',
      features: ['baz'],
    };
    coreStart.workspaces.currentWorkspace$.next(workspaceObject);

    const appUpdater$ = setupMock.application.registerAppUpdater.mock.calls[0][0];
    const appUpdaterChangeMock = jest.fn();
    appUpdater$.subscribe(appUpdaterChangeMock);

    workspacePlugin.start(coreStart, getMockDependencies());

    // Wait for filterNav been executed
    await new Promise(setImmediate);

    expect(appUpdaterChangeMock).toHaveBeenCalledTimes(2);

    workspacePlugin.stop();

    registeredUseCases$.next([]);
    expect(appUpdaterChangeMock).toHaveBeenCalledTimes(2);
  });
});
