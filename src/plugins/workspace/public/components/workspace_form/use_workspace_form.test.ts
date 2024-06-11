/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, act } from '@testing-library/react-hooks';

import { applicationServiceMock } from '../../../../../core/public/mocks';
import { WorkspaceFormData } from './types';
import { useWorkspaceForm } from './use_workspace_form';

const setup = (defaultValues?: WorkspaceFormData) => {
  const onSubmitMock = jest.fn();
  const renderResult = renderHook(useWorkspaceForm, {
    initialProps: {
      application: applicationServiceMock.createStartContract(),
      defaultValues,
      onSubmit: onSubmitMock,
    },
  });
  return {
    renderResult,
    onSubmitMock,
  };
};

describe('useWorkspaceForm', () => {
  it('should return "Invalid workspace name" and not call onSubmit when invalid name', async () => {
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
        name: 'Invalid workspace name',
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
        features: 'Use case is required. Select a use case.',
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
        features: ['use-case-observability', 'workspace_update', 'workspace_overview'],
      })
    );
  });
});
