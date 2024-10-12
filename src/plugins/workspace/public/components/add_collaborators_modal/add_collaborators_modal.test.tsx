/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddCollaboratorsModal } from './add_collaborators_modal';

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
});
