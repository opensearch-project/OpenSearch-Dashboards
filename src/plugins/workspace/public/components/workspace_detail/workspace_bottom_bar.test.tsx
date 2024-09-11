/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  MAX_WORKSPACE_DESCRIPTION_LENGTH,
  MAX_WORKSPACE_NAME_LENGTH,
} from '../../../common/constants';
import { WorkspaceBottomBar } from './workspace_bottom_bar';

const mockHandleResetForm = jest.fn();

const defaultProps = {
  formId: 'testForm',
  numberOfChanges: 2,
  numberOfErrors: 1,
  handleResetForm: mockHandleResetForm,
  isFormSubmitting: false,
  formData: { name: 'Foo', description: '' },
};

describe('WorkspaceBottomBar', () => {
  test('renders correctly with errors and unsaved changes', () => {
    render(<WorkspaceBottomBar {...defaultProps} />);

    expect(screen.getByText('2 Unsaved change(s)')).toBeInTheDocument();
    expect(screen.getByText('2 error(s)')).toBeInTheDocument();
    expect(screen.getByText('Discard changes')).toBeInTheDocument();
    expect(screen.getByText('Save changes')).toBeInTheDocument();
  });

  test('disables the save button when there are no changes', () => {
    render(<WorkspaceBottomBar {...defaultProps} numberOfChanges={0} />);
    const saveButton = screen.getByRole('button', { name: 'Save changes' });
    expect(saveButton).toBeDisabled();
  });

  test('calls handleResetForm when discard changes button is clicked', () => {
    render(<WorkspaceBottomBar {...defaultProps} />);
    fireEvent.click(screen.getByText('Discard changes'));
    expect(mockHandleResetForm).toHaveBeenCalled();
  });

  test('calls handleSubmit when save changes button is clicked', () => {
    const handleSubmit = jest.fn();
    render(
      <form id="testForm" onSubmit={handleSubmit}>
        <WorkspaceBottomBar {...defaultProps} />
      </form>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    // Assuming handleSubmit is called during form submission
    expect(handleSubmit).toHaveBeenCalled();
  });

  it('should disable the "Save changes" button when name exceeds the maximum length', () => {
    const longName = 'a'.repeat(MAX_WORKSPACE_NAME_LENGTH + 1);
    render(
      <form id="testForm">
        <WorkspaceBottomBar {...defaultProps} formData={{ name: longName }} />
      </form>
    );
    const saveChangesButton = screen.getByText('Save changes');
    expect(saveChangesButton.closest('button')).toBeDisabled();
  });

  it('should disable the "Save changes" button when description exceeds the maximum length', () => {
    const longDescription = 'a'.repeat(MAX_WORKSPACE_DESCRIPTION_LENGTH + 1);
    render(
      <form id="testForm">
        <WorkspaceBottomBar
          {...defaultProps}
          formData={{ ...defaultProps.formData, description: longDescription }}
        />
      </form>
    );
    const saveChangesButton = screen.getByText('Save changes');
    expect(saveChangesButton.closest('button')).toBeDisabled();
  });

  it('should enable the "Save changes" button when name and description are within the maximum length', () => {
    render(<WorkspaceBottomBar {...defaultProps} />);
    const saveChangesButton = screen.getByText('Save changes');
    expect(saveChangesButton.closest('button')).not.toBeDisabled();
  });
});
