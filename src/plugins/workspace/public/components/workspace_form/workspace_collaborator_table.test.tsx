/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { act, fireEvent, render, waitFor, within } from '@testing-library/react';
import { WorkspaceCollaboratorTable, getDisplayedType } from './workspace_collaborator_table';
import { createOpenSearchDashboardsReactContext } from '../../../../opensearch_dashboards_react/public';
import { coreMock } from '../../../../../core/public/mocks';
import { WorkspacePermissionItemType } from './constants';
import { IWorkspaceResponse, WorkspacePermissionMode } from 'opensearch-dashboards/public';
import { WorkspaceCollaboratorType } from '../../services';
import { WorkspaceCollaboratorPermissionType } from '../../types';

const mockCoreStart = coreMock.createStart();
const displayedCollaboratorTypes: WorkspaceCollaboratorType[] = [
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
        permissionType: 'unknown' as WorkspaceCollaboratorPermissionType,
        collaboratorId: 'unknown',
        accessLevel: 'readOnly',
      })
    ).toBeUndefined();
  });
  it('should return "User"', () => {
    expect(
      getDisplayedType(displayedCollaboratorTypes, {
        collaboratorId: 'foo',
        permissionType: WorkspacePermissionItemType.User,
        accessLevel: 'readOnly',
      })
    ).toEqual('User');
  });
  it('should return "Group"', () => {
    expect(
      getDisplayedType(displayedCollaboratorTypes, {
        collaboratorId: 'foo',
        permissionType: WorkspacePermissionItemType.Group,
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
        modes: [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Write],
        type: WorkspacePermissionItemType.User,
        userId: 'admin',
      },
      {
        id: 1,
        modes: [WorkspacePermissionMode.Read, WorkspacePermissionMode.LibraryRead],
        type: WorkspacePermissionItemType.Group,
        group: 'group',
      },
      {
        id: 2,
        modes: [WorkspacePermissionMode.Read, WorkspacePermissionMode.LibraryRead],
        type: WorkspacePermissionItemType.Group,
      },
    ],
    handleSubmitPermissionSettings: jest.fn(),
  };

  it('should render normally', () => {
    expect(render(<WorkspaceCollaboratorTable {...mockProps} />)).toMatchSnapshot();
  });

  it('should render Name column header', () => {
    const { getAllByText } = render(<WorkspaceCollaboratorTable {...mockProps} />);
    expect(getAllByText('Name').length).toBeGreaterThan(0);
  });

  it('should fetch names when displayedCollaboratorTypes have identitySource', async () => {
    const httpPostMock = mockCoreStart.http.post as jest.Mock;
    httpPostMock.mockResolvedValue([
      { id: 'admin', name: 'Admin User' },
      { id: 'group', name: 'Dev Group' },
    ]);

    const typesWithIdentitySource: WorkspaceCollaboratorType[] = [
      {
        id: 'user',
        name: 'User',
        buttonLabel: 'Add Users',
        onAdd: async () => {},
        getDisplayedType: ({ permissionType }) => (permissionType === 'user' ? 'User' : undefined),
        identitySource: { source: 'LDAP', type: 'user' },
      },
      {
        id: 'group',
        name: 'Group',
        buttonLabel: 'Add Groups',
        onAdd: async () => {},
        getDisplayedType: ({ permissionType }) =>
          permissionType === 'group' ? 'Group' : undefined,
        identitySource: { source: 'LDAP', type: 'group' },
      },
    ];

    const { getByText } = render(
      <Provider>
        <WorkspaceCollaboratorTable
          {...mockProps}
          displayedCollaboratorTypes={typesWithIdentitySource}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(httpPostMock).toHaveBeenCalledWith('/api/security/identity/_entries', {
        body: expect.any(String),
        signal: expect.any(AbortSignal),
      });
    });

    await waitFor(() => {
      expect(getByText('Admin User')).toBeInTheDocument();
      expect(getByText('Dev Group')).toBeInTheDocument();
    });
  });

  it('should show dash when name is not available', () => {
    const { container } = render(<WorkspaceCollaboratorTable {...mockProps} />);
    // Without identitySource, no fetch happens, name column shows mdash
    const nameCells = container.querySelectorAll('td:nth-child(3)');
    expect(nameCells.length).toBeGreaterThan(0);
  });

  it('should render empty state when no permission settings', () => {
    const permissionSettings: any[] = [];

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
        modes: [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Write],
        type: WorkspacePermissionItemType.User,
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
        modes: [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Write],
        type: WorkspacePermissionItemType.User,
        userId: 'admin',
      },
    ];
    const handleSubmitPermissionSettingsMock = () =>
      new Promise<IWorkspaceResponse<boolean>>((resolve) => {
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

    // Store the unmount function returned by the mount point
    let unmountModal: (() => void) | undefined;
    mockOverlays.openModal.mockReturnValue({
      onClose: Promise.resolve(),
      close: async () => {
        unmountModal?.();
      },
    });
    const action = getByTestId('workspace-detail-collaborator-table-actions-box');
    fireEvent.click(action);
    const deleteCollaborator = getByText('Delete collaborator');
    fireEvent.click(deleteCollaborator);

    const modalContainer = getByTestId('confirm-modal-container');
    // Call the mount function and store its returned unmount function
    // Wrap in act() to handle React 18 state updates during modal mount
    await act(async () => {
      unmountModal = mockOverlays.openModal.mock.calls[0][0](modalContainer);
    });
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
        modes: [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Write],
        type: WorkspacePermissionItemType.User,
        userId: 'admin',
      },
      {
        id: 1,
        modes: [WorkspacePermissionMode.Read, WorkspacePermissionMode.LibraryRead],
        type: WorkspacePermissionItemType.Group,
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
        modes: [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Write],
        type: WorkspacePermissionItemType.User,
        userId: 'admin',
      },
      {
        id: 1,
        modes: [WorkspacePermissionMode.Read, WorkspacePermissionMode.LibraryRead],
        type: WorkspacePermissionItemType.Group,
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
        modes: [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Write],
        type: WorkspacePermissionItemType.User,
        userId: 'admin',
      },
      {
        id: 1,
        modes: [WorkspacePermissionMode.LibraryRead, WorkspacePermissionMode.Read],
        type: WorkspacePermissionItemType.Group,
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

    // Store the unmount function returned by the mount point
    let unmountModal: (() => void) | undefined;
    mockOverlays.openModal.mockReturnValue({
      onClose: Promise.resolve(),
      close: async () => {
        unmountModal?.();
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
    const modalContainer = getByTestId('modal-container');
    // Call the mount function and store its returned unmount function
    // Wrap in act() to handle React 18 state updates during modal mount
    await act(async () => {
      unmountModal = mockOverlays.openModal.mock.calls[0][0](modalContainer);
    });
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
        {
          id: 0,
          modes: [WorkspacePermissionMode.LibraryRead, WorkspacePermissionMode.Read],
          type: 'user',
          userId: 'admin',
        },
        {
          group: 'group',
          id: 1,
          modes: [WorkspacePermissionMode.LibraryRead, WorkspacePermissionMode.Read],
          type: 'group',
        },
      ]);
    });
    jest.runAllTimers();
    jest.useRealTimers();
  });

  it('should disable change access level confirm button when submitting', async () => {
    const permissionSettings = [
      {
        id: 0,
        modes: [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Write],
        type: WorkspacePermissionItemType.User,
        userId: 'admin',
      },
    ];
    const handleSubmitPermissionSettingsMock = () =>
      new Promise<IWorkspaceResponse<boolean>>((resolve) => {
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
    // Store the unmount function returned by the mount point
    let unmountModal: (() => void) | undefined;
    mockOverlays.openModal.mockReturnValue({
      onClose: Promise.resolve(),
      close: async () => {
        unmountModal?.();
      },
    });
    const action = getByTestId('workspace-detail-collaborator-table-actions-box');
    fireEvent.click(action);
    fireEvent.click(getByText('Change access level'));
    await waitFor(() => {
      fireEvent.click(within(getByRole('dialog')).getByText('Read only'));
    });

    const modalContainer = getByTestId('confirm-modal-container');
    // Call the mount function and store its returned unmount function
    // Wrap in act() to handle React 18 state updates during modal mount
    await act(async () => {
      unmountModal = mockOverlays.openModal.mock.calls[0][0](modalContainer);
    });
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
