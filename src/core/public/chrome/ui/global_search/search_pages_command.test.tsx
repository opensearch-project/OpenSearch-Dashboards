/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { searchPages } from './search_pages_command';
import { BehaviorSubject } from 'rxjs';
import { coreMock } from '../../../../../core/public/mocks';
import { NavGroupType } from 'opensearch-dashboards/public';

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
      type: 'system' as NavGroupType,
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
      type: 'system' as NavGroupType,
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
    application: {
      ...mock.application,
      navigateToApp: jest.fn(),
    },
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

  it('search return empty result if no match', async () => {
    const searchResult = await searchPages(
      'hello',
      coreStartMock.chrome.navGroup,
      coreStartMock.application as any,
      callbackFn
    );

    expect(searchResult).toHaveLength(0);
  });

  it('search handle search callback', async () => {
    const searchResult = await searchPages(
      'data',
      coreStartMock.chrome.navGroup,
      coreStartMock.application as any,
      callbackFn
    );

    (searchResult[0] as any).props?.callback();

    expect(callbackFn).toBeCalledTimes(1);
    expect(coreStartMock.application.navigateToApp).toBeCalledWith('dataAdministration-link1');
  });

  it('renders default breadcrumbs for regular nav groups', async () => {
    const searchResult = await searchPages(
      'foo',
      coreStartMock.chrome.navGroup,
      coreStartMock.application as any,
      callbackFn
    );

    const breadcrumbs = [{ text: 'Some breadcrumb' }];
    const result = (searchResult[0] as any).props.renderBreadcrumbs(breadcrumbs);

    expect(result).toEqual(breadcrumbs);
  });

  it('adds nav group breadcrumb for data administration items', async () => {
    const searchResult = await searchPages(
      'data',
      coreStartMock.chrome.navGroup,
      coreStartMock.application as any,
      callbackFn
    );

    const breadcrumbs = [{ text: 'Some breadcrumb' }];
    const result = (searchResult[0] as any).props.renderBreadcrumbs(breadcrumbs);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      text: expect.any(Object),
    });
    expect(result[1]).toEqual({ text: 'Some breadcrumb' });
  });

  it('adds nav group breadcrumb for settings and setup items', async () => {
    const searchResult = await searchPages(
      'settings',
      coreStartMock.chrome.navGroup,
      coreStartMock.application as any,
      callbackFn
    );

    const breadcrumbs = [{ text: 'Some breadcrumb' }];
    const result = (searchResult[0] as any).props.renderBreadcrumbs(breadcrumbs);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      text: expect.any(Object),
    });
    expect(result[1]).toEqual({ text: 'Some breadcrumb' });
  });
});
