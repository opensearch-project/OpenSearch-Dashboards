/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BehaviorSubject } from 'rxjs';
import { WorkspaceGlobalSearchPageItem } from './workspace_global_search_item';
import { NavGroupType } from '../../../../../core/public';

describe('WorkspaceGlobalSearchPageItem', () => {
  const mockLink = {
    id: 'test-link',
    title: 'Test Link',
    description: 'Test Description',
    icon: 'test-icon',
    navGroup: {
      id: 'test-nav',
      type: 'test' as NavGroupType,
      title: 'Test Link',
      description: '',
      navLinks: [
        {
          id: 'test-group-link',
          title: 'Test Group Link',
        },
      ],
    },
  };

  const mockWorkspace = {
    id: 'workspace-1',
    name: 'Test Workspace',
  };

  const mockRegisteredUseCases$ = new BehaviorSubject([
    { id: 'use-case-1', name: 'Test Use Case' },
  ]);

  const mockOnCallback = jest.fn();

  const defaultProps = {
    link: mockLink as any,
    search: 'test search',
    currentWorkspace: mockWorkspace,
    registeredUseCases$: mockRegisteredUseCases$,
    onCallback: mockOnCallback,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders workspace title when page is not system type', () => {
    render(<WorkspaceGlobalSearchPageItem {...(defaultProps as any)} />);

    expect(screen.getByText('Test Link')).toBeInTheDocument();
    expect(screen.getByText('Test Workspace')).toBeInTheDocument();
  });

  it('renders nav group element when page is system type', () => {
    const systemLink = {
      ...mockLink,
      navGroup: {
        ...mockLink.navGroup,
        title: 'System Type',
        type: NavGroupType.SYSTEM,
      },
    };

    render(<WorkspaceGlobalSearchPageItem {...(defaultProps as any)} link={systemLink as any} />);

    expect(screen.getByText('Test Link')).toBeInTheDocument();
    expect(screen.queryByText('Test Workspace')).not.toBeInTheDocument();
    expect(screen.getByText('System Type')).toBeInTheDocument();
  });

  it('calls onCallback when clicked', () => {
    render(<WorkspaceGlobalSearchPageItem {...(defaultProps as any)} />);

    fireEvent.click(screen.getByText('Test Link'));
    expect(mockOnCallback).toHaveBeenCalledWith(mockLink);
  });
});
