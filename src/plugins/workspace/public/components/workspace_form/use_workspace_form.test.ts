/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { applicationServiceMock } from '../../../../../core/public/mocks';
import { PermissionModeId } from '../../../../../core/public';
import {
  optionIdToWorkspacePermissionModesMap,
  WorkspaceOperationType,
  WorkspacePrivacyItemType,
} from './constants';
import { WorkspaceFormSubmitData, WorkspaceFormErrorCode } from './types';
import { useWorkspaceForm } from './use_workspace_form';
import { waitFor } from '@testing-library/dom';

const setup = ({
  defaultValues,
  permissionEnabled = false,
  onSubmit,
}: {
  defaultValues: WorkspaceFormSubmitData;
  permissionEnabled?: boolean;
  onSubmit?: jest.Mock;
}) => {
  const onSubmitMock = onSubmit ?? jest.fn();
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
      defaultValues: {
        id: 'foo',
        name: '~',
      },
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
      defaultValues: {
        name: 'test-workspace-name',
      },
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
  it('should call onSubmit with workspace name and features', async () => {
    const { renderResult, onSubmitMock } = setup({
      defaultValues: {
        id: 'foo',
        name: 'test-workspace-name',
        features: ['use-case-observability'],
      },
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
      defaultValues: {
        id: 'foo',
        name: 'test-workspace-name',
        features: ['use-case-observability'],
      },
    });

    expect(renderResult.result.current.formData.useCase).toBe('observability');
    act(() => {
      renderResult.result.current.handleUseCaseChange('search');
    });
    expect(renderResult.result.current.formData.useCase).toBe('search');
  });

  it('should reset workspace form', () => {
    const { renderResult } = setup({
      defaultValues: {
        id: 'test',
        name: 'current-workspace-name',
        features: ['use-case-observability'],
      },
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

  it('should call setPermissionSettings if onSubmit successfully', async () => {
    const onSubmitMock = jest.fn().mockResolvedValue({ success: true });
    const { renderResult } = setup({
      defaultValues: {
        id: 'test',
        name: 'current-workspace-name',
        features: ['use-case-observability'],
      },
      onSubmit: onSubmitMock,
    });
    act(() => {
      renderResult.result.current.handleSubmitPermissionSettings([]);
    });
    await waitFor(() => {
      expect(renderResult.result.current.formData.permissionSettings).toStrictEqual([]);
    });
  });

  it('should return permissions settings after setPrivacyType called', async () => {
    const onSubmitMock = jest.fn().mockResolvedValue({ success: true });
    const { renderResult } = setup({
      defaultValues: {
        name: 'current-workspace-name',
        features: ['use-case-observability'],
      },
      onSubmit: onSubmitMock,
    });
    act(() => {
      renderResult.result.current.setPrivacyType(WorkspacePrivacyItemType.AnyoneCanEdit);
    });
    await waitFor(() => {
      expect(renderResult.result.current.formData.permissionSettings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'user',
            userId: '*',
            modes: optionIdToWorkspacePermissionModesMap[PermissionModeId.ReadAndWrite],
          }),
        ])
      );
    });

    const oldPermissionSettings = renderResult.result.current.formData.permissionSettings;

    act(() => {
      renderResult.result.current.setPrivacyType(WorkspacePrivacyItemType.AnyoneCanEdit);
    });
    await waitFor(() => {
      expect(renderResult.result.current.formData.permissionSettings).toBe(oldPermissionSettings);
    });
  });
});
