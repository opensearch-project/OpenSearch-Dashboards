/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { searchPages } from './search_pages_command';
import { BehaviorSubject } from 'rxjs';
import { coreMock } from '../../../../../core/public/mocks';

describe('<SearchPagesCommand />', () => {
  const navGroup = {
    all: {
      id: 'foo-group',
      title: 'Foo Group',
      description: 'Foo Group description',
      navLinks: [
        {
          id: 'foo-group-link1',
          title: 'Foo Group Link 1',
        },
        {
          id: 'foo-group-link2',
          title: 'Foo Group Link 2',
        },
        {
          id: 'foo-group-link3',
          title: 'Foo Group Link 3',
          hidden: true,
        },
      ],
    },
    dataAdministration: {
      id: 'dataAdministration',
      title: 'Data Administration',
      description: 'Data Administration description',
      navLinks: [
        {
          id: 'dataAdministration-link1',
          title: 'Data Administration Link 1',
        },
        {
          id: 'dataAdministration-link1',
          title: 'Data Administration Link 2',
        },
      ],
    },
    settingsAndSetup: {
      id: 'settingsAndSetup',
      title: 'Settings and Setup',
      description: 'Settings and Setup description',
      navLinks: [
        {
          id: 'settingsAndSetup-link1',
          title: 'Settings and Setup Link 1',
        },
        {
          id: 'settingsAndSetup-link1',
          title: 'Settings and Setup Link 2',
        },
      ],
    },
  };

  const mock = coreMock.createStart();
  const coreStartMock = {
    ...mock,
    chrome: {
      ...mock.chrome,
      navGroup: {
        ...mock.chrome.navGroup,
        getNavGroupsMap$: () => new BehaviorSubject(navGroup),
      },
    },
    application: {},
  };

  const callbackFn = jest.fn();

  it('search return empty result', async () => {
    const searchResult = await searchPages(
      'bar',
      coreStartMock.chrome.navGroup,
      coreStartMock.application as any,
      callbackFn
    );

    expect(searchResult).toHaveLength(0);
  });

  it('search return matched result', async () => {
    const searchResult = await searchPages(
      'foo',
      coreStartMock.chrome.navGroup,
      coreStartMock.application as any,
      callbackFn
    );

    expect(searchResult).toHaveLength(2);
  });

  it('search return matched data admin result', async () => {
    const searchResult = await searchPages(
      'data',
      coreStartMock.chrome.navGroup,
      coreStartMock.application as any,
      callbackFn
    );

    expect(searchResult).toHaveLength(2);
  });
});
