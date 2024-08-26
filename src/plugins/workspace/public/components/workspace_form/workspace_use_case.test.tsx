/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { DEFAULT_NAV_GROUPS } from '../../../../../core/public';
import { WorkspaceUseCase, WorkspaceUseCaseProps } from './workspace_use_case';
import { WorkspaceFormErrors } from './types';

const setup = (options?: Partial<WorkspaceUseCaseProps>) => {
  const onChangeMock = jest.fn();
  const formErrors: WorkspaceFormErrors = {};
  const renderResult = render(
    <WorkspaceUseCase
      availableUseCases={[
        { ...DEFAULT_NAV_GROUPS.observability, features: [] },
        { ...DEFAULT_NAV_GROUPS['security-analytics'], features: [] },
        { ...DEFAULT_NAV_GROUPS.essentials, features: [] },
        { ...DEFAULT_NAV_GROUPS.search, features: [] },
        {
          id: 'system-use-case',
          title: 'System use case',
          description: 'System use case description',
          systematic: true,
          features: [],
        },
      ]}
      value=""
      onChange={onChangeMock}
      formErrors={formErrors}
      {...options}
    />
  );
  return {
    renderResult,
    onChangeMock,
  };
};

describe('WorkspaceUseCase', () => {
  it('should render passed use cases', () => {
    const { renderResult } = setup();

    expect(renderResult.getByText('Observability')).toBeInTheDocument();
    expect(renderResult.getByText('Essentials')).toBeInTheDocument();
    expect(renderResult.getByText('Security Analytics')).toBeInTheDocument();
    expect(renderResult.getByText('Search')).toBeInTheDocument();
  });

  it('should call onChange with new checked use case', () => {
    const { renderResult, onChangeMock } = setup();

    expect(onChangeMock).not.toHaveBeenCalled();
    fireEvent.click(renderResult.getByText('Observability'));
    expect(onChangeMock).toHaveBeenLastCalledWith('observability');
  });

  it('should not call onChange after checked use case clicked', () => {
    const { renderResult, onChangeMock } = setup({ value: 'observability' });

    expect(onChangeMock).not.toHaveBeenCalled();
    fireEvent.click(renderResult.getByText('Observability'));
    expect(onChangeMock).not.toHaveBeenCalled();
  });

  it('should render disabled essential use case card', async () => {
    const { renderResult } = setup({
      availableUseCases: [
        {
          ...DEFAULT_NAV_GROUPS.essentials,
          features: [],
          disabled: true,
        },
      ],
    });
    await waitFor(() => {
      expect(renderResult.getByText('Essentials')).toHaveClass(
        'euiCheckableCard__label-isDisabled'
      );
    });
  });

  it('should be able to toggle use case features', async () => {
    const { renderResult } = setup({
      availableUseCases: [
        {
          ...DEFAULT_NAV_GROUPS.observability,
          features: [
            { id: 'feature1', title: 'Feature 1' },
            { id: 'feature2', title: 'Feature 2' },
          ],
        },
      ],
    });
    await waitFor(() => {
      expect(renderResult.getByText('See more....')).toBeInTheDocument();
      expect(renderResult.queryByText('Feature 1')).toBe(null);
      expect(renderResult.queryByText('Feature 2')).toBe(null);
    });

    fireEvent.click(renderResult.getByText('See more....'));

    await waitFor(() => {
      expect(renderResult.getByText('See less....')).toBeInTheDocument();
      expect(renderResult.getByText('Feature 1')).toBeInTheDocument();
      expect(renderResult.getByText('Feature 2')).toBeInTheDocument();
    });

    fireEvent.click(renderResult.getByText('See less....'));

    await waitFor(() => {
      expect(renderResult.getByText('See more....')).toBeInTheDocument();
      expect(renderResult.queryByText('Feature 1')).toBe(null);
      expect(renderResult.queryByText('Feature 2')).toBe(null);
    });
  });

  it('should show static all use case features', async () => {
    const { renderResult } = setup({
      availableUseCases: [
        {
          ...DEFAULT_NAV_GROUPS.all,
          features: [
            { id: 'feature1', title: 'Feature 1' },
            { id: 'feature2', title: 'Feature 2' },
          ],
        },
      ],
    });

    fireEvent.click(renderResult.getByText('See more....'));

    await waitFor(() => {
      expect(renderResult.getByText('Discover')).toBeInTheDocument();
      expect(renderResult.getByText('Dashboards')).toBeInTheDocument();
      expect(renderResult.getByText('Visualize')).toBeInTheDocument();
      expect(
        renderResult.getByText('Observability services, metrics, traces, and more')
      ).toBeInTheDocument();
      expect(
        renderResult.getByText('Security analytics threat alerts, findings, correlations, and more')
      ).toBeInTheDocument();
      expect(
        renderResult.getByText('Search studio, relevance tuning, vector search, and more')
      ).toBeInTheDocument();
    });
  });
});
