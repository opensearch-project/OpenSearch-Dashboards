/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { WorkspaceCollaboratorInput } from './workspace_collaborator_input';

describe('WorkspaceCollaboratorInput', () => {
  const defaultProps = {
    index: 0,
    collaboratorId: '',
    accessLevel: 'readOnly' as const,
    onCollaboratorIdChange: jest.fn(),
    onAccessLevelChange: jest.fn(),
    onDelete: jest.fn(),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calls onCollaboratorIdChange when input value changes', () => {
    render(<WorkspaceCollaboratorInput {...defaultProps} />);
    const input = screen.getByTestId('workspaceCollaboratorIdInput-0');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(defaultProps.onCollaboratorIdChange).toHaveBeenCalledWith('test', 0);
  });

  it('calls onAccessLevelChange when access level changes', () => {
    render(<WorkspaceCollaboratorInput {...defaultProps} />);
    const readButton = screen.getByText('Admin');
    fireEvent.click(readButton);
    expect(defaultProps.onAccessLevelChange).toHaveBeenCalledWith('admin', 0);
  });

  it('calls onDelete when delete button is clicked', () => {
    render(<WorkspaceCollaboratorInput {...defaultProps} />);
    const deleteButton = screen.getByRole('button', { name: 'Delete collaborator 0' });
    fireEvent.click(deleteButton);
    expect(defaultProps.onDelete).toHaveBeenCalledWith(0);
  });

  it('collaborator id input should be invalid when error passed', () => {
    render(<WorkspaceCollaboratorInput {...defaultProps} error="error" />);
    expect(screen.getByTestId('workspaceCollaboratorIdInput-0')).toBeInvalid();
  });
});
