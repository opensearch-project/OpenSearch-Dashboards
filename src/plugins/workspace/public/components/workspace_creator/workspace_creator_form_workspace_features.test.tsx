/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { coreMock } from '../../../../../core/public/mocks';
import { DataSourceManagementPluginSetup } from '../../../../../plugins/data_source_management/public';
import { createMockedRegisteredUseCases } from '../../mocks';
import { WorkspaceOperationType, SelectDataSourcePanel } from '../workspace_form';
import { WorkspaceCreatorForm } from './workspace_creator_form';

jest.mock('../workspace_form', () => ({
  ...jest.requireActual('../workspace_form'),
  SelectDataSourcePanel: jest.fn(() => <div data-test-subj="mockedSelectDataSourcePanel" />),
}));

const mockCoreStart = coreMock.createStart();

const renderForm = (features?: string[]) =>
  render(
    <WorkspaceCreatorForm
      isSubmitting={false}
      application={{
        ...mockCoreStart.application,
        capabilities: {
          ...mockCoreStart.application.capabilities,
          dashboards: { isDashboardAdmin: true },
        },
      }}
      savedObjects={mockCoreStart.savedObjects}
      operationType={WorkspaceOperationType.Create}
      availableUseCases={createMockedRegisteredUseCases()}
      dataSourceManagement={{} as unknown as DataSourceManagementPluginSetup}
      onAppLeave={() => {}}
      onGoToCollaboratorsChange={() => {}}
      goToCollaborators={false}
      defaultValues={features ? { features } : undefined}
    />
  );

describe('WorkspaceCreatorForm workspace features for the association filters', () => {
  beforeEach(() => {
    (SelectDataSourcePanel as jest.Mock).mockClear();
  });

  it('passes the chosen use case as a one-element feature list', () => {
    renderForm(['use-case-observability']);
    expect(SelectDataSourcePanel).toHaveBeenLastCalledWith(
      expect.objectContaining({ workspaceFeatures: ['use-case-observability'] }),
      expect.anything()
    );
  });

  it('passes undefined while no use case is chosen', () => {
    renderForm();
    expect(SelectDataSourcePanel).toHaveBeenLastCalledWith(
      expect.objectContaining({ workspaceFeatures: undefined }),
      expect.anything()
    );
  });
});
