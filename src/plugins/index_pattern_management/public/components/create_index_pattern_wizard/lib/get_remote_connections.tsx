/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpSetup } from 'src/core/public';
import { EuiBadge, EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import React from 'react';
import { DataSourceTableItem } from '../types';
import {
  OPENSEARCH_CROSS_CLUSTER_SEARCH,
  SUPPORTED_REMOTE_CLUSTER_DATASOURCE_ENGINE_TYPES,
} from '../constants';
import './remote_connections.scss';

export const getRemoteClusterConnections = async (
  dataSource: DataSourceTableItem,
  http: HttpSetup
): Promise<DataSourceTableItem[]> => {
  try {
    const response = await http.get(`/api/enhancements/remote_cluster/list`, {
      query: {
        dataSourceId: dataSource?.id ?? null,
      },
    });

    return (
      response.map((remoteClusterConnection: { connectionAlias: any }) => {
        return {
          id: `${dataSource.id}-${remoteClusterConnection.connectionAlias}`,
          title: remoteClusterConnection.connectionAlias,
          label: remoteClusterConnection.connectionAlias,
          type: 'Opensearch cross-cluster Search',
          engine: OPENSEARCH_CROSS_CLUSTER_SEARCH,
          parentId: dataSource.id,
          datasourceversion: dataSource.datasourceversion,
          installedplugins: dataSource.installedplugins,
          disabled: true,
          prepend: <div className="remote_connection_alignment" />,
          append: (
            <EuiText size="s">
              {i18n.translate(
                'indexPatternManagement.createIndexPatternWizard.dataSource.description',
                {
                  defaultMessage: 'Opensearch cross-cluster Search',
                }
              )}
            </EuiText>
          ),
        };
      }) ?? []
    );
  } catch (error) {
    return []; // Return an empty array if the request fails
  }
};

export const populateRemoteClusterConnectionForDatasources = async (
  datasources: DataSourceTableItem[],
  http: HttpSetup
): Promise<DataSourceTableItem[]> => {
  const remoteConnectionsPromises = datasources.map((ds) => {
    if (SUPPORTED_REMOTE_CLUSTER_DATASOURCE_ENGINE_TYPES.includes(ds.engine)) {
      return getRemoteClusterConnections(ds, http);
    }
    return []; // Return an empty array for unsupported data sources
  });

  const remoteConnections = (await Promise.all(remoteConnectionsPromises)).flat();

  // Add the remote connections to the data source
  return datasources.map((ds) => {
    const relatedCrossClusterConnections = remoteConnections.filter(
      (connection) => connection.parentId === ds.id
    );

    return {
      ...ds,
      relatedDataSourceConnection: relatedCrossClusterConnections,
      append: !!relatedCrossClusterConnections.length ? (
        <EuiBadge>
          {i18n.translate(
            'indexPatternManagement.createIndexPatternWizard.form.selectDataSource.crossClusterOptionBadge',
            {
              defaultMessage: '+ {relatedConnections} Cross cluster connection',
              values: {
                relatedConnections: relatedCrossClusterConnections.length,
              },
            }
          )}
        </EuiBadge>
      ) : null,
    };
  });
};
