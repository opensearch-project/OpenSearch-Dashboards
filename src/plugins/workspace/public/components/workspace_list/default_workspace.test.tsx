/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BehaviorSubject } from 'rxjs';
import { render } from '@testing-library/react';
import { I18nProvider } from '@osd/i18n/react';
import { coreMock } from '../../../../../core/public/mocks';
import { createMockedRegisteredUseCases$ } from '../../mocks';
import { UserDefaultWorkspace } from './default_workspace';
import { WorkspaceClient } from '../../workspace_client';
import { WorkspaceObject } from '../../../../../core/public';

jest.mock('../utils/workspace');
jest.mock('../../utils', () => {
  const original = jest.requireActual('../../utils');
  return {
    ...original,
    getDataSourcesList: jest.fn().mockResolvedValue(() => [
      {
        id: 'ds_id1',
        title: 'ds_title1',
        workspaces: 'id1',
      },
      {
        id: 'ds_id2',
        title: 'ds_title2',
        workspaces: 'id1',
      },
      {
        id: 'ds_id3',
        title: 'ds_title3',
        workspaces: 'id1',
      },
    ]),
  };
});

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({
    search: '',
    pathname: '',
    hash: '',
    state: undefined,
  }),
}));

function getWrapUserDefaultWorkspaceList(
  workspaceList = [
    {
      id: 'id1',
      name: 'name1',
      features: ['use-case-all'],
      description:
        'should be able to see the description tooltip when hovering over the description',
      lastUpdatedTime: '1999-08-06T02:00:00.00Z',
      permissions: {
        write: {
          users: ['admin', 'nonadmin'],
        },
      },
    },
    {
      id: 'id2',
      name: 'name2',
      features: ['use-case-observability'],
      description:
        'should be able to see the description tooltip when hovering over the description',
      lastUpdatedTime: '1999-08-06T00:00:00.00Z',
    },
    {
      id: 'id3',
      name: 'name3',
      features: ['use-case-search'],
      description: '',
      lastUpdatedTime: '1999-08-06T01:00:00.00Z',
    },
  ],
  isDashboardAdmin = true
) {
  const coreStartMock = coreMock.createStart();
  const coreSetupMock = coreMock.createSetup();
  coreStartMock.application.capabilities = {
    ...coreStartMock.application.capabilities,
    dashboards: {
      isDashboardAdmin,
    },
  };

  const mockHeaderControl = ({ controls }) => {
    return controls?.[0].description ?? controls?.[0].renderComponent ?? null;
  };

  const workspaceClientMock = new WorkspaceClient(coreSetupMock.http, coreSetupMock.workspaces);

  const services = {
    ...coreStartMock,
    workspaces: {
      ...coreStartMock.workspaces,
      workspaceList$: new BehaviorSubject<WorkspaceObject[]>(workspaceList),
    },
    uiSettings: {
      ...coreStartMock.uiSettings,
      get: jest.fn().mockImplementation((key) => {
        if (key === 'dateFormat') {
          return 'MMM D, YYYY @ HH:mm:ss.SSS';
        }
        return null;
      }),
    },
    navigationUI: {
      HeaderControl: mockHeaderControl,
    },
    workspaceClient: workspaceClientMock,
  };

  return (
    <I18nProvider>
      <UserDefaultWorkspace
        registeredUseCases$={createMockedRegisteredUseCases$()}
        services={services}
      />
    </I18nProvider>
  );
}

describe('UserDefaultWorkspace', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render title and table normally', () => {
    const { getByText, getByRole, container } = render(getWrapUserDefaultWorkspaceList());
    expect(getByText('Workspaces (3)')).toBeInTheDocument();
    expect(getByRole('table')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('should render data in table based on workspace list data', async () => {
    const { getByText, queryByText, queryAllByText } = render(getWrapUserDefaultWorkspaceList());

    // should display workspace names
    expect(getByText('name1')).toBeInTheDocument();
    expect(getByText('name2')).toBeInTheDocument();

    // should display use case
    expect(getByText('Analytics')).toBeInTheDocument();
    expect(getByText('Observability')).toBeInTheDocument();

    // owner column not display
    expect(queryByText('admin')).not.toBeInTheDocument();

    // euiTableRow-isSelectable
    expect(document.querySelectorAll('.euiTableRow-isSelectable').length).toBe(0);

    // action button Set as default in document
    expect(queryAllByText('Set as my default')).toHaveLength(3);
  });
});
