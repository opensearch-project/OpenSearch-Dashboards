/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiBadge, EuiButtonEmpty, EuiBadgeGroup } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { RouteComponentProps } from 'react-router-dom';
import { SavedObjectsClientContract } from 'opensearch-dashboards/public';
import { reactRouterNavigate } from '../../../../../opensearch_dashboards_react/public';
import { DataScopeCell } from '../data_scope_cell';

interface GetDatasetTableColumnsParams {
  history: RouteComponentProps['history'];
  useUpdatedUX: boolean;
  savedObjectsClient: SavedObjectsClientContract;
}

export const getDatasetTableColumns = ({
  history,
  useUpdatedUX,
  savedObjectsClient,
}: GetDatasetTableColumnsParams) => {
  return [
    {
      field: 'displayName',
      name: i18n.translate('datasetManagement.datasetTable.nameColumn', {
        defaultMessage: 'Name',
      }),
      render: (
        displayName: string | undefined,
        dataset: {
          id: string;
          title: string;
          displayName?: string;
          tags?: Array<{
            key: string;
            name: string;
          }>;
        }
      ) => (
        <>
          <EuiButtonEmpty
            size="xs"
            {...reactRouterNavigate(history, `patterns/${encodeURIComponent(dataset.id)}`)}
            {...(useUpdatedUX ? { textProps: { style: { fontWeight: 600 } } } : {})}
          >
            {displayName || dataset.title}
          </EuiButtonEmpty>
          &emsp;
          <EuiBadgeGroup gutterSize="s">
            {dataset.tags &&
              dataset.tags.map(({ key: tagKey, name: tagName }) => (
                <EuiBadge key={tagKey}>{tagName}</EuiBadge>
              ))}
          </EuiBadgeGroup>
        </>
      ),
      dataType: 'string' as const,
      sortable: ({ sort }: { sort: string }) => sort,
    },
    {
      field: 'signalType',
      name: i18n.translate('datasetManagement.datasetTable.typeColumn', {
        defaultMessage: 'Type',
      }),
      dataType: 'string' as const,
      sortable: true,
    },
    {
      field: 'title',
      name: i18n.translate('datasetManagement.datasetTable.dataColumn', {
        defaultMessage: 'Data',
      }),
      render: (
        datasetTitle: string,
        dataset: {
          title: string;
          referenceId?: string;
        }
      ) => (
        <DataScopeCell
          title={datasetTitle}
          dataSourceId={dataset.referenceId}
          savedObjectsClient={savedObjectsClient}
        />
      ),
      dataType: 'string' as const,
      sortable: true,
    },
    {
      field: 'description',
      name: i18n.translate('datasetManagement.datasetTable.descriptionColumn', {
        defaultMessage: 'Description',
      }),
      dataType: 'string' as const,
      sortable: true,
      truncateText: true,
    },
  ];
};
