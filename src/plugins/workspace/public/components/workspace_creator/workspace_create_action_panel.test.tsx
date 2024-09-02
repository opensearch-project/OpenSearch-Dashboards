/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { applicationServiceMock } from '../../../../../core/public/mocks';
import {
  MAX_WORKSPACE_DESCRIPTION_LENGTH,
  MAX_WORKSPACE_NAME_LENGTH,
} from '../../../common/constants';
import { WorkspaceCreateActionPanel } from './workspace_create_action_panel';

const mockApplication = applicationServiceMock.createStartContract();

describe('WorkspaceCreateActionPanel', () => {
  const formId = 'workspaceForm';
  const formData = {
    name: 'Test Workspace',
    description: 'This is a test workspace',
  };

  it('should disable the "Create Workspace" button when name exceeds the maximum length', () => {
    const longName = 'a'.repeat(MAX_WORKSPACE_NAME_LENGTH + 1);
    render(
      <WorkspaceCreateActionPanel
        formId={formId}
        formData={{ name: longName, description: formData.description }}
        application={mockApplication}
        isSubmitting={false}
      />
    );
    const createButton = screen.getByText('Create workspace');
    expect(createButton.closest('button')).toBeDisabled();
  });

  it('should disable the "Create Workspace" button when description exceeds the maximum length', () => {
    const longDescription = 'a'.repeat(MAX_WORKSPACE_DESCRIPTION_LENGTH + 1);
    render(
      <WorkspaceCreateActionPanel
        formId={formId}
        formData={{ name: formData.name, description: longDescription }}
        application={mockApplication}
        isSubmitting={false}
      />
    );
    const createButton = screen.getByText('Create workspace');
    expect(createButton.closest('button')).toBeDisabled();
  });

  it('should enable the "Create Workspace" button when name and description are within the maximum length', () => {
    render(
      <WorkspaceCreateActionPanel
        formId={formId}
        formData={formData}
        application={mockApplication}
        isSubmitting={false}
      />
    );
    const createButton = screen.getByText('Create workspace');
    expect(createButton.closest('button')).not.toBeDisabled();
  });

  it('should disable the "Create Workspace" and "Cancel" button when submitting', () => {
    render(
      <WorkspaceCreateActionPanel
        formId={formId}
        formData={{ name: 'test' }}
        application={mockApplication}
        isSubmitting
      />
    );
    expect(screen.getByText('Create workspace').closest('button')).toBeDisabled();
    expect(screen.getByText('Cancel').closest('button')).toBeDisabled();
  });
});
