/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { workspaceSearchPages } from './search_pages_command';
import { WorkspaceUseCase } from '../../types';
import { BehaviorSubject } from 'rxjs';
import { coreMock } from '../../../../../core/public/mocks';
import { ChromeNavLink, NavGroupItemInMap, WorkspaceObject } from 'opensearch-dashboards/public';

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

  const callbackFn = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('search return empty result', async () => {
    const searchResult = await workspaceSearchPages(
      'bar',
      registeredUseCases,
      coreStartMock,
      callbackFn
    );

    expect(searchResult).toHaveLength(0);
  });

  it('search return matched result', async () => {
    const searchResult = await workspaceSearchPages(
      'foo',
      registeredUseCases,
      coreStartMock,
      callbackFn
    );

    expect(searchResult).toHaveLength(2);
  });

  it('search return pages out of workspace', async () => {
    let searchResult = await workspaceSearchPages(
      'Settings',
      registeredUseCases,
      coreStartMock,
      callbackFn
    );

    expect(searchResult).toHaveLength(2);

    searchResult = await workspaceSearchPages(
      'Administration',
      registeredUseCases,
      coreStartMock,
      callbackFn
    );
    expect(searchResult).toHaveLength(2);
  });

  it('search click callback with non system link should navigate correctly', async () => {
    const searchResult = await workspaceSearchPages(
      'foo',
      registeredUseCases,
      coreStartMock,
      callbackFn
    );

    (searchResult[0] as any).props?.onCallback({
      navGroup: {
        type: 'non-system',
      },
      href: 'test-link',
      id: 'test',
    });

    expect(coreStartMock.application.navigateToApp).toBeCalledWith('test');
  });

  it('search click callback with system link should use window assign correctly', async () => {
    const mockAssign = jest.fn();

    Object.defineProperty(window, 'location', {
      value: { assign: mockAssign },
      writable: true,
    });

    const testUrl = 'http://localhost:5601/test';

    const searchResult = await workspaceSearchPages(
      'Settings',
      registeredUseCases,
      coreStartMock,
      callbackFn
    );

    (searchResult[0] as any).props?.onCallback({
      navGroup: {
        type: 'system',
      },
      href: testUrl,
      id: 'test',
    });

    expect(coreStartMock.application.navigateToApp).not.toBeCalled();
    expect(window.location.assign).toBeCalledWith(testUrl);
  });
});
