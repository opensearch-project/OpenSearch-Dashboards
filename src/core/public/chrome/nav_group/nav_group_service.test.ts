/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Rx from 'rxjs';
import { first } from 'rxjs/operators';
import { ChromeNavGroupService, ChromeRegistrationNavLink } from './nav_group_service';
import { uiSettingsServiceMock } from '../../ui_settings/ui_settings_service.mock';
import { NavLinksService } from '../nav_links';
import { applicationServiceMock, httpServiceMock } from '../../mocks';
import { AppCategory } from 'opensearch-dashboards/public';

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

describe('ChromeNavGroupService#setup()', () => {
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
    ])
  );
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
    ]);
    chromeNavGroupServiceSetup.addNavLinksToGroup(mockedGroupBar, [mockedNavLinkBar]);

    const chromeStart = await chromeNavGroupService.start({ navLinks: mockedNavLinkService });

    const groupsMap = await chromeStart.getNavGroupsMap$().pipe(first()).toPromise();

    expect(Object.keys(groupsMap).length).toEqual(2);
    expect(groupsMap[mockedGroupFoo.id].navLinks.map((item) => item.id)).toEqual([
      'foo',
      'foo-in-category-foo',
      'bar-in-category-foo',
      'bar',
      'foo-in-category-bar',
      'bar-in-category-bar',
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
    });

    navGroupEnabled$.next(false);
    expect(chromeNavGroupServiceStart.getNavGroupEnabled()).toBe(false);

    chromeNavGroupService.stop();
    navGroupEnabled$.next(true);
    expect(chromeNavGroupServiceStart.getNavGroupEnabled()).toBe(false);
  });
});
