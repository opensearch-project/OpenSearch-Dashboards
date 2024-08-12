/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { WORKSPACE_USE_CASES } from '../../../common/constants';
import { WorkspaceUseCase, WorkspaceUseCaseProps } from './workspace_use_case';
import { WorkspaceFormErrors } from './types';
import { coreMock } from '../../../../../core/public/mocks';
import { WorkspaceOperationType } from './constants';
import { getIsOnlyAllowEssentialUseCase } from '../../utils';

jest.mock('../../utils', () => ({
  getIsOnlyAllowEssentialUseCase: jest.fn().mockResolvedValue(false),
}));
const mockCoreStart = coreMock.createStart();

const setup = (options?: Partial<WorkspaceUseCaseProps>) => {
  const onChangeMock = jest.fn();
  const formErrors: WorkspaceFormErrors = {};
  const savedObjects = mockCoreStart.savedObjects;
  const renderResult = render(
    <WorkspaceUseCase
      availableUseCases={[
        WORKSPACE_USE_CASES.observability,
        WORKSPACE_USE_CASES['security-analytics'],
        WORKSPACE_USE_CASES.essentials,
        WORKSPACE_USE_CASES.search,
        {
          id: 'system-use-case',
          title: 'System use case',
          description: 'System use case description',
          systematic: true,
        },
      ]}
      value=""
      onChange={onChangeMock}
      formErrors={formErrors}
      operationType={WorkspaceOperationType.Create}
      savedObjects={savedObjects}
      {...options}
    />
  );
  return {
    renderResult,
    onChangeMock,
  };
};

describe('WorkspaceUseCase', () => {
  it('should render four use cases', () => {
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
  it('should only display essential use case when creating workspace if getIsOnlyAllowEssentialUseCase returns true', async () => {
    (getIsOnlyAllowEssentialUseCase as jest.Mock).mockResolvedValue(true);

    const { renderResult } = setup();
    await waitFor(() => {
      expect(renderResult.queryByText('Essentials')).toBeInTheDocument();
      expect(renderResult.queryByText('Observability')).not.toBeInTheDocument();
    });
  });
});
