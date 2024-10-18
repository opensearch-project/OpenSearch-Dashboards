/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import ReactDOM from 'react-dom';
import { WorkspaceCollaboratorTable, getDisplayedType } from './workspace_collaborator_table';
import { createOpenSearchDashboardsReactContext } from '../../../../opensearch_dashboards_react/public';
import { coreMock } from '../../../../../core/public/mocks';

const mockCoreStart = coreMock.createStart();
const displayedCollaboratorTypes = [
  {
    id: 'user',
    name: 'User',
    buttonLabel: 'Add Users',
    onAdd: async () => {},
    getDisplayedType: ({ permissionType }) => (permissionType === 'user' ? 'User' : undefined),
  },
  {
    id: 'group',
    name: 'Group',
    buttonLabel: 'Add Groups',
    onAdd: async () => {},
    getDisplayedType: ({ permissionType }) => (permissionType === 'group' ? 'Group' : undefined),
  },
];

const mockOverlays = mockCoreStart.overlays;

const { Provider } = createOpenSearchDashboardsReactContext(mockCoreStart);

describe('getDisplayedTypes', () => {
  it('should return undefined if not match any collaborator type', () => {
    expect(
      getDisplayedType(displayedCollaboratorTypes, {
        permissionType: 'unknown',
      })
    ).toBeUndefined();
  });
  it('should return "User"', () => {
    expect(
      getDisplayedType(displayedCollaboratorTypes, {
        collaboratorId: 'foo',
        permissionType: 'user',
        accessLevel: 'readOnly',
      })
    ).toEqual('User');
  });
  it('should return "Group"', () => {
    expect(
      getDisplayedType(displayedCollaboratorTypes, {
        collaboratorId: 'foo',
        permissionType: 'group',
        accessLevel: 'readOnly',
      })
    ).toEqual('Group');
  });
});

describe('WorkspaceCollaboratorTable', () => {
  const mockProps = {
    displayedCollaboratorTypes,
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
      {
        id: 2,
        modes: ['library_read', 'read'],
        type: 'unknown',
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

  it('should open change access modal when trying to change access level', async () => {
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
        <>
          <WorkspaceCollaboratorTable {...mockProps} permissionSettings={permissionSettings} />
          <div data-test-subj="change-access-confirm-modal" />
        </>
      </Provider>
    );

    mockOverlays.openModal.mockReturnValue({
      onClose: Promise.resolve(),
      close: async () => {
        ReactDOM.unmountComponentAtNode(getByTestId('change-access-confirm-modal'));
      },
    });

    fireEvent.click(getByTestId('checkboxSelectRow-0'));
    fireEvent.click(getByTestId('checkboxSelectRow-1'));

    const action = getByTestId('workspace-detail-collaborator-table-actions');
    fireEvent.click(action);
    const changeAccessLevel = getByText('Change access level');
    fireEvent.click(changeAccessLevel);
    const changes = getByText('Read only');
    fireEvent.click(changes);
    expect(mockOverlays.openModal).toHaveBeenCalled();
    mockOverlays.openModal.mock.calls[0][0](getByTestId('change-access-confirm-modal'));
    await waitFor(() => {
      expect(getByText('Confirm')).toBeInTheDocument();
      expect(getByText('Change access level')).toBeInTheDocument();
    });
    const modal = getByTestId('change-access-confirm-modal');
    if (modal) {
      ReactDOM.unmountComponentAtNode(modal);
    }
  });

  it('should openModal when clicking one selection delete', async () => {
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

    const { getByText, getByTestId, queryByTestId } = render(
      <Provider>
        <>
          <WorkspaceCollaboratorTable {...mockProps} permissionSettings={permissionSettings} />
          <div data-test-subj="delete-confirm-modal" />
        </>
      </Provider>
    );
    fireEvent.click(getByTestId('checkboxSelectRow-0'));
    const deleteCollaborator = getByText('Delete 1 collaborator');
    fireEvent.click(deleteCollaborator);
    expect(mockOverlays.openModal).toHaveBeenCalled();
    mockOverlays.openModal.mock.calls[0][0](getByTestId('delete-confirm-modal'));
    await waitFor(() => {
      expect(getByText('Confirm')).toBeInTheDocument();
      expect(getByText('Delete collaborator')).toBeInTheDocument();
      expect(getByTestId('delete-confirm-modal-des')).toBeInTheDocument();
    });
    const modal = queryByTestId('delete-confirm-modal');
    if (modal) {
      ReactDOM.unmountComponentAtNode(modal);
    }
  });

  it('should openModal when clicking multi selection delete', async () => {
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

    const { getByText, getByTestId, queryByTestId } = render(
      <Provider>
        <>
          <WorkspaceCollaboratorTable {...mockProps} permissionSettings={permissionSettings} />
          <div data-test-subj="delete-confirm-modal" />
        </>
      </Provider>
    );

    mockOverlays.openModal.mockReturnValue({
      onClose: Promise.resolve(),
      close: async () => {
        ReactDOM.unmountComponentAtNode(getByTestId('delete-confirm-modal'));
      },
    });

    fireEvent.click(getByTestId('checkboxSelectRow-0'));
    fireEvent.click(getByTestId('checkboxSelectRow-1'));
    const deleteCollaborator = getByText('Delete 2 collaborators');
    fireEvent.click(deleteCollaborator);
    expect(mockOverlays.openModal).toHaveBeenCalled();
    mockOverlays.openModal.mock.calls[0][0](getByTestId('delete-confirm-modal'));
    await waitFor(() => {
      expect(getByText('Confirm')).toBeInTheDocument();
      expect(getByText('Delete collaborator')).toBeInTheDocument();
      expect(getByTestId('delete-confirm-modal-des')).toBeInTheDocument();
    });
    const modal = queryByTestId('delete-confirm-modal');
    if (modal) {
      ReactDOM.unmountComponentAtNode(modal);
    }
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
