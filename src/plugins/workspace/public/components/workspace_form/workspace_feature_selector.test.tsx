/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import {
  WorkspaceFeatureSelector,
  WorkspaceFeatureSelectorProps,
} from './workspace_feature_selector';
import { AppNavLinkStatus } from '../../../../../core/public';

const setup = (options?: Partial<WorkspaceFeatureSelectorProps>) => {
  const onChangeMock = jest.fn();
  const applications = [
    {
      id: 'app-1',
      title: 'App 1',
      category: { id: 'category-1', label: 'Category 1' },
      navLinkStatus: AppNavLinkStatus.visible,
    },
    {
      id: 'app-2',
      title: 'App 2',
      category: { id: 'category-1', label: 'Category 1' },
      navLinkStatus: AppNavLinkStatus.visible,
    },
    {
      id: 'app-3',
      title: 'App 3',
      category: { id: 'category-2', label: 'Category 2' },
      navLinkStatus: AppNavLinkStatus.visible,
    },
    {
      id: 'app-4',
      title: 'App 4',
      navLinkStatus: AppNavLinkStatus.visible,
    },
  ];
  const renderResult = render(
    <WorkspaceFeatureSelector
      applications={applications}
      selectedFeatures={[]}
      onChange={onChangeMock}
      {...options}
    />
  );
  return {
    renderResult,
    onChangeMock,
  };
};

describe('WorkspaceFeatureSelector', () => {
  it('should call onChange with clicked feature', () => {
    const { renderResult, onChangeMock } = setup();

    expect(onChangeMock).not.toHaveBeenCalled();
    fireEvent.click(renderResult.getByText('App 1'));
    expect(onChangeMock).toHaveBeenCalledWith(['app-1']);
  });
  it('should call onChange with empty array after selected feature clicked', () => {
    const { renderResult, onChangeMock } = setup({
      selectedFeatures: ['app-2'],
    });

    expect(onChangeMock).not.toHaveBeenCalled();
    fireEvent.click(renderResult.getByText('App 2'));
    expect(onChangeMock).toHaveBeenCalledWith([]);
  });
  it('should call onChange with features under clicked group', () => {
    const { renderResult, onChangeMock } = setup();

    expect(onChangeMock).not.toHaveBeenCalled();
    fireEvent.click(
      renderResult.getByTestId('workspaceForm-workspaceFeatureVisibility-Category 1')
    );
    expect(onChangeMock).toHaveBeenCalledWith(['app-1', 'app-2']);
  });
  it('should call onChange without features under clicked group when group already selected', () => {
    const { renderResult, onChangeMock } = setup({
      selectedFeatures: ['app-1', 'app-2', 'app-3'],
    });

    expect(onChangeMock).not.toHaveBeenCalled();
    fireEvent.click(
      renderResult.getByTestId('workspaceForm-workspaceFeatureVisibility-Category 1')
    );
    expect(onChangeMock).toHaveBeenCalledWith(['app-3']);
  });
});
