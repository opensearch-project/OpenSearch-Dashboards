/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { coreMock } from '../../../../../core/public/mocks';
import { DataSourceManagementPluginSetup } from '../../../../../plugins/data_source_management/public';
import { createMockedRegisteredUseCases } from '../../mocks';
import { WorkspaceOperationType } from './constants';
import { WorkspaceForm } from './workspace_form';

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
    <WorkspaceForm
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

    expect(getByText('Associate data source')).toBeInTheDocument();
  });

  it('should not display data source panel for non dashboard admin', () => {
    const { queryByText } = setup(false, mockDataSourceManagementSetup);

    expect(queryByText('Associate data source')).not.toBeInTheDocument();
  });

  it('should not display data source panel when data source is disabled', () => {
    const { queryByText } = setup(true, undefined);

    expect(queryByText('Associate data source')).not.toBeInTheDocument();
  });

  it('should automatic update workspace name after use case changed', () => {
    const { getByTestId } = setup(false, mockDataSourceManagementSetup);

    const nameInput = getByTestId('workspaceForm-workspaceDetails-nameInputText');
    expect(nameInput).toHaveValue('');
    fireEvent.click(getByTestId('workspaceUseCase-observability'));
    expect(nameInput).toHaveValue('Observability');
  });

  it('should not automatic update workspace name after manual input', () => {
    const { getByTestId } = setup(false, mockDataSourceManagementSetup);

    const nameInput = getByTestId('workspaceForm-workspaceDetails-nameInputText');
    fireEvent.input(nameInput, {
      target: { value: 'test workspace name' },
    });
    fireEvent.click(getByTestId('workspaceUseCase-observability'));
    expect(nameInput).toHaveValue('test workspace name');
  });
});
