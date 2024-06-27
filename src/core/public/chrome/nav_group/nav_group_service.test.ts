/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { first } from 'rxjs/operators';
import { ChromeNavGroupService, ChromeRegistrationNavLink } from './nav_group_service';

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
};

const mockedNavLinkBar: ChromeRegistrationNavLink = {
  id: 'bar',
};

const getSetup = () => new ChromeNavGroupService().setup();

describe('ChromeNavGroupService#setup()', () => {
  it('should be able to `addNavLinksToGroup`', async () => {
    const warnMock = jest.fn();
    jest.spyOn(console, 'warn').mockImplementation(warnMock);
    const chromeNavGroupServiceSetup = getSetup();

    chromeNavGroupServiceSetup.addNavLinksToGroup(mockedGroupFoo, [mockedGroupFoo, mockedGroupBar]);
    chromeNavGroupServiceSetup.addNavLinksToGroup(mockedGroupBar, [mockedGroupBar]);
    const groupsMap = await chromeNavGroupServiceSetup.getNavGroupsMap$().pipe(first()).toPromise();
    expect(groupsMap[mockedGroupFoo.id].navLinks.length).toEqual(2);
    expect(groupsMap[mockedGroupBar.id].navLinks.length).toEqual(1);
    expect(groupsMap[mockedGroupFoo.id].id).toEqual(mockedGroupFoo.id);
    expect(warnMock).toBeCalledTimes(0);
  });

  it('should output warning message if `addNavLinksToGroup` with same group id and navLink id', async () => {
    const warnMock = jest.fn();
    jest.spyOn(console, 'warn').mockImplementation(warnMock);

    const chromeSetup = getSetup();

    chromeSetup.addNavLinksToGroup(mockedGroupFoo, [mockedNavLinkFoo, mockedGroupFoo]);
    chromeSetup.addNavLinksToGroup(mockedGroupBar, [mockedGroupBar]);
    const groupsMap = await chromeSetup.getNavGroupsMap$().pipe(first()).toPromise();
    expect(groupsMap[mockedGroupFoo.id].navLinks.length).toEqual(1);
    expect(groupsMap[mockedGroupBar.id].navLinks.length).toEqual(1);
    expect(warnMock).toBeCalledTimes(1);
    expect(warnMock).toBeCalledWith(
      `[ChromeService] Navlink of ${mockedGroupFoo.id} has already been registered in group ${mockedGroupFoo.id}`
    );
  });
});

describe('ChromeNavGroupService#start()', () => {
  it('should be able to get the groups registered through addNavLinksToGroups', async () => {
    const chromeNavGroupService = new ChromeNavGroupService();
    const chromeSetup = chromeNavGroupService.setup();

    chromeSetup.addNavLinksToGroup(mockedGroupFoo, [mockedNavLinkFoo]);
    chromeSetup.addNavLinksToGroup(mockedGroupBar, [mockedNavLinkBar]);

    const chromeStart = await chromeNavGroupService.start();

    const groupsMap = await chromeStart.getNavGroupsMap$().pipe(first()).toPromise();

    expect(Object.keys(groupsMap).length).toEqual(2);
    expect(groupsMap[mockedGroupFoo.id].navLinks.length).toEqual(1);
    expect(groupsMap[mockedGroupBar.id].navLinks.length).toEqual(1);
  });
});
