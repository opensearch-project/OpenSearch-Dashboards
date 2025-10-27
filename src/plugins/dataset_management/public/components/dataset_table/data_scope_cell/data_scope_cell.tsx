/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './data_scope_cell.scss';

import React from 'react';
import { EuiIcon } from '@elastic/eui';
import { useDataSourceTitle } from '../../hooks/use_data_source_title';

interface SavedObjectsClient {
  get: (type: string, id: string) => Promise<{ attributes: any }>;
}

interface DataScopeCellProps {
  title: string;
  dataSourceId?: string;
  savedObjectsClient: SavedObjectsClient;
}

export const DataScopeCell: React.FC<DataScopeCellProps> = ({
  title,
  dataSourceId,
  savedObjectsClient,
}) => {
  const { dataSourceTitle, isLoading } = useDataSourceTitle(savedObjectsClient, dataSourceId);

  // Get data source icon based on type
  const getDataSourceIcon = () => {
    // Default to database icon for OpenSearch and other data sources
    // TODO: Return different icons based on data source type (e.g., S3, Prometheus)
    return 'database';
  };

  const iconType = getDataSourceIcon();
  const dataSourceName = isLoading ? 'Loading...' : dataSourceTitle || 'N/A';

  return (
    <div className="dataScopeCell">
      {dataSourceId && (
        <div className="dataScopeCell__dataSource">
          <EuiIcon type={iconType} size="m" className="dataScopeCell__icon" />
          {dataSourceName}
        </div>
      )}
      <div className="dataScopeCell__title">{title || 'N/A'}</div>
    </div>
  );
};
