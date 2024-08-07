/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BehaviorSubject, of } from 'rxjs';
import { render, fireEvent, screen } from '@testing-library/react';
import { I18nProvider } from '@osd/i18n/react';
import { coreMock } from '../../../../../core/public/mocks';
import { navigateToWorkspaceDetail } from '../utils/workspace';
import { OpenSearchDashboardsContextProvider } from '../../../../../plugins/opensearch_dashboards_react/public';
import { WORKSPACE_USE_CASES } from '../../../common/constants';
import { WorkspaceList } from './index';

jest.mock('../utils/workspace');

jest.mock('../delete_workspace_modal', () => ({
  DeleteWorkspaceModal: ({ onClose }: { onClose: () => void }) => (
    <div aria-label="mock delete workspace modal">
      <button onClick={onClose} aria-label="mock delete workspace modal button" />
    </div>
  ),
}));

const formatDate = function (dateString: string) {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const date = new Date(dateString);

  const month = months[date.getUTCMonth()];
  const day = String(date.getUTCDate()).padStart(2, '0');
  const year = date.getUTCFullYear();

  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  const milliseconds = String(date.getUTCMilliseconds()).padStart(3, '0');

  return `${month} ${day},${year}@${hours}:${minutes}:${seconds}.${milliseconds}`;
};

function getWrapWorkspaceListInContext(
  workspaceList = [
    {
      id: 'id1',
      name: 'name1',
      features: ['use-case-all'],
      description:
        'should be able to see the description tooltip when hovering over the description',
      lastUpdatedTime: '1999-08-06T02:00:00.00Z',
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

  const services = {
    ...coreStartMock,
    workspaces: {
      workspaceList$: of(workspaceList),
    },
  };

  return (
    <I18nProvider>
      <OpenSearchDashboardsContextProvider services={services}>
        <WorkspaceList
          registeredUseCases$={new BehaviorSubject([WORKSPACE_USE_CASES.observability])}
        />
      </OpenSearchDashboardsContextProvider>
    </I18nProvider>
  );
}

describe('WorkspaceList', () => {
  it('should render title and table normally', () => {
    const { getByText, getByRole, container } = render(
      <WorkspaceList
        registeredUseCases$={new BehaviorSubject([WORKSPACE_USE_CASES.observability])}
      />
    );
    expect(getByText('Workspaces')).toBeInTheDocument();
    expect(getByRole('table')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });
  it('should render data in table based on workspace list data', async () => {
    const { getByText } = render(getWrapWorkspaceListInContext());

    // should display workspace names
    expect(getByText('name1')).toBeInTheDocument();
    expect(getByText('name2')).toBeInTheDocument();

    // should display use case
    expect(getByText('All use case')).toBeInTheDocument();
    expect(getByText('Observability')).toBeInTheDocument();
  });

  it('should be able to see the description tooltip when hovering over the description', async () => {
    const { getByText, getByTestId, queryByTestId } = render(getWrapWorkspaceListInContext());
    const description = getByText(
      'should be able to see the description tooltip when hovering over the description'
    );
    expect(description).toHaveClass('eui-textTruncate');
    fireEvent.mouseEnter(description);
    expect(getByTestId('workspaceList-hover-description')).toBeInTheDocument();

    const tooltip = await queryByTestId('workspaceList-hover-description');
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent(
      'should be able to see the description tooltip when hovering over the description'
    );
    fireEvent.mouseLeave(description);
    expect(queryByTestId('workspaceList-hover-description')).not.toBeInTheDocument();
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

  it('should be able to debounce when ', async () => {
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
    expect(getByText(formatDate('1999-08-06T00:00:00.00Z'))).toBeInTheDocument();
    expect(getByText(formatDate('1999-08-06T01:00:00.00Z'))).toBeInTheDocument();
    expect(getByText(formatDate('1999-08-06T02:00:00.00Z'))).toBeInTheDocument();
  });

  // it('should be able to update workspace after clicking name', async () => {
  //   const { getAllByTestId } = render(getWrapWorkspaceListInContext());
  //   const editIcon = getAllByTestId('workspace-list-edit-icon')[0];
  //   fireEvent.click(editIcon);
  //   expect(navigateToWorkspaceDetail).toBeCalled();
  // });

  it('should be able to see the 3 operations: copy, update, delete after click in the meatballs button', async () => {
    const { getAllByTestId, getByText } = render(getWrapWorkspaceListInContext());
    const operationIcons = getAllByTestId('euiCollapsedItemActionsButton')[0];
    fireEvent.click(operationIcons);
    expect(getByText('Copy')).toBeInTheDocument();
    expect(getByText('Edit')).toBeInTheDocument();
    expect(getByText('Delete')).toBeInTheDocument();
  });

  it('should be able to update workspace after clicking name', async () => {
    const { getByText, getAllByTestId } = render(getWrapWorkspaceListInContext());
    const operationIcons = getAllByTestId('euiCollapsedItemActionsButton')[0];
    fireEvent.click(operationIcons);
    const editIcon = getByText('Edit');
    fireEvent.click(editIcon);
    expect(navigateToWorkspaceDetail).toBeCalled();
  });

  // it('should be able to copy workspace ID after clicking copy button', async () => {
  //   const { getByText, getAllByTestId } = render(getWrapWorkspaceListInContext());
  //   const operationIcons = getAllByTestId('euiCollapsedItemActionsButton')[0];
  //   fireEvent.click(operationIcons);
  //   const copyIcon = getByText('Copy');
  //   fireEvent.click(copyIcon);
  //   expect(
  //     navigator.clipboard.text
  //   ).toHaveBeenCalledWith('id1');
  // });

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
    const list = [
      {
        id: 'id1',
        name: 'name1',
        features: ['use-case-all'],
        description: '',
        lastUpdatedTime: '2024-08-06T00:00:00.00Z',
      },
      {
        id: 'id2',
        name: 'name2',
        features: ['use-case-observability'],
        description: '',
        lastUpdatedTime: '2024-08-06T00:00:00.00Z',
      },
      {
        id: 'id3',
        name: 'name3',
        features: ['use-case-search'],
        description: '',
        lastUpdatedTime: '2024-08-06T00:00:00.00Z',
      },
      {
        id: 'id4',
        name: 'name4',
        features: ['use-case-all'],
        description: '',
        lastUpdatedTime: '2024-08-06T00:00:00.00Z',
      },
      {
        id: 'id5',
        name: 'name5',
        features: ['use-case-observability'],
        description: '',
        lastUpdatedTime: '2024-08-06T00:00:00.00Z',
      },
      {
        id: 'id6',
        name: 'name6',
        features: ['use-case-search'],
        description: '',
        lastUpdatedTime: '2024-08-06T00:00:00.00Z',
      },
    ];
    const { getByTestId, getByText, queryByText } = render(getWrapWorkspaceListInContext(list));
    expect(getByText('name1')).toBeInTheDocument();
    expect(queryByText('name6')).not.toBeInTheDocument();
    const paginationButton = getByTestId('pagination-button-next');
    fireEvent.click(paginationButton);
    expect(queryByText('name1')).not.toBeInTheDocument();
    expect(getByText('name6')).toBeInTheDocument();
  });

  it('should display create workspace button for dashboard admin', async () => {
    const { getAllByText } = render(getWrapWorkspaceListInContext([], true));
    expect(getAllByText('Create workspace')[0]).toBeInTheDocument();
  });

  it('should hide create workspace button for non dashboard admin', async () => {
    const { queryByText } = render(getWrapWorkspaceListInContext([], false));
    expect(queryByText('Create workspace')).toBeNull();
  });

  // it('should be able to perform filtering when select a desired use case', async () => {
  //   const { getByText, getByRole, queryByText } = render(getWrapWorkspaceListInContext());

  //   // eslint-disable-next-line
  //   console.log(render(getWrapWorkspaceListInContext()));
  //   const filter = getByRole('selectfilters');
  //   fireEvent.change(filter, { target: { value: 'Observability' } });
  //   expect(getByText('name3')).toBeInTheDocument();
  //   expect(queryByText('name1')).not.toBeInTheDocument();
  //   expect(queryByText('name2')).not.toBeInTheDocument();
  // });
});
