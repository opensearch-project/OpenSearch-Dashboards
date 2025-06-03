/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { coreMock } from '../../../../../core/public/mocks';
import { DataSourceManagementPluginSetup } from '../../../../../plugins/data_source_management/public';
import { createMockedRegisteredUseCases } from '../../mocks';
import { WorkspaceOperationType } from '../workspace_form';
import { WorkspaceCreatorForm } from './workspace_creator_form';

const mockCoreStart = coreMock.createStart();

const setup = (
  isDashboardAdmin: boolean,
  dataSourceManagement: DataSourceManagementPluginSetup | undefined
) => {
  const application = {
    ...mockCoreStart.application,
    capabilities: {
      ...mockCoreStart.application.capabilities,
      dashboards: {
        isDashboardAdmin,
      },
    },
  };
  const savedObjects = {
    ...mockCoreStart.savedObjects,
    client: {
      ...mockCoreStart.savedObjects.client,
      find: jest.fn().mockImplementation(() => {
        return new Promise(() => {});
      }),
    },
  };

  return render(
    <WorkspaceCreatorForm
      isSubmitting={false}
      application={application}
      savedObjects={savedObjects}
      operationType={WorkspaceOperationType.Create}
      availableUseCases={createMockedRegisteredUseCases()}
      dataSourceManagement={dataSourceManagement}
    />
  );
};

const mockDataSourceManagementSetup = ({} as unknown) as DataSourceManagementPluginSetup;

describe('WorkspaceForm', () => {
  it('should enable data source panel for dashboard admin and when data source is enabled', () => {
    const { getByText } = setup(true, mockDataSourceManagementSetup);

    expect(getByText('Associate data sources')).toBeInTheDocument();
  });

  it('should not display data source panel for non dashboard admin', () => {
    const { queryByText } = setup(false, mockDataSourceManagementSetup);

    expect(queryByText('Associate data sources')).not.toBeInTheDocument();
  });

  it('should not display data source panel when data source is disabled', () => {
    const { queryByText } = setup(true, undefined);

    expect(queryByText('Associate data sources')).not.toBeInTheDocument();
  });
});
