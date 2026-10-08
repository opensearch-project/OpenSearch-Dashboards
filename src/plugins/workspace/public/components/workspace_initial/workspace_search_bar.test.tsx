/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { WorkspaceSearchBar, WorkspaceSearchBarProps } from './workspace_search_bar';

describe('WorkspaceSearchBar', () => {
  const setup = (overrides: Partial<WorkspaceSearchBarProps> = {}) => {
    const props: WorkspaceSearchBarProps = {
      searchQuery: '',
      onSearchChange: jest.fn(),
      recency: 'all',
      onRecencyChange: jest.fn(),
      roleFilter: 'all',
      onRoleFilterChange: jest.fn(),
      ...overrides,
    };
    return { props, ...render(<WorkspaceSearchBar {...props} />) };
  };

  it('renders the search input and both filter dropdowns with their default displays', () => {
    const { getByTestId, getByText } = setup();
    expect(getByTestId('workspace-initial-search-input')).toBeInTheDocument();
    expect(getByTestId('workspace-initial-search-recency-select')).toBeInTheDocument();
    expect(getByTestId('workspace-initial-search-role-select')).toBeInTheDocument();
    expect(getByText('Last viewed: All')).toBeInTheDocument();
    expect(getByText('Access level: All')).toBeInTheDocument();
  });

  it('reflects the controlled search query value', () => {
    const { getByTestId } = setup({ searchQuery: 'payments' });
    expect(getByTestId('workspace-initial-search-input')).toHaveValue('payments');
  });

  it('calls onSearchChange when typing in the search box', () => {
    const { props, getByTestId } = setup();
    fireEvent.change(getByTestId('workspace-initial-search-input'), {
      target: { value: 'pay' },
    });
    expect(props.onSearchChange).toHaveBeenCalledWith('pay');
  });

  it('calls onRecencyChange when selecting a recency option', () => {
    const { props, getByTestId, getByText } = setup();
    fireEvent.click(getByTestId('workspace-initial-search-recency-select'));
    fireEvent.click(getByText('This week'));
    expect(props.onRecencyChange).toHaveBeenCalledWith('week');
  });

  it('calls onRoleFilterChange when selecting an access level', () => {
    const { props, getByTestId, getByText } = setup();
    fireEvent.click(getByTestId('workspace-initial-search-role-select'));
    fireEvent.click(getByText('Read only'));
    expect(props.onRoleFilterChange).toHaveBeenCalledWith('readonly');
  });
});
