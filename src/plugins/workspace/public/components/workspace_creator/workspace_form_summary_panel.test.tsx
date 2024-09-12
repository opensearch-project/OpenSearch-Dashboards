/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  WorkspaceFormSummaryPanel,
  ExpandableTextList,
  FieldSummaryItem,
} from './workspace_form_summary_panel';
import { RightSidebarScrollField } from './utils';
import { WorkspacePermissionItemType } from '../workspace_form';

describe('WorkspaceFormSummaryPanel', () => {
  const formData = {
    features: [],
    useCase: 'useCase1',
    name: 'Test Workspace',
    description: 'This is a test workspace',
    color: '#000000',
    selectedDataSourceConnections: [
      { id: 'data-source-1', name: 'Data Source 1' },
      { id: 'data-source-2', name: 'Data Source 2' },
      { id: 'data-source-3', name: 'Data Source 3' },
    ],
    permissionSettings: [
      { id: 1, type: WorkspacePermissionItemType.User, userId: 'user1' },
      { id: 2, type: WorkspacePermissionItemType.Group, group: 'group1' },
      { id: 3, type: WorkspacePermissionItemType.User, userId: 'user2' },
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

  it('renders summary panel with correct data', () => {
    render(
      <WorkspaceFormSummaryPanel
        formData={formData}
        availableUseCases={availableUseCases}
        permissionEnabled
      />
    );

    expect(screen.getByText('Summary')).toBeInTheDocument();
    expect(screen.getByText('Use Case 1')).toBeInTheDocument();
    expect(screen.getByText('This is Use Case 1')).toBeInTheDocument();
    expect(screen.getByText('Test Workspace')).toBeInTheDocument();
    expect(screen.getByText('This is a test workspace')).toBeInTheDocument();
    expect(screen.getByText('#000000')).toBeInTheDocument();
    expect(screen.getByText('Data Source 1')).toBeInTheDocument();
    expect(screen.getByText('user1')).toBeInTheDocument();
    expect(screen.getByText('group1')).toBeInTheDocument();
    expect(screen.queryByText('user2')).toBeNull();
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

    // Color placeholder
    const colorPlaceholder = screen.getByTestId('workspaceFormRightSideBarSummary-color-Value');
    expect(colorPlaceholder).toHaveTextContent('—');

    // Data sources placeholder
    const dataSourcesPlaceholder = screen.getByTestId(
      'workspaceFormRightSideBarSummary-dataSource-Value'
    );
    expect(dataSourcesPlaceholder).toHaveTextContent('—');

    // Permissions placeholder
    const permissionsPlaceholder = screen.getByTestId(
      'workspaceFormRightSideBarSummary-member-Value'
    );
    expect(permissionsPlaceholder).toHaveTextContent('—');
  });
});

describe('ExpandableTextList', () => {
  it('renders all texts when expanded', () => {
    const texts = ['Text 1', 'Text 2', 'Text 3', 'Text 4'];
    render(<ExpandableTextList texts={texts} collapseDisplayCount={2} />);

    expect(screen.getByText('Text 1')).toBeInTheDocument();
    expect(screen.getByText('Text 2')).toBeInTheDocument();
    expect(screen.queryByText('Text 3')).not.toBeInTheDocument();
    expect(screen.queryByText('Text 4')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Show all'));

    expect(screen.getByText('Text 3')).toBeInTheDocument();
    expect(screen.getByText('Text 4')).toBeInTheDocument();
  });
  it('should not show "Show all" button when all texts can be displayed', () => {
    const texts = ['Text 1', 'Text 2'];
    render(<ExpandableTextList texts={texts} collapseDisplayCount={3} />);

    expect(screen.getByText('Text 1')).toBeInTheDocument();
    expect(screen.getByText('Text 2')).toBeInTheDocument();
    expect(screen.queryByText('Show all')).not.toBeInTheDocument();
  });
});

describe('FieldSummaryItem', () => {
  it('renders title and content correctly', () => {
    render(
      <FieldSummaryItem field={RightSidebarScrollField.Name}>Content for Name</FieldSummaryItem>
    );

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Content for Name')).toBeInTheDocument();
  });

  it('renders placeholder when no content is provided', () => {
    render(<FieldSummaryItem field={RightSidebarScrollField.Name} />);

    expect(screen.getByText('Name')).toBeInTheDocument();
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

    fireEvent.click(screen.getByText('Name'));

    expect(scrollIntoViewMock).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'center',
    });
    window.HTMLElement.prototype.scrollIntoView = originScrollIntoView;
  });
});
