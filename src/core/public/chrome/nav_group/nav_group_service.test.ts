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
import { applicationServiceMock, httpServiceMock } from '../../mocks';
import { AppCategory } from 'opensearch-dashboards/public';
import { DEFAULT_NAV_GROUPS } from '../../';

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

  it('should return navGroupEnabled from ui settings', async () => {
    const chromeNavGroupService = new ChromeNavGroupService();
    const uiSettings = uiSettingsServiceMock.createSetupContract();
    uiSettings.get$.mockImplementation(() => new Rx.BehaviorSubject(true));
    chromeNavGroupService.setup({ uiSettings });
    const chromeNavGroupServiceStart = await chromeNavGroupService.start({
      navLinks: mockedNavLinkService,
      application: mockedApplicationService,
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

  it('should reset current nav group if app not belongs to any nav group', async () => {
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
      [{ id: 'foo-app1' }]
    );

    const chromeNavGroupServiceStart = await chromeNavGroupService.start({
      navLinks: mockedNavLinkService,
      application: mockedApplicationService,
    });

    // set an existing nav group id
    chromeNavGroupServiceStart.setCurrentNavGroup('foo');

    expect(sessionStorageMock.getItem(CURRENT_NAV_GROUP_ID)).toEqual('foo');

    let currentNavGroup = await chromeNavGroupServiceStart
      .getCurrentNavGroup$()
      .pipe(first())
      .toPromise();

    expect(currentNavGroup?.id).toEqual('foo');

    // navigate to app don't belongs to any nav group
    mockedApplicationService.navigateToApp('bar-app');

    currentNavGroup = await chromeNavGroupServiceStart
      .getCurrentNavGroup$()
      .pipe(first())
      .toPromise();

    // verify current nav group been reset
    expect(currentNavGroup).toBeFalsy();
    expect(sessionStorageMock.getItem(CURRENT_NAV_GROUP_ID)).toBeFalsy();
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
