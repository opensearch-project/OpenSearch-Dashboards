/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { WorkspaceCollaboratorsPanel } from './workspace_collaborators_panel';

describe('WorkspaceCollaboratorsPanel', () => {
  const defaultProps = {
    label: 'Collaborators',
    collaborators: [
      { id: 1, collaboratorId: 'user1', accessLevel: 'readOnly' as const },
      { id: 2, collaboratorId: 'user2', accessLevel: 'readAndWrite' as const },
    ],
    onChange: jest.fn(),
    addAnotherButtonLabel: 'Add Another',
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component', () => {
    render(<WorkspaceCollaboratorsPanel {...defaultProps} />);
    expect(screen.getByText(defaultProps.label)).toBeInTheDocument();
  });

  it('renders collaborator ID inputs', () => {
    render(<WorkspaceCollaboratorsPanel {...defaultProps} />);
    expect(screen.getAllByTestId(/workspaceCollaboratorIdInput-\d/)).toHaveLength(2);
  });

  it('calls onChange when collaborator ID changes', () => {
    render(<WorkspaceCollaboratorsPanel {...defaultProps} />);
    const input = screen.getByTestId('workspaceCollaboratorIdInput-0');
    fireEvent.change(input, { target: { value: 'newUser' } });
    expect(defaultProps.onChange).toHaveBeenCalledWith([
      { id: 1, collaboratorId: 'newUser', accessLevel: 'readOnly' },
      { id: 2, collaboratorId: 'user2', accessLevel: 'readAndWrite' },
    ]);
  });

  it('calls onChange when access level changes to admin', () => {
    render(<WorkspaceCollaboratorsPanel {...defaultProps} />);
    const adminButton = screen.getAllByText('Admin')[0];
    fireEvent.click(adminButton);
    expect(defaultProps.onChange).toHaveBeenCalledWith([
      { id: 1, collaboratorId: 'user1', accessLevel: 'admin' },
      { id: 2, collaboratorId: 'user2', accessLevel: 'readAndWrite' },
    ]);
  });

  it('calls onChange when access level changes to readOnly', () => {
    render(<WorkspaceCollaboratorsPanel {...defaultProps} />);
    const readOnlyButton = screen.getAllByText('Read only')[1];
    fireEvent.click(readOnlyButton);
    expect(defaultProps.onChange).toHaveBeenCalledWith([
      { id: 1, collaboratorId: 'user1', accessLevel: 'readOnly' },
      { id: 2, collaboratorId: 'user2', accessLevel: 'readOnly' },
    ]);
  });

  it('calls onChange when access level changes to readAndWrite', () => {
    render(<WorkspaceCollaboratorsPanel {...defaultProps} />);
    const readAndWriteButton = screen.getAllByText('Read and write')[0];
    fireEvent.click(readAndWriteButton);
    expect(defaultProps.onChange).toHaveBeenCalledWith([
      { id: 1, collaboratorId: 'user1', accessLevel: 'readAndWrite' },
      { id: 2, collaboratorId: 'user2', accessLevel: 'readAndWrite' },
    ]);
  });

  it('calls onChange when collaborator is deleted', () => {
    render(<WorkspaceCollaboratorsPanel {...defaultProps} />);
    const deleteButton = screen.getAllByRole('button', { name: /Delete collaborator/ })[0];
    fireEvent.click(deleteButton);
    expect(defaultProps.onChange).toHaveBeenCalledWith([
      { id: 2, collaboratorId: 'user2', accessLevel: 'readAndWrite' },
    ]);
  });

  it('calls onChange when adding a new collaborator', () => {
    render(<WorkspaceCollaboratorsPanel {...defaultProps} />);
    const addButton = screen.getByRole('button', { name: defaultProps.addAnotherButtonLabel });
    fireEvent.click(addButton);
    expect(defaultProps.onChange).toHaveBeenCalledWith([
      { id: 1, collaboratorId: 'user1', accessLevel: 'readOnly' },
      { id: 2, collaboratorId: 'user2', accessLevel: 'readAndWrite' },
      { id: 3, collaboratorId: '', accessLevel: 'readOnly' },
    ]);
  });

  it('should display error message if provided', () => {
    render(
      <WorkspaceCollaboratorsPanel {...defaultProps} errors={{ 2: 'A test error message' }} />
    );

    expect(screen.getByText('A test error message')).toBeInTheDocument();
  });
});
