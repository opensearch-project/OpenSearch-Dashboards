/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { coreMock } from '../../../../../core/public/mocks';
import { WorkspaceCollaborators } from './workspace_collaborators';
import { OpenSearchDashboardsContextProvider } from '../../../../../plugins/opensearch_dashboards_react/public';
import { of, BehaviorSubject } from 'rxjs';
import { createRoot, Root } from 'react-dom/client';
import { fireEvent } from '@testing-library/react';
import { WorkspaceCollaboratorPermissionType } from '../../types';

const workspaceClientUpdateMock = jest.fn();
const addDangerMock = jest.fn();
const coreStartMock = coreMock.createStart();

const mockOverlays = coreStartMock.overlays;

// Create workspace data outside of setup to ensure stable reference
const workspaceData = {
  id: 'test',
  name: 'current-workspace-name',
  features: ['use-case-observability'],
  permissions: {
    library_write: {
      users: ['admin'],
      groups: ['foo'],
    },
    write: {
      users: ['admin'],
    },
    library_read: {
      users: ['bar'],
    },
    read: {
      users: ['bar'],
      groups: ['foo'],
    },
  },
};

const setup = ({
  permissionEnabled = true,
  workspaceClientUpdate = workspaceClientUpdateMock,
}: {
  permissionEnabled?: boolean;
  workspaceClientUpdate?: jest.Mock;
}) => {
  const collaboratorTypes: WorkspaceCollaboratorPermissionType[] = [];
  // Use BehaviorSubject instead of of() to avoid infinite loops with useObservable in React 18
  const currentWorkspace$ = new BehaviorSubject(permissionEnabled ? workspaceData : null);
  const services = {
    ...coreStartMock,
    application: {
      capabilities: {
        ...coreStartMock.application.capabilities,
        workspaces: {
          ...coreStartMock.application.capabilities.workspaces,
          permissionEnabled,
        },
      },
    },
    workspaces: {
      ...coreStartMock.workspaces,
      currentWorkspace$,
    },
    workspaceClient: {
      update: workspaceClientUpdate,
    },
    navigationUI: {
      HeaderControl: () => null,
    },
    collaboratorTypes: {
      getTypes$: () => of(collaboratorTypes),
    },
    notifications: {
      ...coreStartMock.notifications,
      toasts: {
        ...coreStartMock.notifications.toasts,
        addDanger: addDangerMock,
      },
    },
  };
  const renderResult = render(
    <OpenSearchDashboardsContextProvider services={services}>
      <>
        <WorkspaceCollaborators />
        <div data-test-subj="confirm-modal-container" />
      </>
    </OpenSearchDashboardsContextProvider>
  );
  return {
    renderResult,
  };
};

describe('WorkspaceCollaborators', () => {
  beforeEach(() => {
    mockOverlays.openModal.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });
  it('should return null if currentWorkspace is null', () => {
    const { renderResult } = setup({ permissionEnabled: false });
    expect(renderResult.queryByTestId('workspace-collaborators-panel')).not.toBeInTheDocument();
    expect(renderResult).toMatchSnapshot();
  });

  it('should render normally ', () => {
    const { renderResult } = setup({ permissionEnabled: true });
    expect(renderResult.getByTestId('workspace-collaborators-panel')).toBeInTheDocument();
    expect(renderResult).toMatchSnapshot();
  });

  it('should call workspaceClient.update when handleSubmitPermissionSettings is called', async () => {
    const { renderResult } = setup({ permissionEnabled: true });
    const modalRootRef = { current: undefined as Root | undefined };
    mockOverlays.openModal.mockReturnValue({
      onClose: Promise.resolve(),
      close: async () => {
        modalRootRef.current?.unmount();
      },
    });

    // Wait for table to render with React 18 async updates
    await waitFor(() => {
      expect(renderResult.getByTestId('checkboxSelectRow-0')).toBeInTheDocument();
    });
    fireEvent.click(renderResult.getByTestId('checkboxSelectRow-0'));
    const deleteCollaborator = renderResult.getByText('Delete 1 collaborator');
    fireEvent.click(deleteCollaborator);
    expect(mockOverlays.openModal).toHaveBeenCalled();
    const modalContainer = renderResult.getByTestId('confirm-modal-container');
    modalRootRef.current = createRoot(modalContainer);
    mockOverlays.openModal.mock.calls[0][0](modalContainer);
    await waitFor(() => {
      expect(renderResult.getByText('Confirm')).toBeInTheDocument();
    });
    jest.useFakeTimers();
    fireEvent.click(renderResult.getByText('Confirm'));
    expect(workspaceClientUpdateMock).toHaveBeenCalledWith(
      'test',
      {},
      {
        permissions: {
          library_read: { users: ['bar'] },
          library_write: { groups: ['foo'] },
          read: { groups: ['foo'], users: ['bar'] },
        },
      }
    );
    modalRootRef.current?.unmount();
  });

  it('should call notification add danger if update is failed', async () => {
    const workspaceClientUpdate = jest.fn().mockRejectedValue('error');
    const { renderResult } = setup({ permissionEnabled: true, workspaceClientUpdate });
    const modalRootRef = { current: undefined as Root | undefined };
    mockOverlays.openModal.mockReturnValue({
      onClose: Promise.resolve(),
      close: async () => {
        modalRootRef.current?.unmount();
      },
    });

    // Wait for table to render with React 18 async updates
    await waitFor(() => {
      expect(renderResult.getByTestId('checkboxSelectRow-0')).toBeInTheDocument();
    });
    fireEvent.click(renderResult.getByTestId('checkboxSelectRow-0'));
    const deleteCollaborator = renderResult.getByText('Delete 1 collaborator');
    fireEvent.click(deleteCollaborator);
    expect(mockOverlays.openModal).toHaveBeenCalled();
    const modalContainer = renderResult.getByTestId('confirm-modal-container');
    modalRootRef.current = createRoot(modalContainer);
    mockOverlays.openModal.mock.calls[0][0](modalContainer);
    await waitFor(() => {
      expect(renderResult.getByText('Confirm')).toBeInTheDocument();
    });
    jest.useFakeTimers();
    fireEvent.click(renderResult.getByText('Confirm'));
    expect(addDangerMock).toHaveBeenCalled();
  });
});
