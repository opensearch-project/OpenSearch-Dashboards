/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Rx from 'rxjs';
import { first } from 'rxjs/operators';
import {
  ChromeNavGroupService,
  ChromeRegistrationNavLink,
  CURRENT_NAV_GROUP_ID,
} from './nav_group_service';
import { uiSettingsServiceMock } from '../../ui_settings/ui_settings_service.mock';
import { NavLinksService } from '../nav_links';
import { applicationServiceMock, httpServiceMock, workspacesServiceMock } from '../../mocks';
import { AppCategory } from 'opensearch-dashboards/public';
import { DEFAULT_NAV_GROUPS, NavGroupStatus, ALL_USE_CASE_ID } from '../../';
import { ChromeBreadcrumbEnricher } from '../chrome_service';

const mockedGroupFoo = {
  id: 'foo',
  title: 'foo',
  description: 'foo',
};

const mockedGroupBar = {
  id: 'bar',
  title: 'bar',
  description: 'bar',
};

const mockedNavLinkFoo: ChromeRegistrationNavLink = {
  id: 'foo',
  order: 10,
};

const mockedNavLinkBar: ChromeRegistrationNavLink = {
  id: 'bar',
  order: 20,
};

const mockedCategoryFoo: AppCategory = {
  id: 'foo',
  order: 15,
  label: 'foo',
};

const mockedCategoryBar: AppCategory = {
  id: 'bar',
  order: 25,
  label: 'bar',
};

const mockedHttpService = httpServiceMock.createStartContract();
const mockedApplicationService = applicationServiceMock.createInternalStartContract();
const mockWorkspaceService = workspacesServiceMock.createStartContract();
const mockedNavLink = new NavLinksService();
const mockedNavLinkService = mockedNavLink.start({
  http: mockedHttpService,
  application: mockedApplicationService,
});

const mockedGetNavLinks = jest.fn();
jest.spyOn(mockedNavLinkService, 'getNavLinks$').mockImplementation(mockedGetNavLinks);
mockedGetNavLinks.mockReturnValue(
  new Rx.BehaviorSubject([
    {
      id: 'foo',
    },
    {
      id: 'bar',
    },
    {
      id: 'foo-in-category-foo',
    },
    {
      id: 'foo-in-category-bar',
    },
    {
      id: 'bar-in-category-foo',
    },
    {
      id: 'bar-in-category-bar',
    },
    {
      id: 'link-with-parent-nav-link-id',
    },
  ])
);

interface LooseObject {
  [key: string]: any;
}

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store = {} as LooseObject;
  return {
    getItem(key: string) {
      return store[key] || null;
    },
    setItem(key: string, value: string) {
      store[key] = value.toString();
    },
    removeItem(key: string) {
      delete store[key];
    },
    clear() {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

describe('ChromeNavGroupService#setup()', () => {
  it('should be able to `addNavLinksToGroup`', async () => {
    const warnMock = jest.fn();
    jest.spyOn(console, 'warn').mockImplementation(warnMock);
    const uiSettings = uiSettingsServiceMock.createSetupContract();
    const chromeNavGroupService = new ChromeNavGroupService();
    const chromeNavGroupServiceSetup = chromeNavGroupService.setup({ uiSettings });

    chromeNavGroupServiceSetup.addNavLinksToGroup(mockedGroupFoo, [mockedGroupFoo, mockedGroupBar]);
    chromeNavGroupServiceSetup.addNavLinksToGroup(mockedGroupBar, [mockedGroupBar]);
    const chromeNavGroupServiceStart = await chromeNavGroupService.start({
      navLinks: mockedNavLinkService,
      application: mockedApplicationService,
      breadcrumbsEnricher$: new Rx.BehaviorSubject<ChromeBreadcrumbEnricher | undefined>(undefined),
      workspaces: workspacesServiceMock.createStartContract(),
    });
    const groupsMap = await chromeNavGroupServiceStart.getNavGroupsMap$().pipe(first()).toPromise();
    expect(groupsMap[mockedGroupFoo.id].navLinks.length).toEqual(2);
    expect(groupsMap[mockedGroupBar.id].navLinks.length).toEqual(1);
    expect(groupsMap[mockedGroupFoo.id].id).toEqual(mockedGroupFoo.id);
    expect(warnMock).toBeCalledTimes(0);
  });

  it('should output warning message if `addNavLinksToGroup` with same group id and navLink id', async () => {
    const warnMock = jest.fn();
    jest.spyOn(console, 'warn').mockImplementation(warnMock);
    const uiSettings = uiSettingsServiceMock.createSetupContract();
    const chromeNavGroupService = new ChromeNavGroupService();
    const chromeNavGroupServiceSetup = chromeNavGroupService.setup({ uiSettings });

    chromeNavGroupServiceSetup.addNavLinksToGroup(mockedGroupFoo, [
      mockedNavLinkFoo,
      mockedGroupFoo,
    ]);
    chromeNavGroupServiceSetup.addNavLinksToGroup(mockedGroupBar, [mockedGroupBar]);
    const chromeNavGroupServiceStart = await chromeNavGroupService.start({
      navLinks: mockedNavLinkService,
      application: mockedApplicationService,
      breadcrumbsEnricher$: new Rx.BehaviorSubject<ChromeBreadcrumbEnricher | undefined>(undefined),
      workspaces: workspacesServiceMock.createStartContract(),
    });
    const groupsMap = await chromeNavGroupServiceStart.getNavGroupsMap$().pipe(first()).toPromise();
    expect(groupsMap[mockedGroupFoo.id].navLinks.length).toEqual(1);
    expect(groupsMap[mockedGroupBar.id].navLinks.length).toEqual(1);
    expect(warnMock).toBeCalledTimes(1);
    expect(warnMock).toBeCalledWith(
      `[ChromeService] Navlink of ${mockedGroupFoo.id} has already been registered in group ${mockedGroupFoo.id}`
    );
  });

  it('should return navGroupEnabled from ui settings', () => {
    const chrome = new ChromeNavGroupService();
    const uiSettings = uiSettingsServiceMock.createSetupContract();
    uiSettings.get$.mockImplementation(() => new Rx.BehaviorSubject(true));

    const chromeSetup = chrome.setup({ uiSettings });
    expect(chromeSetup.getNavGroupEnabled()).toBe(true);
  });
});

describe('ChromeNavGroupService#start()', () => {
  it('should be able to get the groups registered through addNavLinksToGroups with sorted order', async () => {
    const chromeNavGroupService = new ChromeNavGroupService();
    const uiSettings = uiSettingsServiceMock.createSetupContract();
    const chromeNavGroupServiceSetup = chromeNavGroupService.setup({ uiSettings });

    chromeNavGroupServiceSetup.addNavLinksToGroup(mockedGroupFoo, [
      mockedNavLinkFoo,
      {
        ...mockedNavLinkFoo,
        id: 'foo-in-category-foo',
        category: mockedCategoryFoo,
      },
      {
        ...mockedNavLinkBar,
        id: 'bar-in-category-foo',
        category: mockedCategoryFoo,
      },
      {
        ...mockedNavLinkFoo,
        id: 'foo-in-category-bar',
        category: mockedCategoryBar,
      },
      {
        ...mockedNavLinkBar,
        id: 'bar-in-category-bar',
        category: mockedCategoryBar,
      },
      mockedNavLinkBar,
      {
        id: 'link-with-parent-nav-link-id',
        parentNavLinkId: 'not-exist-id',
      },
    ]);
    chromeNavGroupServiceSetup.addNavLinksToGroup(mockedGroupBar, [mockedNavLinkBar]);

    const chromeStart = await chromeNavGroupService.start({
      navLinks: mockedNavLinkService,
      application: mockedApplicationService,
      breadcrumbsEnricher$: new Rx.BehaviorSubject<ChromeBreadcrumbEnricher | undefined>(undefined),
      workspaces: workspacesServiceMock.createStartContract(),
    });

    const groupsMap = await chromeStart.getNavGroupsMap$().pipe(first()).toPromise();

    expect(Object.keys(groupsMap).length).toEqual(2);
    expect(groupsMap[mockedGroupFoo.id].navLinks.map((item) => item.id)).toEqual([
      'foo',
      'foo-in-category-foo',
      'bar-in-category-foo',
      'bar',
      'foo-in-category-bar',
      'bar-in-category-bar',
      'link-with-parent-nav-link-id',
    ]);
    expect(groupsMap[mockedGroupBar.id].navLinks.length).toEqual(1);
  });

  it('should populate links with custom category if the nav link is inside second level but no entry in all use case', async () => {
    const chromeNavGroupService = new ChromeNavGroupService();
    const uiSettings = uiSettingsServiceMock.createSetupContract();
    const chromeNavGroupServiceSetup = chromeNavGroupService.setup({ uiSettings });

    chromeNavGroupServiceSetup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.all, [
      {
        id: 'foo',
      },
    ]);
    chromeNavGroupServiceSetup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.essentials, [
      {
        id: 'bar',
        title: 'bar',
      },
      {
        id: 'foo',
        title: 'foo',
      },
    ]);
    const navLinkServiceStart = mockedNavLink.start({
      http: mockedHttpService,
      application: mockedApplicationService,
    });
    navLinkServiceStart.getNavLinks$ = jest.fn().mockReturnValue(
      new Rx.BehaviorSubject([
        {
          id: 'foo',
        },
        {
          id: 'bar',
        },
        {
          id: 'customized_app',
        },
      ])
    );
    const chromeStart = await chromeNavGroupService.start({
      navLinks: navLinkServiceStart,
      application: mockedApplicationService,
      breadcrumbsEnricher$: new Rx.BehaviorSubject<ChromeBreadcrumbEnricher | undefined>(undefined),
      workspaces: workspacesServiceMock.createStartContract(),
    });
    const groupsMap = await chromeStart.getNavGroupsMap$().pipe(first()).toPromise();
    expect(groupsMap[ALL_USE_CASE_ID].navLinks).toEqual([
      {
        id: 'foo',
      },
      {
        id: 'bar',
        title: 'bar',
        category: { id: 'custom', label: 'Custom', order: 8500 },
      },
      {
        id: 'customized_app',
        category: { id: 'custom', label: 'Custom', order: 8500 },
      },
    ]);
  });

  it('should return navGroupEnabled from ui settings', async () => {
    const chromeNavGroupService = new ChromeNavGroupService();
    const uiSettings = uiSettingsServiceMock.createSetupContract();
    uiSettings.get$.mockImplementation(() => new Rx.BehaviorSubject(true));
    chromeNavGroupService.setup({ uiSettings });
    const chromeNavGroupServiceStart = await chromeNavGroupService.start({
      navLinks: mockedNavLinkService,
      application: mockedApplicationService,
      breadcrumbsEnricher$: new Rx.BehaviorSubject<ChromeBreadcrumbEnricher | undefined>(undefined),
      workspaces: workspacesServiceMock.createStartContract(),
    });

    expect(chromeNavGroupServiceStart.getNavGroupEnabled()).toBe(true);
  });

  it('should not update navGroupEnabled after stopped', async () => {
    const uiSettings = uiSettingsServiceMock.createSetupContract();
    const navGroupEnabled$ = new Rx.BehaviorSubject(true);
    uiSettings.get$.mockImplementation(() => navGroupEnabled$);

    const chromeNavGroupService = new ChromeNavGroupService();
    chromeNavGroupService.setup({ uiSettings });
    const chromeNavGroupServiceStart = await chromeNavGroupService.start({
      navLinks: mockedNavLinkService,
      application: mockedApplicationService,
      breadcrumbsEnricher$: new Rx.BehaviorSubject<ChromeBreadcrumbEnricher | undefined>(undefined),
      workspaces: workspacesServiceMock.createStartContract(),
    });

    navGroupEnabled$.next(false);
    expect(chromeNavGroupServiceStart.getNavGroupEnabled()).toBe(false);

    chromeNavGroupService.stop();
    navGroupEnabled$.next(true);
    expect(chromeNavGroupServiceStart.getNavGroupEnabled()).toBe(false);
  });

  it('should able to set current nav group', async () => {
    const uiSettings = uiSettingsServiceMock.createSetupContract();
    const navGroupEnabled$ = new Rx.BehaviorSubject(true);
    uiSettings.get$.mockImplementation(() => navGroupEnabled$);

    const chromeNavGroupService = new ChromeNavGroupService();
    const chromeNavGroupServiceSetup = chromeNavGroupService.setup({ uiSettings });

    chromeNavGroupServiceSetup.addNavLinksToGroup(
      {
        id: 'foo',
        title: 'foo title',
        description: 'foo description',
      },
      [mockedNavLinkFoo]
    );

    const chromeNavGroupServiceStart = await chromeNavGroupService.start({
      navLinks: mockedNavLinkService,
      application: mockedApplicationService,
      breadcrumbsEnricher$: new Rx.BehaviorSubject<ChromeBreadcrumbEnricher | undefined>(undefined),
      workspaces: workspacesServiceMock.createStartContract(),
    });

    // set an existing nav group id
    chromeNavGroupServiceStart.setCurrentNavGroup('foo');

    expect(sessionStorageMock.getItem(CURRENT_NAV_GROUP_ID)).toEqual('foo');

    let currentNavGroup = await chromeNavGroupServiceStart
      .getCurrentNavGroup$()
      .pipe(first())
      .toPromise();

    expect(currentNavGroup?.id).toEqual('foo');
    expect(currentNavGroup?.title).toEqual('foo title');

    // set a invalid nav group id
    chromeNavGroupServiceStart.setCurrentNavGroup('bar');
    currentNavGroup = await chromeNavGroupServiceStart
      .getCurrentNavGroup$()
      .pipe(first())
      .toPromise();

    expect(sessionStorageMock.getItem(CURRENT_NAV_GROUP_ID)).toBeFalsy();
    expect(currentNavGroup).toBeUndefined();

    // reset current nav group
    chromeNavGroupServiceStart.setCurrentNavGroup(undefined);
    currentNavGroup = await chromeNavGroupServiceStart
      .getCurrentNavGroup$()
      .pipe(first())
      .toPromise();

    expect(sessionStorageMock.getItem(CURRENT_NAV_GROUP_ID)).toBeFalsy();
    expect(currentNavGroup).toBeUndefined();
  });

  it('should set current nav group automatically if application only belongs to 1 visible nav group', async () => {
    const uiSettings = uiSettingsServiceMock.createSetupContract();
    const navGroupEnabled$ = new Rx.BehaviorSubject(true);
    uiSettings.get$.mockImplementation(() => navGroupEnabled$);

    const chromeNavGroupService = new ChromeNavGroupService();
    const chromeNavGroupServiceSetup = chromeNavGroupService.setup({ uiSettings });

    chromeNavGroupServiceSetup.addNavLinksToGroup(
      {
        id: 'foo-group',
        title: 'fooGroupTitle',
        description: 'foo description',
      },
      [mockedNavLinkFoo]
    );

    chromeNavGroupServiceSetup.addNavLinksToGroup(
      {
        id: 'bar-group',
        title: 'barGroupTitle',
        description: 'bar description',
      },
      [mockedNavLinkFoo, mockedNavLinkBar]
    );

    const chromeNavGroupServiceStart = await chromeNavGroupService.start({
      navLinks: mockedNavLinkService,
      application: mockedApplicationService,
      breadcrumbsEnricher$: new Rx.BehaviorSubject<ChromeBreadcrumbEnricher | undefined>(undefined),
      workspaces: workspacesServiceMock.createStartContract(),
    });

    mockedApplicationService.navigateToApp(mockedNavLinkFoo.id);
    let currentNavGroup = await chromeNavGroupServiceStart
      .getCurrentNavGroup$()
      .pipe(first())
      .toPromise();

    expect(currentNavGroup).toBeFalsy();

    // reset
    chromeNavGroupServiceStart.setCurrentNavGroup(undefined);

    mockedApplicationService.navigateToApp(mockedNavLinkBar.id);

    currentNavGroup = await chromeNavGroupServiceStart
      .getCurrentNavGroup$()
      .pipe(first())
      .toPromise();

    expect(currentNavGroup?.id).toEqual('bar-group');
    expect(currentNavGroup?.title).toEqual('barGroupTitle');
  });

  it('should be able to find the right nav group when visible nav group length is 1 and is not all nav group', async () => {
    const uiSettings = uiSettingsServiceMock.createSetupContract();
    const navGroupEnabled$ = new Rx.BehaviorSubject(true);
    uiSettings.get$.mockImplementation(() => navGroupEnabled$);

    const chromeNavGroupService = new ChromeNavGroupService();
    const chromeNavGroupServiceSetup = chromeNavGroupService.setup({ uiSettings });

    chromeNavGroupServiceSetup.addNavLinksToGroup(
      {
        id: 'foo',
        title: 'fooGroupTitle',
        description: 'foo description',
      },
      [mockedNavLinkFoo]
    );

    const chromeNavGroupServiceStart = await chromeNavGroupService.start({
      navLinks: mockedNavLinkService,
      application: mockedApplicationService,
      breadcrumbsEnricher$: new Rx.BehaviorSubject<ChromeBreadcrumbEnricher | undefined>(undefined),
      workspaces: workspacesServiceMock.createStartContract(),
    });
    mockedApplicationService.navigateToApp(mockedNavLinkFoo.id);

    const currentNavGroup = await chromeNavGroupServiceStart
      .getCurrentNavGroup$()
      .pipe(first())
      .toPromise();

    expect(currentNavGroup?.id).toEqual('foo');
  });

  it('should erase current nav group if application can not be found in any of the visible nav groups', async () => {
    const uiSettings = uiSettingsServiceMock.createSetupContract();
    const navGroupEnabled$ = new Rx.BehaviorSubject(true);
    uiSettings.get$.mockImplementation(() => navGroupEnabled$);

    const chromeNavGroupService = new ChromeNavGroupService();
    const chromeNavGroupServiceSetup = chromeNavGroupService.setup({ uiSettings });

    chromeNavGroupServiceSetup.addNavLinksToGroup(
      {
        id: 'foo-group',
        title: 'fooGroupTitle',
        description: 'foo description',
      },
      [mockedNavLinkFoo]
    );

    chromeNavGroupServiceSetup.addNavLinksToGroup(
      {
        id: 'bar-group',
        title: 'barGroupTitle',
        description: 'bar description',
        status: NavGroupStatus.Hidden,
      },
      [mockedNavLinkFoo, mockedNavLinkBar]
    );

    const chromeNavGroupServiceStart = await chromeNavGroupService.start({
      navLinks: mockedNavLinkService,
      application: mockedApplicationService,
      breadcrumbsEnricher$: new Rx.BehaviorSubject<ChromeBreadcrumbEnricher | undefined>(undefined),
      workspaces: workspacesServiceMock.createStartContract(),
    });

    chromeNavGroupServiceStart.setCurrentNavGroup('foo-group');

    mockedApplicationService.navigateToApp(mockedNavLinkBar.id);
    const currentNavGroup = await chromeNavGroupServiceStart
      .getCurrentNavGroup$()
      .pipe(first())
      .toPromise();

    expect(currentNavGroup).toBeFalsy();
  });

  it('should erase current nav group if application can only be found in use case but outside workspace', async () => {
    const uiSettings = uiSettingsServiceMock.createSetupContract();
    const navGroupEnabled$ = new Rx.BehaviorSubject(true);
    uiSettings.get$.mockImplementation(() => navGroupEnabled$);

    const chromeNavGroupService = new ChromeNavGroupService();
    const chromeNavGroupServiceSetup = chromeNavGroupService.setup({ uiSettings });

    chromeNavGroupServiceSetup.addNavLinksToGroup(
      {
        id: 'foo-group',
        title: 'fooGroupTitle',
        description: 'foo description',
      },
      [mockedNavLinkFoo]
    );

    chromeNavGroupServiceSetup.addNavLinksToGroup(
      {
        id: 'bar-group',
        title: 'barGroupTitle',
        description: 'bar description',
      },
      [mockedNavLinkFoo, mockedNavLinkBar]
    );

    const chromeNavGroupServiceStart = await chromeNavGroupService.start({
      navLinks: mockedNavLinkService,
      application: {
        ...mockedApplicationService,
        capabilities: Object.freeze({
          ...mockedApplicationService.capabilities,
          workspaces: {
            ...mockedApplicationService.capabilities.workspaces,
            enabled: true,
          },
        }),
      },
      breadcrumbsEnricher$: new Rx.BehaviorSubject<ChromeBreadcrumbEnricher | undefined>(undefined),
      workspaces: workspacesServiceMock.createStartContract(),
    });

    chromeNavGroupServiceStart.setCurrentNavGroup('foo-group');

    mockedApplicationService.navigateToApp(mockedNavLinkBar.id);
    const currentNavGroup = await chromeNavGroupServiceStart
      .getCurrentNavGroup$()
      .pipe(first())
      .toPromise();

    expect(currentNavGroup).toBeFalsy();
  });

  it('should set breadcrumbs enricher when nav group is enabled', async () => {
    const uiSettings = uiSettingsServiceMock.createSetupContract();
    const navGroupEnabled$ = new Rx.BehaviorSubject(true);
    uiSettings.get$.mockImplementation(() => navGroupEnabled$);

    const chromeNavGroupService = new ChromeNavGroupService();
    const chromeNavGroupServiceSetup = chromeNavGroupService.setup({ uiSettings });

    chromeNavGroupServiceSetup.addNavLinksToGroup(
      {
        id: 'foo-group',
        title: 'fooGroupTitle',
        description: 'foo description',
      },
      [mockedNavLinkFoo]
    );

    chromeNavGroupServiceSetup.addNavLinksToGroup(
      {
        id: 'bar-group',
        title: 'barGroupTitle',
        description: 'bar description',
      },
      [mockedNavLinkFoo, mockedNavLinkBar]
    );

    const breadcrumbsEnricher$ = new Rx.BehaviorSubject<ChromeBreadcrumbEnricher | undefined>(
      undefined
    );

    const chromeNavGroupServiceStart = await chromeNavGroupService.start({
      navLinks: mockedNavLinkService,
      application: mockedApplicationService,
      breadcrumbsEnricher$,
      workspaces: mockWorkspaceService,
    });

    chromeNavGroupServiceStart.setCurrentNavGroup('bar-group');

    expect(breadcrumbsEnricher$.getValue()).toBeTruthy();

    const breadcrumbs = [{ text: 'test' }];
    const enrichedBreadcrumbs = breadcrumbsEnricher$.getValue()?.(breadcrumbs);

    // bar-group -> test
    expect(enrichedBreadcrumbs).toHaveLength(2);

    // reset current nav group
    chromeNavGroupServiceStart.setCurrentNavGroup(undefined);
    expect(breadcrumbsEnricher$.getValue()).toBeFalsy();
  });

  it('should NOT set breadcrumbs enricher when in a workspace', async () => {
    const uiSettings = uiSettingsServiceMock.createSetupContract();
    const navGroupEnabled$ = new Rx.BehaviorSubject(true);
    uiSettings.get$.mockImplementation(() => navGroupEnabled$);

    const chromeNavGroupService = new ChromeNavGroupService();
    const chromeNavGroupServiceSetup = chromeNavGroupService.setup({ uiSettings });

    chromeNavGroupServiceSetup.addNavLinksToGroup(
      {
        id: 'foo-group',
        title: 'fooGroupTitle',
        description: 'foo description',
      },
      [mockedNavLinkFoo]
    );

    chromeNavGroupServiceSetup.addNavLinksToGroup(
      {
        id: 'bar-group',
        title: 'barGroupTitle',
        description: 'bar description',
      },
      [mockedNavLinkFoo, mockedNavLinkBar]
    );

    const breadcrumbsEnricher$ = new Rx.BehaviorSubject<ChromeBreadcrumbEnricher | undefined>(
      undefined
    );
    mockWorkspaceService.currentWorkspace$.next({ id: 'test', name: 'test workspace' });

    const chromeNavGroupServiceStart = await chromeNavGroupService.start({
      navLinks: mockedNavLinkService,
      application: mockedApplicationService,
      breadcrumbsEnricher$,
      workspaces: mockWorkspaceService,
    });

    chromeNavGroupServiceStart.setCurrentNavGroup('bar-group');

    expect(breadcrumbsEnricher$.getValue()).toBeFalsy();
  });
});

describe('nav group updater', () => {
  it('should emit updated nav group after nav group updater called', async () => {
    const navGroup = new ChromeNavGroupService();
    const uiSettings = uiSettingsServiceMock.createSetupContract();
    uiSettings.get$.mockImplementation(() => new Rx.BehaviorSubject(true));

    const navGroupSetup = navGroup.setup({ uiSettings });
    navGroupSetup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.dataAdministration, [
      {
        id: 'foo',
      },
    ]);
    const navGroupStart = await navGroup.start({
      navLinks: mockedNavLinkService,
      application: mockedApplicationService,
      breadcrumbsEnricher$: new Rx.BehaviorSubject<ChromeBreadcrumbEnricher | undefined>(undefined),
      workspaces: workspacesServiceMock.createStartContract(),
    });

    expect(await navGroupStart.getNavGroupsMap$().pipe(first()).toPromise()).toEqual({
      dataAdministration: expect.not.objectContaining({
        status: expect.anything,
      }),
    });
    navGroupSetup.registerNavGroupUpdater(
      new Rx.BehaviorSubject(() => ({
        status: 2,
      }))
    );
    expect(await navGroupStart.getNavGroupsMap$().pipe(first()).toPromise()).toEqual({
      dataAdministration: expect.objectContaining({
        status: 2,
      }),
    });
  });

  it('should reset to original status after nav group updater unregister', async () => {
    const navGroup = new ChromeNavGroupService();
    const uiSettings = uiSettingsServiceMock.createSetupContract();
    uiSettings.get$.mockImplementation(() => new Rx.BehaviorSubject(true));

    const navGroupSetup = navGroup.setup({ uiSettings });
    navGroupSetup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.dataAdministration, [
      {
        id: 'foo',
      },
    ]);
    const appUpdater$ = new Rx.BehaviorSubject(() => ({
      status: 2,
    }));
    const unregister = navGroupSetup.registerNavGroupUpdater(appUpdater$);
    const navGroupStart = await navGroup.start({
      navLinks: mockedNavLinkService,
      application: mockedApplicationService,
      breadcrumbsEnricher$: new Rx.BehaviorSubject<ChromeBreadcrumbEnricher | undefined>(undefined),
      workspaces: workspacesServiceMock.createStartContract(),
    });
    expect(await navGroupStart.getNavGroupsMap$().pipe(first()).toPromise()).toEqual({
      dataAdministration: expect.objectContaining({
        status: 2,
      }),
    });

    unregister();

    expect(await navGroupStart.getNavGroupsMap$().pipe(first()).toPromise()).toEqual({
      dataAdministration: expect.not.objectContaining({
        status: expect.anything,
      }),
    });
  });
});
