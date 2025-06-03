/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render, waitFor, within } from '@testing-library/react';
import { BehaviorSubject } from 'rxjs';

import { DEFAULT_NAV_GROUPS } from '../../../../../core/public';
import { coreMock } from '../../../../../core/public/mocks';
import { OpenSearchDashboardsContextProvider } from '../../../../../plugins/opensearch_dashboards_react/public';
import { WorkspaceUseCase, WorkspaceUseCaseProps } from './workspace_use_case';
import { WorkspaceFormErrors } from './types';

const setup = (options?: Partial<WorkspaceUseCaseProps>) => {
  const coreStartMock = coreMock.createStart();
  const onChangeMock = jest.fn();
  const formErrors: WorkspaceFormErrors = {};
  coreStartMock.chrome.navGroup.getNavGroupsMap$.mockImplementation(
    () =>
      new BehaviorSubject({
        [DEFAULT_NAV_GROUPS.observability.id]: {
          ...DEFAULT_NAV_GROUPS.observability,
          navLinks: [
            { id: 'feature1', title: 'Feature 1' },
            { id: 'feature2', title: 'Feature 2' },
          ],
        },
      })
  );

  coreStartMock.chrome.navLinks.getNavLinks$.mockImplementation(
    () =>
      new BehaviorSubject([
        { id: 'feature1', title: 'Feature 1', baseUrl: '', href: '' },
        { id: 'feature2', title: 'Feature 2', baseUrl: '', href: '' },
      ])
  );
  const renderResult = render(
    <OpenSearchDashboardsContextProvider services={coreStartMock}>
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
    </OpenSearchDashboardsContextProvider>
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
      expect(renderResult.getByText('Essentials').closest('label')).toHaveClass(
        'euiCheckableCard__label-isDisabled'
      );
    });
  });

  it('should open flyout and expanded selected use cases', async () => {
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
      value: DEFAULT_NAV_GROUPS.observability.id,
    });

    fireEvent.click(renderResult.getByText('Learn more.'));

    await waitFor(() => {
      expect(within(renderResult.getByRole('dialog')).getByText('Use cases')).toBeInTheDocument();
      expect(
        within(renderResult.getByRole('dialog')).getByText('Observability')
      ).toBeInTheDocument();
      expect(within(renderResult.getByRole('dialog')).getByText('Feature 1')).toBeInTheDocument();
      expect(within(renderResult.getByRole('dialog')).getByText('Feature 2')).toBeInTheDocument();
    });
  });

  it('should close flyout after close button clicked', async () => {
    const { renderResult } = setup({});

    fireEvent.click(renderResult.getByText('Learn more.'));
    await waitFor(() => {
      expect(within(renderResult.getByRole('dialog')).getByText('Use cases')).toBeInTheDocument();
    });

    fireEvent.click(renderResult.getByTestId('euiFlyoutCloseButton'));

    await waitFor(() => {
      expect(renderResult.queryByText('dialog')).toBeNull();
    });
  });

  it('should render "(all features)" suffix for "all use case"', () => {
    const { renderResult } = setup({
      availableUseCases: [
        {
          ...DEFAULT_NAV_GROUPS.all,
          features: [],
        },
      ],
    });

    expect(renderResult.getByText('(all features)')).toBeInTheDocument();
  });
});
