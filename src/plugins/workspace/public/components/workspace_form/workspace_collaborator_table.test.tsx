/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render, waitFor, within } from '@testing-library/react';
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
      getDisplayedType(displayedCollaboratorTypes, { permissionType: 'unknown' })
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
  beforeEach(() => {
    mockOverlays.openModal.mockClear();
  });

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

  it('should disable delete confirm button when submitting', async () => {
    const permissionSettings = [
      {
        id: 0,
        modes: ['library_write', 'write'],
        type: 'user',
        userId: 'admin',
      },
    ];
    const handleSubmitPermissionSettingsMock = () =>
      new Promise<void>((resolve) => {
        setTimeout(resolve, 1000);
      });

    const { getByText, getByTestId, queryByText } = render(
      <Provider>
        <>
          <WorkspaceCollaboratorTable
            {...mockProps}
            handleSubmitPermissionSettings={handleSubmitPermissionSettingsMock}
            permissionSettings={permissionSettings}
          />
          <div data-test-subj="confirm-modal-container" />
        </>
      </Provider>
    );

    mockOverlays.openModal.mockReturnValue({
      onClose: Promise.resolve(),
      close: async () => {
        ReactDOM.unmountComponentAtNode(getByTestId('confirm-modal-container'));
      },
    });
    const action = getByTestId('workspace-detail-collaborator-table-actions-box');
    fireEvent.click(action);
    const deleteCollaborator = getByText('Delete collaborator');
    fireEvent.click(deleteCollaborator);

    mockOverlays.openModal.mock.calls[0][0](getByTestId('confirm-modal-container'));
    await waitFor(() => {
      expect(getByText('Confirm')).toBeInTheDocument();
    });
    jest.useFakeTimers();
    fireEvent.click(getByText('Confirm'));
    await waitFor(() => {
      expect(getByText('Confirm').closest('button')).toBeDisabled();
    });
    jest.runAllTimers();
    jest.useRealTimers();
    await waitFor(() => {
      expect(queryByText('Confirm')).toBe(null);
    });
  });

  it('should openModal when clicking one selection delete', () => {
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
    const deleteCollaborator = getByText('Delete 1 collaborator');
    fireEvent.click(deleteCollaborator);
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

  it('should openModal and show warning text when changing last admin to a less permission level', async () => {
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

    const handleSubmitPermissionSettingsMock = jest.fn();

    const { getByText, getByTestId, getByRole } = render(
      <Provider>
        <WorkspaceCollaboratorTable
          {...mockProps}
          permissionSettings={permissionSettings}
          handleSubmitPermissionSettings={handleSubmitPermissionSettingsMock}
        />
        <div data-test-subj="modal-container" />
      </Provider>
    );

    mockOverlays.openModal.mockReturnValue({
      onClose: Promise.resolve(),
      close: async () => {
        ReactDOM.unmountComponentAtNode(getByTestId('modal-container'));
      },
    });

    fireEvent.click(getByTestId('checkboxSelectRow-0'));
    fireEvent.click(getByTestId('checkboxSelectRow-1'));
    const actions = getByTestId('workspace-detail-collaborator-table-actions');
    fireEvent.click(actions);
    fireEvent.click(getByText('Change access level'));
    await waitFor(() => {
      fireEvent.click(within(getByRole('dialog')).getByText('Read only'));
    });
    mockOverlays.openModal.mock.calls[0][0](getByTestId('modal-container'));
    await waitFor(() => {
      expect(getByText('Confirm')).toBeInTheDocument();
    });
    expect(
      getByText(
        'By changing the last administrator to a lesser access, only application administrators will be able to manage this workspace'
      )
    ).toBeInTheDocument();
    jest.useFakeTimers();
    fireEvent.click(getByText('Confirm'));

    await waitFor(() => {
      expect(handleSubmitPermissionSettingsMock).toHaveBeenCalledWith([
        { id: 0, modes: ['library_read', 'read'], type: 'user', userId: 'admin' },
        { group: 'group', id: 1, modes: ['library_read', 'read'], type: 'group' },
      ]);
    });
    jest.runAllTimers();
    jest.useRealTimers();
  });

  it('should disable change access level confirm button when submitting', async () => {
    const permissionSettings = [
      {
        id: 0,
        modes: ['library_write', 'write'],
        type: 'user',
        userId: 'admin',
      },
    ];
    const handleSubmitPermissionSettingsMock = () =>
      new Promise<void>((resolve) => {
        setTimeout(resolve, 1000);
      });

    const { getByText, getByTestId, getByRole } = render(
      <Provider>
        <>
          <WorkspaceCollaboratorTable
            {...mockProps}
            handleSubmitPermissionSettings={handleSubmitPermissionSettingsMock}
            permissionSettings={permissionSettings}
          />
          <div data-test-subj="confirm-modal-container" />
        </>
      </Provider>
    );
    mockOverlays.openModal.mockReturnValue({
      onClose: Promise.resolve(),
      close: async () => {
        ReactDOM.unmountComponentAtNode(getByTestId('confirm-modal-container'));
      },
    });
    const action = getByTestId('workspace-detail-collaborator-table-actions-box');
    fireEvent.click(action);
    fireEvent.click(getByText('Change access level'));
    await waitFor(() => {
      fireEvent.click(within(getByRole('dialog')).getByText('Read only'));
    });

    mockOverlays.openModal.mock.calls[0][0](getByTestId('confirm-modal-container'));
    await waitFor(() => {
      expect(getByText('Confirm')).toBeInTheDocument();
    });
    jest.useFakeTimers();
    fireEvent.click(getByText('Confirm'));
    await waitFor(() => {
      expect(getByText('Confirm').closest('button')).toBeDisabled();
    });
    jest.runAllTimers();
    jest.useRealTimers();
  });
});
