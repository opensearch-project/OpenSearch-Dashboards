/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { coreMock } from '../../../../../core/public/mocks';
import { createOpenSearchDashboardsReactContext } from '../../../../opensearch_dashboards_react/public';
import { WorkspaceFormProvider, WorkspaceOperationType } from '../workspace_form';
import { SelectDataSourceDetailPanel } from './select_data_source_panel';
import * as utils from '../../utils';
import { IntlProvider } from 'react-intl';
import { DataSourceConnectionType } from '../../../common/types';

const mockCoreStart = coreMock.createStart();

const workspaceObject = {
  id: 'foo_id',
  name: 'foo',
  description: 'this is my foo workspace description',
  features: ['use-case-observability', 'workspace_detail'],
};

const dataSources = [
  {
    id: 'ds-1',
    title: 'Data Source 1',
    auth: {},
    description: 'ds-1-description',
    dataSourceEngineType: 'OpenSearch',
    workspaces: ['foo_id'],
  },
  {
    id: 'ds-2',
    title: 'Data Source 2',
    auth: {},
    description: 'ds-2-description',
    dataSourceEngineType: 'OpenSearch',
    workspaces: ['foo_id'],
  },
];

const dataSourceConnectionsMock = [
  {
    id: 'ds1',
    name: 'Data Source 1',
    connectionType: DataSourceConnectionType.OpenSearchConnection,
    type: 'OpenSearch',
    relatedConnections: [
      {
        id: 'ds1-dqc1',
        name: 'dqc1',
        parentId: 'ds1',
        connectionType: DataSourceConnectionType.DirectQueryConnection,
        type: 'S3',
      },
    ],
  },
  {
    id: 'ds1-dqc1',
    name: 'dqc1',
    parentId: 'ds1',
    connectionType: DataSourceConnectionType.DirectQueryConnection,
    type: 'S3',
  },
  {
    id: 'ds2',
    name: 'Data Source 2',
    connectionType: DataSourceConnectionType.OpenSearchConnection,
    type: 'OpenSearch',
  },
];

jest.spyOn(utils, 'getDataSourcesList').mockResolvedValue(dataSources);

const defaultValues = {
  id: workspaceObject.id,
  name: workspaceObject.name,
  features: workspaceObject.features,
};

const defaultProps = {
  savedObjects: {},
  assignedDataSources: [],
  detailTitle: 'Data sources',
  isDashboardAdmin: true,
  currentWorkspace: workspaceObject,
};

const notificationToastsAddSuccess = jest.fn();
const notificationToastsAddDanger = jest.fn();

const success = jest.fn().mockResolvedValue({
  success: true,
});
const failed = jest.fn().mockResolvedValue({});

const selectDataSourceDetailPanel = (props: any) => {
  const { Provider } = createOpenSearchDashboardsReactContext({
    ...mockCoreStart,
    ...{
      notifications: {
        ...mockCoreStart.notifications,
        toasts: {
          ...mockCoreStart.notifications.toasts,
          addDanger: notificationToastsAddDanger,
          addSuccess: notificationToastsAddSuccess,
        },
      },
      workspaceClient: {
        update: props.action,
      },
    },
  });

  return (
    <IntlProvider locale="en">
      <WorkspaceFormProvider
        application={mockCoreStart.application}
        savedObjects={mockCoreStart.savedObjects}
        operationType={WorkspaceOperationType.Update}
        permissionEnabled={true}
        onSubmit={jest.fn()}
        defaultValues={defaultValues}
        availableUseCases={[]}
      >
        <Provider>
          <SelectDataSourceDetailPanel {...props} chrome={mockCoreStart.chrome} />
        </Provider>
      </WorkspaceFormProvider>
    </IntlProvider>
  );
};

describe('SelectDataSourceDetailPanel', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should show message when no data sources are assigned', async () => {
    jest.spyOn(utils, 'fetchDataSourceConnections').mockResolvedValue([]);
    const { getByText, getAllByText } = render(selectDataSourceDetailPanel(defaultProps));
    await waitFor(() => {
      expect(getByText('No data sources to display')).toBeInTheDocument();
      expect(
        getByText('There are no data sources associated with the workspace.')
      ).toBeInTheDocument();
      expect(getAllByText('Associate OpenSearch connections')).toHaveLength(2);
    });
  });

  it('should not show assocition button when user is not OSD admin', async () => {
    jest.spyOn(utils, 'fetchDataSourceConnections').mockResolvedValue([]);
    const { getByText, queryByText } = render(
      selectDataSourceDetailPanel({
        ...defaultProps,
        isDashboardAdmin: false,
      })
    );
    await waitFor(() => {
      expect(
        getByText('Contact your administrator to associate data sources with the workspace.')
      ).toBeInTheDocument();
      expect(queryByText('Associate OpenSearch connections')).toBeNull();
    });
  });

  it('should not show remove associations button when user is not OSD admin', async () => {
    jest.spyOn(utils, 'fetchDataSourceConnections').mockResolvedValue(dataSourceConnectionsMock);
    const { queryByTestId } = render(
      selectDataSourceDetailPanel({
        ...defaultProps,
        assignedDataSources: dataSources,
        isDashboardAdmin: false,
      })
    );
    await waitFor(() => {
      expect(queryByTestId('workspace-detail-dataSources-table-action-Remove')).toBeNull();
    });
  });

  it('should switch toggle button', async () => {
    jest.spyOn(utils, 'fetchDataSourceConnections').mockResolvedValue(dataSourceConnectionsMock);
    const { getByText } = render(selectDataSourceDetailPanel(defaultProps));
    await waitFor(() => {
      const dqcButton = getByText('Direct query connections');
      expect(dqcButton).toBeInTheDocument();
      fireEvent.click(dqcButton);
    });
  });

  it('should success to associate data sources', async () => {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      value: 600,
    });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      value: 600,
    });
    jest.spyOn(utils, 'getDataSourcesList').mockResolvedValue([]);
    jest.spyOn(utils, 'fetchDataSourceConnections').mockResolvedValueOnce([]);
    jest
      .spyOn(utils, 'fetchDataSourceConnections')
      .mockResolvedValueOnce(dataSourceConnectionsMock);
    const { getByText, getByTestId, getAllByRole } = render(
      selectDataSourceDetailPanel({
        ...defaultProps,
        action: success,
      })
    );
    const associationButton = getAllByRole('button', {
      name: 'Associate OpenSearch connections',
    })[0];
    await waitFor(() => {
      expect(associationButton).toBeInTheDocument();
    });
    fireEvent.click(associationButton);
    await waitFor(() => {
      expect(
        getByText(
          'Add data sources that will be available in the workspace. If a selected data source has related Direct Query connection, they will also be available in the workspace.'
        )
      ).toBeInTheDocument();
      expect(getByText('Data Source 2')).toBeInTheDocument();
    });
    fireEvent.click(getByText('Data Source 2'));
    await waitFor(() => {
      const button = getByTestId('workspace-detail-dataSources-associateModal-save-button');
      expect(button).toBeInTheDocument();
      expect(button).toBeEnabled();
      fireEvent.click(getByTestId('workspace-detail-dataSources-associateModal-save-button'));
    });
    expect(notificationToastsAddSuccess).toHaveBeenCalled();
  });

  it('should fail to associate data sources', async () => {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      value: 600,
    });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      value: 600,
    });
    jest.spyOn(utils, 'getDataSourcesList').mockResolvedValue([]);
    jest.spyOn(utils, 'fetchDataSourceConnections').mockResolvedValueOnce([]);
    jest
      .spyOn(utils, 'fetchDataSourceConnections')
      .mockResolvedValueOnce(dataSourceConnectionsMock);
    const { getByText, getByTestId, getAllByRole } = render(
      selectDataSourceDetailPanel({
        ...defaultProps,
        action: failed,
      })
    );
    const associationButton = getAllByRole('button', {
      name: 'Associate OpenSearch connections',
    })[0];
    await waitFor(() => {
      expect(associationButton).toBeInTheDocument();
    });
    fireEvent.click(associationButton);
    await waitFor(() => {
      expect(
        getByText(
          'Add data sources that will be available in the workspace. If a selected data source has related Direct Query connection, they will also be available in the workspace.'
        )
      ).toBeInTheDocument();
      expect(getByText('Data Source 2')).toBeInTheDocument();
    });
    fireEvent.click(getByText('Data Source 2'));
    await waitFor(() => {
      const button = getByTestId('workspace-detail-dataSources-associateModal-save-button');
      expect(button).toBeInTheDocument();
      expect(button).toBeEnabled();
      fireEvent.click(getByTestId('workspace-detail-dataSources-associateModal-save-button'));
    });
    expect(notificationToastsAddDanger).toHaveBeenCalled();
  });

  it('should close associate data sources modal', async () => {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      value: 600,
    });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      value: 600,
    });
    jest.spyOn(utils, 'getDataSourcesList').mockResolvedValue([]);
    jest.spyOn(utils, 'fetchDataSourceConnections').mockResolvedValueOnce([]);
    const { getByText, queryByText, getAllByRole } = render(
      selectDataSourceDetailPanel(defaultProps)
    );
    const associationButton = getAllByRole('button', {
      name: 'Associate OpenSearch connections',
    })[0];
    await waitFor(() => {
      expect(associationButton).toBeInTheDocument();
    });
    fireEvent.click(associationButton);
    await waitFor(() => {
      expect(
        getByText(
          'Add data sources that will be available in the workspace. If a selected data source has related Direct Query connection, they will also be available in the workspace.'
        )
      ).toBeInTheDocument();
    });
    fireEvent.click(getByText('Close'));
    expect(
      queryByText(
        'Add data sources that will be available in the workspace. If a selected data source has related Direct Query connection, they will also be available in the workspace.'
      )
    ).toBeNull();
  });

  it('should success to remove data sources', async () => {
    jest
      .spyOn(utils, 'fetchDataSourceConnections')
      .mockResolvedValueOnce([dataSourceConnectionsMock[0]]);
    const { getByText, getByTestId, getByRole } = render(
      selectDataSourceDetailPanel({
        ...defaultProps,
        assignedDataSources: [dataSources[0]],
        action: success,
      })
    );
    await waitFor(() => {
      expect(getByText('Data Source 1')).toBeInTheDocument();
    });
    const removeButton = getByTestId('workspace-detail-dataSources-table-actions-remove');
    fireEvent.click(removeButton);
    const confirButton = getByRole('button', { name: 'Remove data source(s)' });
    expect(confirButton).toBeInTheDocument();
    fireEvent.click(confirButton);
    await waitFor(() => {
      expect(notificationToastsAddSuccess).toHaveBeenCalled();
    });
  });

  it('should fail to remove data sources', async () => {
    jest
      .spyOn(utils, 'fetchDataSourceConnections')
      .mockResolvedValueOnce([dataSourceConnectionsMock[0]]);
    const { getByText, getByTestId, getByRole } = render(
      selectDataSourceDetailPanel({
        ...defaultProps,
        assignedDataSources: [dataSources[0]],
        action: failed,
      })
    );
    await waitFor(() => {
      expect(getByText('Data Source 1')).toBeInTheDocument();
    });
    const removeButton = getByTestId('workspace-detail-dataSources-table-actions-remove');
    fireEvent.click(removeButton);
    const confirButton = getByRole('button', { name: 'Remove data source(s)' });
    expect(confirButton).toBeInTheDocument();
    fireEvent.click(confirButton);
    await waitFor(() => {
      expect(notificationToastsAddDanger).toHaveBeenCalled();
    });
  });

  it('should remove selected data sources successfully', async () => {
    jest
      .spyOn(utils, 'fetchDataSourceConnections')
      .mockResolvedValueOnce([dataSourceConnectionsMock[0]]);
    const { getByText, queryByTestId, getAllByRole, getByRole } = render(
      selectDataSourceDetailPanel({
        ...defaultProps,
        assignedDataSources: [dataSources[0]],
        action: success,
      })
    );
    await waitFor(() => {
      expect(getByText('Data Source 1')).toBeInTheDocument();
    });
    expect(queryByTestId('workspace-detail-dataSources-table-bulkRemove')).toBeNull();
    const checkbox = getAllByRole('checkbox')[0];

    // Simulate clicking the checkbox
    fireEvent.click(checkbox);
    expect(getByText('Remove 1 association(s)')).toBeInTheDocument();
    fireEvent.click(getByText('Remove 1 association(s)'));
    fireEvent.click(getByRole('button', { name: 'Remove data source(s)' }));
    await waitFor(() => {
      expect(notificationToastsAddSuccess).toHaveBeenCalled();
    });
  });

  it('should handle input in the search box', async () => {
    jest.spyOn(utils, 'fetchDataSourceConnections').mockResolvedValue(dataSourceConnectionsMock);
    const { getByText, queryByText } = render(
      selectDataSourceDetailPanel({
        ...defaultProps,
        assignedDataSources: dataSources,
      })
    );
    await waitFor(() => {
      expect(getByText('Data Source 1')).toBeInTheDocument();
      expect(getByText('Data Source 2')).toBeInTheDocument();

      const searchInput = screen.getByPlaceholderText('Search...');
      // Simulate typing in the search input
      fireEvent.change(searchInput, { target: { value: 'Data Source 1' } });
      expect(getByText('Data Source 1')).toBeInTheDocument();
      expect(queryByText('Data Source 2')).toBeNull();
    });
  });
});
