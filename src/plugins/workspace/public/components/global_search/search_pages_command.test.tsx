/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { workspaceSearchPages } from './search_pages_command';
import { WorkspaceUseCase } from '../../types';
import { BehaviorSubject } from 'rxjs';
import { coreMock } from '../../../../../core/public/mocks';
import {
  ChromeNavLink,
  NavGroupItemInMap,
  NavGroupType,
  WorkspaceObject,
} from 'opensearch-dashboards/public';

describe('<workspaceSearchPagesCommand />', () => {
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

  const navGroup: Record<string, NavGroupItemInMap & { navLinks: ChromeNavLink[] }> = {
    'foo-group': {
      id: 'foo-group',
      title: 'Foo Group',
      description: 'Foo Group description',
      navLinks: [
        {
          id: 'foo-group-link1',
          title: 'Foo Group Link 1',
          baseUrl: 'link1',
          href: 'link1',
        },
        {
          id: 'foo-group-link2',
          title: 'Foo Group Link 2',
          baseUrl: 'link2',
          href: 'link2',
        },
        {
          id: 'foo-group-link3',
          title: 'Foo Group Link 3',
          hidden: true,
          baseUrl: 'link3',
          href: 'link3',
        },
      ],
    },
    dataAdministration: {
      id: 'dataAdministration',
      title: 'Data Administration',
      description: 'Data Administration description',
      type: NavGroupType.SYSTEM,
      navLinks: [
        {
          id: 'dataAdministration-link1',
          title: 'Data Administration Link 1',
          baseUrl: 'link1',
          href: 'link1',
        },
        {
          id: 'dataAdministration-link2',
          title: 'Data Administration Link 2',
          baseUrl: 'link2',
          href: 'link2',
        },
      ],
    },
    settingsAndSetup: {
      id: 'settingsAndSetup',
      title: 'Settings and Setup',
      description: 'Settings and Setup description',
      type: NavGroupType.SYSTEM,
      navLinks: [
        {
          id: 'settingsAndSetup-link1',
          title: 'Settings and Setup Link 1',
          baseUrl: 'link1',
          href: 'link1',
        },
        {
          id: 'settingsAndSetup-link2',
          title: 'Settings and Setup Link 2',
          baseUrl: 'link2',
          href: 'link2',
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns no results for an empty query', async () => {
    await expect(workspaceSearchPages('', registeredUseCases, coreStartMock)).resolves.toEqual([]);
  });

  it('search return empty result', async () => {
    const searchResult = await workspaceSearchPages('bar', registeredUseCases, coreStartMock);

    expect(searchResult).toHaveLength(0);
  });

  it('search return matched result', async () => {
    const searchResult = await workspaceSearchPages('foo', registeredUseCases, coreStartMock);

    expect(searchResult).toHaveLength(2);
  });

  it('search return pages out of workspace', async () => {
    let searchResult = await workspaceSearchPages('Settings', registeredUseCases, coreStartMock);

    expect(searchResult).toHaveLength(2);

    searchResult = await workspaceSearchPages('Administration', registeredUseCases, coreStartMock);
    expect(searchResult).toHaveLength(2);
  });

  it('executes workspace page navigation', async () => {
    const searchResult = await workspaceSearchPages('foo', registeredUseCases, coreStartMock);

    searchResult[0].execute();

    expect(coreStartMock.application.navigateToApp).toHaveBeenCalledWith('foo-group-link1');
  });

  it('executes system page navigation with window assign', async () => {
    const assignSpy = jest.spyOn(window.location, 'assign').mockImplementation(jest.fn());

    const searchResult = await workspaceSearchPages('Settings', registeredUseCases, coreStartMock);

    searchResult[0].execute();

    expect(coreStartMock.application.navigateToApp).not.toHaveBeenCalled();
    expect(assignSpy).toHaveBeenCalledWith('http://localhost:5601/link1');

    assignSpy.mockRestore();
  });

  it('removes workspace information from system page URLs while preserving the base path', async () => {
    const assignSpy = jest.spyOn(window.location, 'assign').mockImplementation(jest.fn());

    const originalBasePath = coreStartMock.http.basePath;
    const basePath = '/foo';
    // @ts-expect-error TS2341, TS2540 TODO(ts-error): fixme
    coreStartMock.http.basePath.basePath = basePath;

    const searchResult = await workspaceSearchPages('Settings', registeredUseCases, coreStartMock);

    searchResult[0].execute();

    expect(coreStartMock.application.navigateToApp).not.toHaveBeenCalled();
    expect(assignSpy).toHaveBeenCalledWith(`http://localhost:5601${basePath}/link1`);

    assignSpy.mockRestore();
    // @ts-expect-error TS2341, TS2540 TODO(ts-error): fixme
    coreStartMock.http.basePath.basePath = originalBasePath;
  });
});
