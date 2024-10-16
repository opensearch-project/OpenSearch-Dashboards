/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
process.env.DEBUG_PRINT_LIMIT = 100000;

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { coreMock } from '../../../../../core/public/mocks';
import { WorkspaceCollaborators } from './workspace_collaborators';
import { OpenSearchDashboardsContextProvider } from '../../../../../plugins/opensearch_dashboards_react/public';
import { of } from 'rxjs';
import ReactDOM from 'react-dom';
import { fireEvent } from '@testing-library/react';
const workspaceClientUpdateMock = jest.fn();
const coreStartMock = coreMock.createStart();

const mockOverlays = coreStartMock.overlays;

const setup = ({ permissionEnabled = true }: { permissionEnabled?: boolean }) => {
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
      update: workspaceClientUpdateMock,
    },
    navigationUI: {
      HeaderControl: () => null,
    },
    collaboratorTypes: {
      getTypes$: () => of([]),
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
  });
});
