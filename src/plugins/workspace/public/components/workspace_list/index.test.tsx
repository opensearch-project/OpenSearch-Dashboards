/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import moment from 'moment';
import { of } from 'rxjs';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { I18nProvider } from '@osd/i18n/react';
import { coreMock } from '../../../../../core/public/mocks';
import { navigateToWorkspaceDetail } from '../utils/workspace';
import { createMockedRegisteredUseCases$ } from '../../mocks';
import { OpenSearchDashboardsContextProvider } from '../../../../../plugins/opensearch_dashboards_react/public';
import { WorkspaceList } from './index';

jest.mock('../utils/workspace');

const mockNavigatorWrite = jest.fn();

jest.mock('@elastic/eui', () => {
  const original = jest.requireActual('@elastic/eui');
  return {
    ...original,
    copyToClipboard: jest.fn().mockImplementation((id) => {
      mockNavigatorWrite(id);
    }),
  };
});

jest.mock('../delete_workspace_modal', () => ({
  DeleteWorkspaceModal: ({ onClose }: { onClose: () => void }) => (
    <div aria-label="mock delete workspace modal">
      <button onClick={onClose} aria-label="mock delete workspace modal button" />
    </div>
  ),
}));

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

function getWrapWorkspaceListInContext(
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
  coreStartMock.application.capabilities = {
    ...coreStartMock.application.capabilities,
    dashboards: {
      isDashboardAdmin,
    },
  };

  const mockHeaderControl = ({ controls }) => {
    return controls?.[0].description ?? controls?.[0].renderComponent ?? null;
  };

  const services = {
    ...coreStartMock,
    workspaces: {
      workspaceList$: of(workspaceList),
    },
    uiSettings: {
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
  };

  return (
    <I18nProvider>
      <OpenSearchDashboardsContextProvider services={services}>
        <WorkspaceList registeredUseCases$={createMockedRegisteredUseCases$()} />
      </OpenSearchDashboardsContextProvider>
    </I18nProvider>
  );
}

describe('WorkspaceList', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render title and table normally', () => {
    const { getByText, getByRole, container } = render(getWrapWorkspaceListInContext());
    expect(
      getByText('Organize collaborative projects with use-case-specific workspaces.')
    ).toBeInTheDocument();
    expect(getByRole('table')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });
  it('should render data in table based on workspace list data', async () => {
    const { getByText } = render(getWrapWorkspaceListInContext());

    // should display workspace names
    expect(getByText('name1')).toBeInTheDocument();
    expect(getByText('name2')).toBeInTheDocument();

    // should display use case
    expect(getByText('Analytics (All)')).toBeInTheDocument();
    expect(getByText('Observability')).toBeInTheDocument();
  });

  it('should be able to search and re-render the list', async () => {
    const { getByText, getByRole, queryByText } = render(getWrapWorkspaceListInContext());
    const input = getByRole('searchbox');
    fireEvent.change(input, {
      target: { value: 'name2' },
    });
    expect(getByText('name2')).toBeInTheDocument();
    expect(queryByText('name1')).not.toBeInTheDocument();
    expect(queryByText('name3')).not.toBeInTheDocument();
  });

  it('should be able to apply debounce search after input', async () => {
    const { getByText, getByRole, queryByText } = render(getWrapWorkspaceListInContext());
    const input = getByRole('searchbox');
    fireEvent.change(input, {
      target: { value: 'name2' },
    });
    expect(getByText('name2')).toBeInTheDocument();
    expect(queryByText('name1')).not.toBeInTheDocument();
    expect(queryByText('name3')).not.toBeInTheDocument();
  });

  it('should be able to switch workspace after clicking name', async () => {
    const { getByText } = render(getWrapWorkspaceListInContext());
    const nameLink = getByText('name1');
    fireEvent.click(nameLink);
    expect(navigateToWorkspaceDetail).toBeCalled();
  });

  it('should be able to perform the time format transformation', async () => {
    const { getByText } = render(getWrapWorkspaceListInContext());
    expect(
      getByText(moment('1999-08-06T00:00:00.00Z').format('MMM D, YYYY @ HH:mm:ss.SSS'))
    ).toBeInTheDocument();
    expect(
      getByText(moment('1999-08-06T01:00:00.00Z').format('MMM D, YYYY @ HH:mm:ss.SSS'))
    ).toBeInTheDocument();
    expect(
      getByText(moment('1999-08-06T02:00:00.00Z').format('MMM D, YYYY @ HH:mm:ss.SSS'))
    ).toBeInTheDocument();
  });

  it('should be able to see the 3 operations: copy, update, delete after click in the meatballs button', async () => {
    const { getAllByTestId, getByText } = render(getWrapWorkspaceListInContext());
    const operationIcons = getAllByTestId('euiCollapsedItemActionsButton')[0];
    fireEvent.click(operationIcons);
    expect(getByText('Copy ID')).toBeInTheDocument();
    expect(getByText('Edit')).toBeInTheDocument();
    expect(getByText('Delete')).toBeInTheDocument();
  });

  it('should be able to copy workspace ID after clicking copy button', async () => {
    const { getByText, getAllByTestId } = render(getWrapWorkspaceListInContext());
    const operationIcons = getAllByTestId('euiCollapsedItemActionsButton')[0];
    fireEvent.click(operationIcons);
    const copyIcon = getByText('Copy ID');
    fireEvent.click(copyIcon);
    expect(mockNavigatorWrite).toHaveBeenCalledWith('id1');
  });

  it('should be able to update workspace after clicking name', async () => {
    const { getByText, getAllByTestId } = render(getWrapWorkspaceListInContext());
    const operationIcons = getAllByTestId('euiCollapsedItemActionsButton')[0];
    fireEvent.click(operationIcons);
    const editIcon = getByText('Edit');
    fireEvent.click(editIcon);
    expect(navigateToWorkspaceDetail).toBeCalled();
  });

  it('should be able to call delete modal after clicking delete button', async () => {
    const { getByText, getAllByTestId } = render(getWrapWorkspaceListInContext());
    const operationIcons = getAllByTestId('euiCollapsedItemActionsButton')[0];
    fireEvent.click(operationIcons);
    const deleteIcon = getByText('Delete');
    fireEvent.click(deleteIcon);
    expect(screen.queryByLabelText('mock delete workspace modal')).toBeInTheDocument();
    const modalCancelButton = screen.getByLabelText('mock delete workspace modal button');
    fireEvent.click(modalCancelButton);
    expect(screen.queryByLabelText('mock delete workspace modal')).not.toBeInTheDocument();
  });

  it('should be able to pagination when clicking pagination button', async () => {
    const list = [];
    // add 15 items into list
    for (let i = 100; i < 115; i++) {
      list.push({
        id: `id${i}`,
        name: `name${i}`,
        features: ['use-case-all'],
        description: '',
        lastUpdatedTime: '2024-08-06T00:00:00.00Z',
      });
    }
    const { getByTestId, getByText, queryByText } = render(getWrapWorkspaceListInContext(list));
    expect(getByText('name100')).toBeInTheDocument();
    expect(queryByText('name110')).not.toBeInTheDocument();
    const paginationButton = getByTestId('pagination-button-next');
    fireEvent.click(paginationButton);
    expect(queryByText('name100')).not.toBeInTheDocument();
    expect(queryByText('name110')).toBeInTheDocument();
  });

  it('should display create workspace button for dashboard admin', async () => {
    const { getAllByText } = render(getWrapWorkspaceListInContext([], true));
    expect(getAllByText('Create workspace')[0]).toBeInTheDocument();
  });

  it('should hide create workspace button for non dashboard admin', async () => {
    const { queryByText } = render(getWrapWorkspaceListInContext([], false));
    expect(queryByText('Create workspace')).toBeNull();
  });

  it('should render data source badge when more than two data sources', async () => {
    const { getByTestId } = render(getWrapWorkspaceListInContext());
    expect(navigateToWorkspaceDetail).not.toHaveBeenCalled();
    await waitFor(() => {
      const badge = getByTestId('workspaceList-more-dataSources-badge');
      expect(badge).toBeInTheDocument();
      fireEvent.click(badge);
    });
    expect(navigateToWorkspaceDetail).toHaveBeenCalledTimes(1);
  });

  it('should render owners badge when more than one owners', async () => {
    const { getByTestId } = render(getWrapWorkspaceListInContext());
    expect(navigateToWorkspaceDetail).not.toHaveBeenCalled();
    await waitFor(() => {
      const badge = getByTestId('workspaceList-more-collaborators-badge');
      expect(badge).toBeInTheDocument();
      fireEvent.click(badge);
    });
    expect(navigateToWorkspaceDetail).toHaveBeenCalledTimes(1);
  });
});
