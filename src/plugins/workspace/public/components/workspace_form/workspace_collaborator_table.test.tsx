/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import { WorkspaceCollaboratorTable } from './workspace_collaborator_table';
import { createOpenSearchDashboardsReactContext } from '../../../../opensearch_dashboards_react/public';
import { coreMock } from '../../../../../core/public/mocks';

const mockCoreStart = coreMock.createStart();

const mockOverlays = {
  openModal: jest.fn(),
};

const { Provider } = createOpenSearchDashboardsReactContext({
  ...mockCoreStart,
  overlays: mockOverlays,
});

describe('WorkspaceCollaboratorTable', () => {
  const mockProps = {
    displayedCollaboratorTypes: [],
    permissionSettings: [
      {
        id: 0,
        modes: ['library_write', 'write'],
        type: 'user',
        userId: 'admin',
      },
      {
        id: 1,
        modes: ['library_read', 'read'],
        type: 'group',
        group: 'group',
      },
    ],
    handleSubmitPermissionSettings: jest.fn(),
  };

  it('should render normally', () => {
    expect(render(<WorkspaceCollaboratorTable {...mockProps} />)).toMatchSnapshot();
  });

  it('should render empty state when no permission settings', () => {
    const permissionSettings = [];

    const { getByText } = render(
      <WorkspaceCollaboratorTable {...mockProps} permissionSettings={permissionSettings} />
    );
    expect(getByText('Your workspace doesn’t have any collaborators.')).toBeInTheDocument();
  });

  it('should render data on table based on permission settings', () => {
    const { getByText } = render(<WorkspaceCollaboratorTable {...mockProps} />);
    expect(getByText('admin')).toBeInTheDocument();
    expect(getByText('group')).toBeInTheDocument();
  });

  it('should openModal when clicking box actions menu', () => {
    const permissionSettings = [
      {
        id: 0,
        modes: ['library_write', 'write'],
        type: 'user',
        userId: 'admin',
      },
    ];

    const { getByText, getByTestId } = render(
      <Provider>
        <WorkspaceCollaboratorTable {...mockProps} permissionSettings={permissionSettings} />
      </Provider>
    );
    const action = getByTestId('workspace-detail-collaborator-table-actions-box');
    fireEvent.click(action);
    const deleteCollaborator = getByText('Delete collaborator');
    fireEvent.click(deleteCollaborator);
    expect(mockOverlays.openModal).toHaveBeenCalled();

    const changeAccessLevel = getByText('Change access level');
    fireEvent.click(changeAccessLevel);
    expect(mockOverlays.openModal).toHaveBeenCalled();
  });

  it('should openModal when clicking multi selection delete', () => {
    const permissionSettings = [
      {
        id: 0,
        modes: ['library_write', 'write'],
        type: 'user',
        userId: 'admin',
      },
      {
        id: 1,
        modes: ['library_read', 'read'],
        type: 'group',
        group: 'group',
      },
    ];

    const { getByText, getByTestId } = render(
      <Provider>
        <WorkspaceCollaboratorTable {...mockProps} permissionSettings={permissionSettings} />
      </Provider>
    );
    fireEvent.click(getByTestId('checkboxSelectRow-0'));
    fireEvent.click(getByTestId('checkboxSelectRow-1'));
    const deleteCollaborator = getByText('Delete 2 collaborators');
    fireEvent.click(deleteCollaborator);
    expect(mockOverlays.openModal).toHaveBeenCalled();
  });

  it('should openModal when clicking action tools when multi selection', () => {
    const permissionSettings = [
      {
        id: 0,
        modes: ['library_write', 'write'],
        type: 'user',
        userId: 'admin',
      },
      {
        id: 1,
        modes: ['library_read', 'read'],
        type: 'group',
        group: 'group',
      },
    ];

    const { getByText, getByTestId } = render(
      <Provider>
        <WorkspaceCollaboratorTable {...mockProps} permissionSettings={permissionSettings} />
      </Provider>
    );
    fireEvent.click(getByTestId('checkboxSelectRow-0'));
    fireEvent.click(getByTestId('checkboxSelectRow-1'));
    const actions = getByTestId('workspace-detail-collaborator-table-actions');
    fireEvent.click(actions);
    const changeAccessLevel = getByText('Change access level');
    fireEvent.click(changeAccessLevel);
    expect(mockOverlays.openModal).toHaveBeenCalled();
  });
});
