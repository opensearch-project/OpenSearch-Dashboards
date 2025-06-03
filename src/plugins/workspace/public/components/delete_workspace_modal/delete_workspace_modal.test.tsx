/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DeleteWorkspaceModal, DeleteWorkspaceModalProps } from './delete_workspace_modal';
import { coreMock } from '../../../../../core/public/mocks';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { workspaceClientMock } from '../../../public/workspace_client.mock';
import { OpenSearchDashboardsContextProvider } from '../../../../../plugins/opensearch_dashboards_react/public';

const defaultProps: DeleteWorkspaceModalProps = {
  onClose: jest.fn(),
  selectedWorkspaces: [],
  onDeleteSuccess: jest.fn(),
};

const coreStartMock = coreMock.createStart();

function getWrapWorkspaceDeleteModalInContext(
  props: DeleteWorkspaceModalProps,
  services = { ...coreStartMock }
) {
  return (
    <OpenSearchDashboardsContextProvider services={services}>
      <DeleteWorkspaceModal {...props} />
    </OpenSearchDashboardsContextProvider>
  );
}

describe('DeleteWorkspaceModal', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render normally', async () => {
    const { getByText, baseElement, getByTestId } = render(
      getWrapWorkspaceDeleteModalInContext(defaultProps)
    );
    await screen.findByTestId('delete-workspace-modal-header');
    expect(getByText('Delete workspace')).toBeInTheDocument();
    expect(getByTestId('delete-workspace-modal-header')).toBeInTheDocument();
    expect(getByTestId('delete-workspace-modal-body')).toBeInTheDocument();
    expect(baseElement).toMatchSnapshot();
  });

  it('should emit onClose when clicking cancel button', () => {
    const onClose = jest.fn();
    const newProps = {
      ...defaultProps,
      onClose,
    };
    const { getByTestId } = render(getWrapWorkspaceDeleteModalInContext(newProps));
    expect(onClose).not.toHaveBeenCalled();
    const cancelButton = getByTestId('delete-workspace-modal-cancel-button');
    fireEvent.click(cancelButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should be able to delete workspace and emit onDeleteSuccess', async () => {
    const onCloseFn = jest.fn();
    const onDeleteSuccessFn = jest.fn();
    const newProps = {
      ...defaultProps,
      selectedWorkspaces: [
        {
          id: 'test',
          name: 'test',
        },
      ],
      onClose: onCloseFn,
      onDeleteSuccess: onDeleteSuccessFn,
    };
    const deleteFn = jest.fn().mockReturnValue({
      success: true,
    });
    const newServices = {
      ...coreStartMock,
      workspaceClient: {
        ...workspaceClientMock,
        delete: deleteFn,
      },
    };
    const { getByTestId, findByTestId } = render(
      getWrapWorkspaceDeleteModalInContext(newProps, newServices)
    );
    await findByTestId('delete-workspace-modal-input');
    const input = getByTestId('delete-workspace-modal-input');
    fireEvent.change(input, {
      target: { value: 'delete' },
    });
    const confirmButton = getByTestId('delete-workspace-modal-confirm');
    expect(deleteFn).not.toHaveBeenCalled();
    fireEvent.click(confirmButton);
    expect(deleteFn).toHaveBeenCalledWith('test');
    await waitFor(() => {
      expect(coreStartMock.notifications.toasts.addSuccess).toHaveBeenCalled();
      expect(onCloseFn).toHaveBeenCalled();
      expect(onDeleteSuccessFn).toHaveBeenCalled();
    });
  });

  it('should not call deleteWorkspace modal if passed selectedWorkspace is null', async () => {
    const newProps = {
      ...defaultProps,
      selectedWorkspace: [],
    };
    const deleteFn = jest.fn().mockReturnValue({
      success: true,
    });
    const newServices = {
      ...coreStartMock,
      workspaceClient: {
        ...workspaceClientMock,
        delete: deleteFn,
      },
    };
    const { queryByTestId } = render(getWrapWorkspaceDeleteModalInContext(newProps, newServices));
    const input = queryByTestId('delete-workspace-modal-input');
    expect(input).not.toBeInTheDocument();
  });

  it('should add danger if returned data is unsuccess', async () => {
    const newProps = {
      ...defaultProps,
      selectedWorkspaces: [
        {
          id: 'test',
          name: 'test',
        },
      ],
    };
    const deleteFn = jest.fn().mockReturnValue({
      success: false,
    });
    const newServices = {
      ...coreStartMock,
      workspaceClient: {
        ...workspaceClientMock,
        delete: deleteFn,
      },
    };
    const { getByTestId, findByTestId } = render(
      getWrapWorkspaceDeleteModalInContext(newProps, newServices)
    );
    await findByTestId('delete-workspace-modal-input');
    const input = getByTestId('delete-workspace-modal-input');
    fireEvent.change(input, {
      target: { value: 'delete' },
    });
    const confirmButton = getByTestId('delete-workspace-modal-confirm');
    fireEvent.click(confirmButton);
    expect(deleteFn).toHaveBeenCalledWith('test');
    await waitFor(() => {
      expect(coreStartMock.notifications.toasts.addSuccess).not.toHaveBeenCalled();
      expect(coreStartMock.notifications.toasts.addDanger).toHaveBeenCalled();
    });
  });

  it('confirm button should be disabled if not input delete', async () => {
    const newProps = {
      ...defaultProps,
      selectedWorkspaces: [
        {
          id: 'test',
          name: 'test',
        },
      ],
    };
    const deleteFn = jest.fn().mockReturnValue({
      success: false,
    });
    const newServices = {
      ...coreStartMock,
      workspaceClient: {
        ...workspaceClientMock,
        delete: deleteFn,
      },
    };
    const { getByTestId, findByTestId } = render(
      getWrapWorkspaceDeleteModalInContext(newProps, newServices)
    );
    await findByTestId('delete-workspace-modal-input');
    const input = getByTestId('delete-workspace-modal-input');
    fireEvent.change(input, {
      target: { value: 'delete' },
    });
    const confirmButton = getByTestId('delete-workspace-modal-confirm');
    expect(confirmButton.hasAttribute('disabled'));
  });

  it('should catch error and add danger', async () => {
    const onCloseFn = jest.fn();
    const newProps = {
      ...defaultProps,
      selectedWorkspaces: [
        {
          id: 'test',
          name: 'test',
        },
      ],
      onclose: onCloseFn,
    };
    const deleteFn = jest.fn().mockImplementation(() => {
      throw new Error('error');
    });
    const newServices = {
      ...coreStartMock,
      workspaceClient: {
        ...workspaceClientMock,
        delete: deleteFn,
      },
    };
    const { getByTestId, findByTestId } = render(
      getWrapWorkspaceDeleteModalInContext(newProps, newServices)
    );
    await findByTestId('delete-workspace-modal-input');
    const input = getByTestId('delete-workspace-modal-input');
    fireEvent.change(input, {
      target: { value: 'delete' },
    });
    const confirmButton = getByTestId('delete-workspace-modal-confirm');
    fireEvent.click(confirmButton);
    expect(deleteFn).toHaveBeenCalledWith('test');
    expect(coreStartMock.notifications.toasts.addDanger).toHaveBeenCalled();
  });
});
