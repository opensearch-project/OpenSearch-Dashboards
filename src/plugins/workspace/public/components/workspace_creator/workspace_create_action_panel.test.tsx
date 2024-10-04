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
import { DataSourceConnectionType } from '../../../common/types';
import { WorkspaceCreateActionPanel } from './workspace_create_action_panel';

const mockApplication = applicationServiceMock.createStartContract();

describe('WorkspaceCreateActionPanel', () => {
  const formId = 'workspaceForm';
  const formData = {
    name: 'Test Workspace',
    description: 'This is a test workspace',
    selectedDataSourceConnections: [
      {
        id: 'data-source-1',
        name: 'Data Source 1',
        type: '',
        connectionType: DataSourceConnectionType.OpenSearchConnection,
      },
    ],
  };

  it('should disable the "Create Workspace" button when name exceeds the maximum length', () => {
    const longName = 'a'.repeat(MAX_WORKSPACE_NAME_LENGTH + 1);
    render(
      <WorkspaceCreateActionPanel
        formId={formId}
        formData={{
          ...formData,
          name: longName,
        }}
        application={mockApplication}
        isSubmitting={false}
        dataSourceEnabled
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
        formData={{
          ...formData,
          description: longDescription,
        }}
        application={mockApplication}
        isSubmitting={false}
        dataSourceEnabled
      />
    );
    const createButton = screen.getByText('Create workspace');
    expect(createButton.closest('button')).toBeDisabled();
  });

  it('should disable the "Create Workspace" button when data source enabled and no data sources selected', () => {
    render(
      <WorkspaceCreateActionPanel
        formId={formId}
        formData={{
          ...formData,
          selectedDataSourceConnections: [],
        }}
        application={mockApplication}
        isSubmitting={false}
        dataSourceEnabled
      />
    );
    const createButton = screen.getByText('Create workspace');
    expect(createButton.closest('button')).toBeDisabled();
  });

  it('should enable the "Create Workspace" button when no data sources selected but no data source enabled', () => {
    render(
      <WorkspaceCreateActionPanel
        formId={formId}
        formData={{
          ...formData,
          selectedDataSourceConnections: [],
        }}
        application={mockApplication}
        isSubmitting={false}
        dataSourceEnabled={false}
      />
    );
    const createButton = screen.getByText('Create workspace');
    expect(createButton.closest('button')).not.toBeDisabled();
  });

  it('should enable the "Create Workspace" button when name and description are within the maximum length', () => {
    render(
      <WorkspaceCreateActionPanel
        formId={formId}
        formData={formData}
        application={mockApplication}
        isSubmitting={false}
        dataSourceEnabled
      />
    );
    const createButton = screen.getByText('Create workspace');
    expect(createButton.closest('button')).not.toBeDisabled();
  });

  it('should disable the "Create Workspace" and "Cancel" button when submitting', () => {
    render(
      <WorkspaceCreateActionPanel
        formId={formId}
        formData={formData}
        application={mockApplication}
        isSubmitting
        dataSourceEnabled
      />
    );
    expect(screen.getByText('Create workspace').closest('button')).toBeDisabled();
    expect(screen.getByText('Cancel').closest('button')).toBeDisabled();
  });
});
