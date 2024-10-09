/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorkspaceFormSummaryPanel, FieldSummaryItem } from './workspace_form_summary_panel';
import { RightSidebarScrollField } from './utils';
import { WorkspacePermissionItemType } from '../workspace_form';
import { applicationServiceMock } from '../../../../../../src/core/public/mocks';
import { DataSourceConnectionType } from '../../../common/types';
import { WorkspacePermissionMode } from '../../../common/constants';

describe('WorkspaceFormSummaryPanel', () => {
  const formData = {
    features: [],
    useCase: 'useCase1',
    name: 'Test Workspace',
    description: 'This is a test workspace',
    color: '#000000',
    selectedDataSourceConnections: [
      {
        id: 'data-source-1',
        name: 'Data Source 1',
        type: '',
        connectionType: DataSourceConnectionType.OpenSearchConnection,
      },
      {
        id: 'data-source-2',
        name: 'Data Source 2',
        type: '',
        connectionType: DataSourceConnectionType.OpenSearchConnection,
      },
      {
        id: 'data-source-3',
        name: 'Data Source 3',
        type: '',
        connectionType: DataSourceConnectionType.OpenSearchConnection,
      },
    ],
    permissionSettings: [
      {
        id: 1,
        type: WorkspacePermissionItemType.User,
        userId: 'user1',
        modes: [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Write],
      },
      {
        id: 2,
        type: WorkspacePermissionItemType.Group,
        group: 'group1',
        modes: [WorkspacePermissionMode.LibraryRead, WorkspacePermissionMode.Read],
      },
      {
        id: 3,
        type: WorkspacePermissionItemType.User,
        userId: 'user2',
        modes: [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Read],
      },
    ],
  };

  const availableUseCases = [
    {
      id: 'useCase1',
      title: 'Use Case 1',
      description: 'This is Use Case 1',
      features: [],
      icon: 'wsAnalytics',
    },
    {
      id: 'useCase2',
      title: 'Use Case 2',
      description: 'This is Use Case 2',
      features: [],
    },
  ];

  const applicationMock = applicationServiceMock.createStartContract();

  it('renders summary panel with correct data', () => {
    render(
      <WorkspaceFormSummaryPanel
        formData={formData}
        availableUseCases={availableUseCases}
        permissionEnabled
        formId="id"
        application={applicationMock}
        isSubmitting={false}
        dataSourceEnabled
      />
    );

    expect(screen.getByText('Summary')).toBeInTheDocument();
    expect(screen.getByText('Workspace name')).toBeInTheDocument();
    expect(screen.getByText('This is a test workspace')).toBeInTheDocument();
    expect(screen.getByText('Test Workspace')).toBeInTheDocument();
    expect(screen.getByText('Use Case 1')).toBeInTheDocument();
    expect(screen.getByText('Data Source 1')).toBeInTheDocument();
    expect(screen.getByText('Data Source 2')).toBeInTheDocument();
    expect(screen.getByText('Data Source 3')).toBeInTheDocument();
    expect(screen.getByText('user1')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('group1')).toBeInTheDocument();
    expect(screen.getByText('Read only')).toBeInTheDocument();
    expect(screen.getByText('+1 more')).toBeInTheDocument();
    expect(screen.queryByText('user2')).toBeNull();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Create workspace')).toBeInTheDocument();
  });

  it('renders placeholders for empty form data', () => {
    render(
      <WorkspaceFormSummaryPanel
        formData={{
          name: '',
          selectedDataSourceConnections: [],
          permissionSettings: [],
          features: [],
          useCase: undefined,
        }}
        availableUseCases={availableUseCases}
        permissionEnabled
        formId="id"
        application={applicationMock}
        isSubmitting={false}
        dataSourceEnabled
      />
    );

    expect(screen.getByText('Summary')).toBeInTheDocument();

    // Use case placeholder
    const useCasePlaceholder = screen.getByTestId('workspaceFormRightSideBarSummary-useCase-Value');
    expect(useCasePlaceholder).toHaveTextContent('—');

    // Name placeholder
    const namePlaceholder = screen.getByTestId('workspaceFormRightSideBarSummary-name-Value');
    expect(namePlaceholder).toHaveTextContent('—');

    // Description placeholder
    const descriptionPlaceholder = screen.getByTestId(
      'workspaceFormRightSideBarSummary-description-Value'
    );
    expect(descriptionPlaceholder).toHaveTextContent('—');

    // Data sources placeholder
    const dataSourcesPlaceholder = screen.getByTestId(
      'workspaceFormRightSideBarSummary-dataSource-Value'
    );
    expect(dataSourcesPlaceholder).toHaveTextContent('—');

    // Permissions placeholder
    const permissionsPlaceholder = screen.getByTestId(
      'workspaceFormRightSideBarSummary-collaborators-Value'
    );
    expect(permissionsPlaceholder).toHaveTextContent('—');
  });

  it('renders all items when expanded and hide some items when click show less', () => {
    render(
      <WorkspaceFormSummaryPanel
        formData={formData}
        availableUseCases={availableUseCases}
        permissionEnabled
        formId="id"
        application={applicationMock}
        isSubmitting={false}
        dataSourceEnabled
      />
    );
    expect(screen.getByText('user1')).toBeInTheDocument();
    expect(screen.getByText('group1')).toBeInTheDocument();
    expect(screen.queryByText('user2')).toBeNull();
    fireEvent.click(screen.getByText('+1 more'));

    expect(screen.getByText('user2')).toBeInTheDocument();
    expect(screen.getByText('Show less')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Show less'));
    expect(screen.queryByText('user2')).toBeNull();
  });

  it('should hide "Data sources" if data source not enabled', () => {
    render(
      <WorkspaceFormSummaryPanel
        formData={formData}
        availableUseCases={availableUseCases}
        permissionEnabled
        formId="id"
        application={applicationMock}
        isSubmitting={false}
        dataSourceEnabled={false}
      />
    );
    expect(screen.queryByText('Data sources')).toBeNull();
  });
});

describe('FieldSummaryItem', () => {
  it('renders title and content correctly', () => {
    render(
      <FieldSummaryItem field={RightSidebarScrollField.Name}>Content for Name</FieldSummaryItem>
    );

    expect(screen.getByText('Workspace name')).toBeInTheDocument();
    expect(screen.getByText('Content for Name')).toBeInTheDocument();
  });

  it('renders placeholder when no content is provided', () => {
    render(<FieldSummaryItem field={RightSidebarScrollField.Name} />);

    expect(screen.getByText('Workspace name')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('scrolls to the corresponding field when title is clicked', () => {
    const originScrollIntoView = window.HTMLElement.prototype.scrollIntoView;
    const scrollIntoViewMock = jest.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

    render(
      <div className="workspaceCreateFormContainer">
        <div data-right-sidebar-scroll="name" />
        <FieldSummaryItem field={RightSidebarScrollField.Name}>Content for Name</FieldSummaryItem>
      </div>
    );

    fireEvent.click(screen.getByText('Workspace name'));

    expect(scrollIntoViewMock).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'center',
    });
    window.HTMLElement.prototype.scrollIntoView = originScrollIntoView;
  });
});
