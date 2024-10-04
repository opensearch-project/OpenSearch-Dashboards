/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, act } from '@testing-library/react-hooks';

import { applicationServiceMock } from '../../../../../core/public/mocks';
import { WorkspacePermissionMode } from '../../../common/constants';
import { WorkspaceOperationType, WorkspacePermissionItemType } from './constants';
import { WorkspaceFormSubmitData, WorkspaceFormErrorCode } from './types';
import { useWorkspaceForm } from './use_workspace_form';

const setup = (defaultValues?: WorkspaceFormSubmitData, permissionEnabled = false) => {
  const onSubmitMock = jest.fn();
  const renderResult = renderHook(useWorkspaceForm, {
    initialProps: {
      application: applicationServiceMock.createStartContract(),
      defaultValues,
      onSubmit: onSubmitMock,
      operationType: WorkspaceOperationType.Create,
      permissionEnabled,
    },
  });
  return {
    renderResult,
    onSubmitMock,
  };
};

describe('useWorkspaceForm', () => {
  it('should return invalid workspace name error and not call onSubmit when invalid name', async () => {
    const { renderResult, onSubmitMock } = setup({
      id: 'foo',
      name: '~',
    });
    expect(renderResult.result.current.formErrors).toEqual({});

    act(() => {
      renderResult.result.current.handleFormSubmit({ preventDefault: jest.fn() });
    });
    expect(renderResult.result.current.formErrors).toEqual(
      expect.objectContaining({
        name: {
          code: WorkspaceFormErrorCode.InvalidWorkspaceName,
          message: 'Name is invalid. Enter a valid name.',
        },
      })
    );
    expect(onSubmitMock).not.toHaveBeenCalled();
  });
  it('should return "Use case is required. Select a use case." and not call onSubmit', async () => {
    const { renderResult, onSubmitMock } = setup({
      id: 'foo',
      name: 'test-workspace-name',
    });
    expect(renderResult.result.current.formErrors).toEqual({});

    act(() => {
      renderResult.result.current.handleFormSubmit({ preventDefault: jest.fn() });
    });
    expect(renderResult.result.current.formErrors).toEqual(
      expect.objectContaining({
        features: {
          code: WorkspaceFormErrorCode.UseCaseMissing,
          message: 'Use case is required. Select a use case.',
        },
      })
    );
    expect(onSubmitMock).not.toHaveBeenCalled();
  });
  it('should return "Add workspace owner." and not call onSubmit', async () => {
    const { renderResult, onSubmitMock } = setup(
      {
        id: 'foo',
        name: 'test-workspace-name',
      },
      true
    );
    expect(renderResult.result.current.formErrors).toEqual({});

    act(() => {
      renderResult.result.current.setPermissionSettings([
        {
          id: 0,
          modes: [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Write],
          type: WorkspacePermissionItemType.User,
        },
        {
          id: 1,
          modes: [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Write],
          type: WorkspacePermissionItemType.Group,
        },
      ]);
    });
    act(() => {
      renderResult.result.current.handleFormSubmit({ preventDefault: jest.fn() });
    });

    expect(renderResult.result.current.formErrors).toEqual(
      expect.objectContaining({
        permissionSettings: {
          overall: {
            code: WorkspaceFormErrorCode.PermissionSettingOwnerMissing,
            message: 'Add a workspace owner.',
          },
        },
      })
    );
    expect(onSubmitMock).not.toHaveBeenCalled();
  });
  it('should call onSubmit with workspace name and features', async () => {
    const { renderResult, onSubmitMock } = setup({
      id: 'foo',
      name: 'test-workspace-name',
      features: ['use-case-observability'],
    });
    expect(renderResult.result.current.formErrors).toEqual({});

    act(() => {
      renderResult.result.current.handleFormSubmit({ preventDefault: jest.fn() });
    });
    expect(onSubmitMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'test-workspace-name',
        features: ['use-case-observability'],
      })
    );
  });
  it('should update selected use case', () => {
    const { renderResult } = setup({
      id: 'foo',
      name: 'test-workspace-name',
      features: ['use-case-observability'],
    });

    expect(renderResult.result.current.formData.useCase).toBe('observability');
    act(() => {
      renderResult.result.current.handleUseCaseChange('search');
    });
    expect(renderResult.result.current.formData.useCase).toBe('search');
  });

  it('should reset workspace form', () => {
    const { renderResult } = setup({
      id: 'test',
      name: 'current-workspace-name',
      features: ['use-case-observability'],
    });
    expect(renderResult.result.current.formData.name).toBe('current-workspace-name');

    act(() => {
      renderResult.result.current.setName('update-workspace-name');
    });
    expect(renderResult.result.current.formData.name).toBe('update-workspace-name');

    act(() => {
      renderResult.result.current.handleResetForm();
    });
    expect(renderResult.result.current.formData.name).toBe('current-workspace-name');
  });
});
