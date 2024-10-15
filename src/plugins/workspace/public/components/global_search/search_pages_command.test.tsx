/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { searchPages } from './search_pages_command';
import { WorkspaceUseCase } from '../../types';
import { BehaviorSubject } from 'rxjs';
import { coreMock } from '../../../../../core/public/mocks';
import { NavGroupItemInMap, WorkspaceObject } from 'opensearch-dashboards/public';

describe('<SearchPagesCommand />', () => {
  const registeredUseCases = new BehaviorSubject([
    {
      id: 'foo',
      title: 'Foo',
      features: [{ id: 'system-feature', title: 'System feature' }],
      systematic: true,
      description: '',
    } as WorkspaceUseCase,
  ]);

  const currentWorkspace: WorkspaceObject = {
    id: 'mock-workspace',
    name: 'mock-workspace',
    features: ['use-case-foo-group'],
  };

  const navGroup: Record<string, NavGroupItemInMap> = {
    'foo-group': {
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
    workspaces: {
      ...mock.workspaces,
      currentWorkspace$: new BehaviorSubject<WorkspaceObject | null>(currentWorkspace),
    },
  };

  const callbackFn = jest.fn();

  it('search return empty result', async () => {
    const searchResult = await searchPages('bar', registeredUseCases, coreStartMock, callbackFn);

    expect(searchResult).toHaveLength(0);
  });

  it('search return matched result', async () => {
    const searchResult = await searchPages('foo', registeredUseCases, coreStartMock, callbackFn);

    expect(searchResult).toHaveLength(2);
  });

  it('search return pages out of workspace', async () => {
    let searchResult = await searchPages('Settings', registeredUseCases, coreStartMock, callbackFn);

    expect(searchResult).toHaveLength(2);

    searchResult = await searchPages(
      'Administration',
      registeredUseCases,
      coreStartMock,
      callbackFn
    );
    expect(searchResult).toHaveLength(2);
  });
});
