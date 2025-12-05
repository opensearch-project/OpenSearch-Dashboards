/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddCollaboratorsModal } from './add_collaborators_modal';
import { DuplicateCollaboratorError } from './duplicate_collaborator_error';

describe('AddCollaboratorsModal', () => {
  const defaultProps = {
    title: 'Add Collaborators',
    inputLabel: 'Collaborator ID',
    addAnotherButtonLabel: 'Add Another',
    permissionType: 'user' as const,
    onClose: jest.fn(),
    onAddCollaborators: jest.fn(),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the modal with the correct title', () => {
    render(<AddCollaboratorsModal {...defaultProps} />);
    expect(screen.getByText(defaultProps.title)).toBeInTheDocument();
  });

  it('renders the collaborator input field with the correct label', () => {
    render(<AddCollaboratorsModal {...defaultProps} />);
    expect(screen.getByLabelText(defaultProps.inputLabel)).toBeInTheDocument();
  });

  it('renders the "Add Another" button with the correct label', () => {
    render(<AddCollaboratorsModal {...defaultProps} />);
    expect(
      screen.getByRole('button', { name: defaultProps.addAnotherButtonLabel })
    ).toBeInTheDocument();
  });

  it('calls onAddCollaborators with valid collaborators when clicking the "Add collaborators" button', async () => {
    render(<AddCollaboratorsModal {...defaultProps} />);
    const collaboratorInput = screen.getByLabelText(defaultProps.inputLabel);
    fireEvent.change(collaboratorInput, { target: { value: 'user1' } });
    const addCollaboratorsButton = screen.getByRole('button', { name: 'Add collaborators' });
    fireEvent.click(addCollaboratorsButton);
    await waitFor(() => {
      expect(defaultProps.onAddCollaborators).toHaveBeenCalledWith([
        { collaboratorId: 'user1', accessLevel: 'readOnly', permissionType: 'user' },
      ]);
    });
  });

  it('calls onClose when clicking the "Cancel" button', () => {
    render(<AddCollaboratorsModal {...defaultProps} />);
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('renders the description if provided', () => {
    const props = { ...defaultProps, description: 'Add collaborators to your workspace' };
    render(<AddCollaboratorsModal {...props} />);
    expect(screen.getByText(props.description)).toBeInTheDocument();
  });

  it('renders the instruction if provided', () => {
    const instruction = {
      title: 'Instructions',
      detail: 'Follow these instructions to add collaborators',
      link: 'foo',
    };
    const props = { ...defaultProps, instruction };
    render(<AddCollaboratorsModal {...props} />);
    expect(screen.getByText(instruction.title)).toBeInTheDocument();
    expect(screen.getByText(instruction.detail)).toBeInTheDocument();
    expect(screen.getByText('Learn more in Documentation')).toBeInTheDocument();
  });

  it('should display consistent duplicate collaborators errors', async () => {
    const mockOnAddCollaborators = () => {
      throw new DuplicateCollaboratorError({ pendingAdded: ['user1'], existing: ['user2'] });
    };
    render(<AddCollaboratorsModal {...defaultProps} onAddCollaborators={mockOnAddCollaborators} />);
    const collaboratorIdInput0 = screen.getByTestId('workspaceCollaboratorIdInput-0');
    fireEvent.change(collaboratorIdInput0, { target: { value: 'user1' } });

    fireEvent.click(screen.getByText('Add Another'));
    const collaboratorIdInput1 = screen.getByTestId('workspaceCollaboratorIdInput-1');
    fireEvent.change(collaboratorIdInput1, { target: { value: 'user1' } });

    fireEvent.click(screen.getByText('Add Another'));
    const collaboratorIdInput2 = screen.getByTestId('workspaceCollaboratorIdInput-2');
    fireEvent.change(collaboratorIdInput2, { target: { value: 'user2' } });

    const addCollaboratorsButton = screen.getByRole('button', { name: 'Add collaborators' });
    fireEvent.click(addCollaboratorsButton);
    await waitFor(() => {
      expect(screen.getByText('This ID is already added to the list.')).toBeInTheDocument();
      expect(screen.getByText('A collaborator with this ID already exists.')).toBeInTheDocument();
    });
  });

  it('should disable "Add collaborators" button during onAddCollaborators execution', async () => {
    const onAddCollaboratorsMock = jest.fn().mockReturnValue(
      new Promise((resolve) => {
        window.setTimeout(resolve, 1000);
      })
    );
    render(<AddCollaboratorsModal {...defaultProps} onAddCollaborators={onAddCollaboratorsMock} />);
    const collaboratorInput = screen.getByLabelText(defaultProps.inputLabel);
    fireEvent.change(collaboratorInput, { target: { value: 'user1' } });
    const addCollaboratorsButton = screen.getByRole('button', { name: 'Add collaborators' });

    jest.useFakeTimers();
    fireEvent.click(addCollaboratorsButton);
    await waitFor(() => {
      expect(addCollaboratorsButton).toBeDisabled();
    });
    jest.runAllTimers();
    jest.useRealTimers();

    await waitFor(() => {
      expect(addCollaboratorsButton).not.toBeDisabled();
    });
  });

  it('should show "Invalid Collaborator ID format" for "*" collaborator id', async () => {
    render(<AddCollaboratorsModal {...defaultProps} />);
    const collaboratorInput = screen.getByLabelText(defaultProps.inputLabel);
    fireEvent.change(collaboratorInput, { target: { value: '*' } });

    expect(screen.queryByText('Invalid Collaborator ID format')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Add collaborators' }));
    expect(screen.getByText('Invalid Collaborator ID format')).toBeInTheDocument();
  });
});
