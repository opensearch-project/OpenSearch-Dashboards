/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render } from '@testing-library/react';
import { DataSourceConnectionType } from '../../../common/types';
import React from 'react';
import { AssociationDataSourceModalMode } from '../../../common/constants';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { WorkspaceDetailConnectionTable } from './workspace_detail_connection_table';

jest.mock('../../../../opensearch_dashboards_react/public', () => ({
  ...jest.requireActual('../../../../opensearch_dashboards_react/public'),
  useOpenSearchDashboards: jest.fn(),
}));
const handleUnassignDataSources = jest.fn();
const dataSourceConnectionsMock = [
  {
    id: 'ds1',
    name: 'Data Source 1',
    description: 'with relationship',
    connectionType: DataSourceConnectionType.OpenSearchConnection,
    type: 'OpenSearch',
    relatedConnections: [
      {
        id: 'ds1-dqc1',
        name: 'dqc1',
        parentId: 'ds1',
        connectionType: DataSourceConnectionType.DirectQueryConnection,
        type: 'Amazon S3',
      },
      {
        id: 'ds1-dqc2',
        name: 'dqc2',
        parentId: 'ds1',
        connectionType: DataSourceConnectionType.DirectQueryConnection,
        type: 'Prometheus',
      },
    ],
  },
  {
    id: 'ds1-dqc1',
    name: 'dqc1',
    parentId: 'ds1',
    connectionType: DataSourceConnectionType.DirectQueryConnection,
    type: 'Amazon S3',
  },
  {
    id: 'ds1-dqc2',
    name: 'dqc2',
    parentId: 'ds1',
    connectionType: DataSourceConnectionType.DirectQueryConnection,
    type: 'Prometheus',
  },
  {
    id: 'ds2',
    name: 'Data Source 2',
    description: 'with no relationship',
    connectionType: DataSourceConnectionType.OpenSearchConnection,
    type: 'OpenSearch',
  },
];

describe('WorkspaceDetailConnectionTable', () => {
  beforeEach(() => {
    const mockPrepend = jest.fn().mockImplementation((path) => path);
    const mockHttp = {
      basePath: {
        prepend: mockPrepend,
      },
    };
    (useOpenSearchDashboards as jest.Mock).mockImplementation(() => ({
      services: {
        http: mockHttp,
      },
    }));
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  describe('OpenSearch connections', () => {
    it('renders the table with OpenSearch connections', () => {
      const { getByText, queryByText } = render(
        <WorkspaceDetailConnectionTable
          isDashboardAdmin={true}
          connectionType={AssociationDataSourceModalMode.OpenSearchConnections}
          dataSourceConnections={dataSourceConnectionsMock}
          handleUnassignDataSources={handleUnassignDataSources}
        />
      );
      expect(getByText('Data Source 1')).toBeInTheDocument();
      expect(getByText('with relationship')).toBeInTheDocument();
      expect(getByText('2')).toBeInTheDocument();

      expect(getByText('Data Source 2')).toBeInTheDocument();
      expect(getByText('with no relationship')).toBeInTheDocument();

      expect(queryByText('dqc1')).toBeNull();
      expect(queryByText('dqc2')).toBeNull();
    });

    it('should show dqc popover when click the Related connections number ', () => {
      const { getByText } = render(
        <WorkspaceDetailConnectionTable
          isDashboardAdmin={true}
          connectionType={AssociationDataSourceModalMode.OpenSearchConnections}
          dataSourceConnections={dataSourceConnectionsMock}
          handleUnassignDataSources={handleUnassignDataSources}
        />
      );
      expect(getByText('Data Source 1')).toBeInTheDocument();
      expect(getByText('2')).toBeInTheDocument();
      fireEvent.click(getByText('2'));
      expect(getByText('dqc1')).toBeInTheDocument();
      expect(getByText('dqc2')).toBeInTheDocument();
    });

    it('should remove selected OpenSearch connections by dashboard admin', () => {
      const { getByText, queryByTestId, getAllByRole, getByRole } = render(
        <WorkspaceDetailConnectionTable
          isDashboardAdmin={true}
          connectionType={AssociationDataSourceModalMode.OpenSearchConnections}
          dataSourceConnections={dataSourceConnectionsMock}
          handleUnassignDataSources={handleUnassignDataSources}
        />
      );
      expect(getByText('Data Source 1')).toBeInTheDocument();
      expect(queryByTestId('workspace-detail-dataSources-table-bulkRemove')).toBeNull();
      const checkbox = getAllByRole('checkbox');
      expect(checkbox.length).toBeGreaterThan(3);

      // Simulate clicking the checkbox
      fireEvent.click(checkbox[0]);
      expect(getByText('Remove 2 association(s)')).toBeInTheDocument();
      fireEvent.click(getByText('Remove 2 association(s)'));
      fireEvent.click(getByRole('button', { name: 'Remove data source(s)' }));
      expect(handleUnassignDataSources).toHaveBeenCalled();
    });

    it('should remove single OpenSearch connections by dashboard admin', () => {
      const { queryAllByTestId, getByText, getByRole } = render(
        <WorkspaceDetailConnectionTable
          isDashboardAdmin={true}
          connectionType={AssociationDataSourceModalMode.OpenSearchConnections}
          dataSourceConnections={dataSourceConnectionsMock}
          handleUnassignDataSources={handleUnassignDataSources}
        />
      );
      expect(getByText('Data Source 1')).toBeInTheDocument();
      const buttons = queryAllByTestId('workspace-detail-dataSources-table-actions-remove');
      expect(buttons).toHaveLength(2);

      fireEvent.click(buttons[0]);
      fireEvent.click(getByRole('button', { name: 'Cancel' }));
      fireEvent.click(buttons[0]);
      fireEvent.click(getByRole('button', { name: 'Remove data source(s)' }));
      expect(handleUnassignDataSources).toHaveBeenCalled();
    });

    it('should hide remove action iif user is not dashboard admin', () => {
      const { queryByText, queryByTestId, getAllByRole } = render(
        <WorkspaceDetailConnectionTable
          isDashboardAdmin={false}
          connectionType={AssociationDataSourceModalMode.OpenSearchConnections}
          dataSourceConnections={dataSourceConnectionsMock}
          handleUnassignDataSources={handleUnassignDataSources}
        />
      );
      expect(queryByText('Action')).toBeNull();
      expect(queryByTestId('workspace-detail-dataSources-table-actions-remove')).toBeNull();

      const checkbox = getAllByRole('checkbox');
      expect(checkbox[0]).toBeDisabled();
    });
  });

  describe('Direct query connections', () => {
    it('renders the table with Direct query connections', () => {
      const { getByText, queryByText, getByTestId } = render(
        <WorkspaceDetailConnectionTable
          isDashboardAdmin={true}
          connectionType={AssociationDataSourceModalMode.DirectQueryConnections}
          dataSourceConnections={dataSourceConnectionsMock}
          handleUnassignDataSources={handleUnassignDataSources}
        />
      );
      expect(getByText('Data Source 1')).toBeInTheDocument();
      expect(getByText('with relationship')).toBeInTheDocument();
      expect(getByText('2')).toBeInTheDocument();

      expect(queryByText('Data Source 2')).toBeNull();
      expect(queryByText('dqc1')).toBeNull();
      expect(queryByText('dqc2')).toBeNull();

      const expandButton = getByTestId('workspace-detail-dataSources-table-dqc-ds1-expand-button');
      expect(expandButton).toBeInTheDocument();
      fireEvent.click(expandButton);
      expect(getByText('dqc1')).toBeInTheDocument();
      expect(getByText('dqc2')).toBeInTheDocument();
      fireEvent.click(expandButton);
      expect(queryByText('dqc1')).toBeNull();
      expect(queryByText('dqc2')).toBeNull();
    });
  });
});
