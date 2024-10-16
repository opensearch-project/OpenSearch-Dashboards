/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { coreMock } from '../../../../../core/public/mocks';
import { WorkspaceCollaborators } from './workspace_collaborators';
import { OpenSearchDashboardsContextProvider } from '../../../../../plugins/opensearch_dashboards_react/public';
import { of } from 'rxjs';
import ReactDOM from 'react-dom';
import { fireEvent } from '@testing-library/react';
import { WorkspaceCollaboratorPermissionType } from '../../types';

const workspaceClientUpdateMock = jest.fn();
const addDangerMock = jest.fn();
const coreStartMock = coreMock.createStart();

const mockOverlays = coreStartMock.overlays;

const setup = ({
  permissionEnabled = true,
  workspaceClientUpdate = workspaceClientUpdateMock,
}: {
  permissionEnabled?: boolean;
  workspaceClientUpdate?: jest.Mock;
}) => {
  const collaboratorTypes: WorkspaceCollaboratorPermissionType[] = [];
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
      currentWorkspace$: of({
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
      }),
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
    mockOverlays.openModal.mockReturnValue({
      onClose: Promise.resolve(),
      close: async () => {
        ReactDOM.unmountComponentAtNode(renderResult.getByTestId('confirm-modal-container'));
      },
    });

    fireEvent.click(renderResult.getByTestId('checkboxSelectRow-0'));
    const deleteCollaborator = renderResult.getByText('Delete 1 collaborator');
    fireEvent.click(deleteCollaborator);
    expect(mockOverlays.openModal).toHaveBeenCalled();
    mockOverlays.openModal.mock.calls[0][0](renderResult.getByTestId('confirm-modal-container'));
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
    mockOverlays.openModal.mock.calls[0][0](renderResult.getByTestId('confirm-modal-container'));
    const modal = renderResult.queryByTestId('confirm-modal-container');
    if (modal) {
      ReactDOM.unmountComponentAtNode(modal);
    }
  });

  it('should call notification add danger if update is failed', async () => {
    const workspaceClientUpdate = jest.fn().mockRejectedValue('error');
    const { renderResult } = setup({ permissionEnabled: true, workspaceClientUpdate });
    mockOverlays.openModal.mockReturnValue({
      onClose: Promise.resolve(),
      close: async () => {
        ReactDOM.unmountComponentAtNode(renderResult.getByTestId('confirm-modal-container'));
      },
    });

    fireEvent.click(renderResult.getByTestId('checkboxSelectRow-0'));
    const deleteCollaborator = renderResult.getByText('Delete 1 collaborator');
    fireEvent.click(deleteCollaborator);
    expect(mockOverlays.openModal).toHaveBeenCalled();
    mockOverlays.openModal.mock.calls[0][0](renderResult.getByTestId('confirm-modal-container'));
    await waitFor(() => {
      expect(renderResult.getByText('Confirm')).toBeInTheDocument();
    });
    jest.useFakeTimers();
    fireEvent.click(renderResult.getByText('Confirm'));
    expect(addDangerMock).toHaveBeenCalled();
  });
});
