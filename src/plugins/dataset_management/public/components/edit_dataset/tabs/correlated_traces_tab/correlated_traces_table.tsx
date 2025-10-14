/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  EuiInMemoryTable,
  EuiFlexGroup,
  EuiFlexItem,
  EuiBadge,
  EuiLink,
  EuiToolTip,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import moment from 'moment';
import { CorrelationSavedObject } from '../../../../types/correlations';
import {
  extractDatasetIdsFromEntities,
  getCorrelationTypeDisplay,
} from '../../../../utils/correlation_display';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { DatasetManagmentContext } from '../../../../types';

interface CorrelatedTracesTableProps {
  correlations: CorrelationSavedObject[];
  currentDatasetId: string;
  onView: (correlation: CorrelationSavedObject) => void;
  onNavigateToTraceDataset: (traceDatasetId: string) => void;
  loading?: boolean;
}

export const CorrelatedTracesTable: React.FC<CorrelatedTracesTableProps> = ({
  correlations,
  currentDatasetId,
  onView,
  onNavigateToTraceDataset,
  loading = false,
}) => {
  const { data, uiSettings, savedObjects } = useOpenSearchDashboards<
    DatasetManagmentContext
  >().services;
  const [datasetTitles, setDatasetTitles] = useState<Record<string, string>>({});

  const dateFormat = useMemo(() => uiSettings.get('dateFormat'), [uiSettings]);

  // Fetch dataset titles for all datasets referenced in correlations
  useEffect(() => {
    const fetchDatasetTitles = async () => {
      const allDatasetIds = new Set<string>();

      correlations.forEach((corr) => {
        const { traceDatasetId, logDatasetIds } = extractDatasetIdsFromEntities(
          corr.attributes.entities,
          corr.references
        );
        if (traceDatasetId) allDatasetIds.add(traceDatasetId);
        logDatasetIds.forEach((id) => allDatasetIds.add(id));
      });

      const titles: Record<string, string> = {};
      await Promise.all(
        Array.from(allDatasetIds).map(async (id) => {
          try {
            const savedObject = await savedObjects.client.get('index-pattern', id);
            const attributes = savedObject.attributes as any;
            // Use displayName if available, otherwise fall back to title
            titles[id] = attributes.displayName || attributes.title || id;
          } catch (err) {
            titles[id] = id; // Fallback to ID if fetch fails
          }
        })
      );

      setDatasetTitles(titles);
    };

    if (correlations.length > 0) {
      fetchDatasetTitles();
    }
  }, [correlations, savedObjects]);

  const columns = [
    {
      field: 'attributes.correlationType',
      name: i18n.translate('datasetManagement.correlatedTraces.table.correlationType', {
        defaultMessage: 'Correlation type',
      }),
      render: (correlationType: string) => {
        return getCorrelationTypeDisplay(correlationType);
      },
    },
    {
      field: 'id',
      name: i18n.translate('datasetManagement.correlatedTraces.table.traceDataset', {
        defaultMessage: 'Trace dataset',
      }),
      render: (_: string, correlation: CorrelationSavedObject) => {
        const { traceDatasetId } = extractDatasetIdsFromEntities(
          correlation.attributes.entities,
          correlation.references
        );
        const title = datasetTitles[traceDatasetId] || traceDatasetId;

        return (
          <EuiToolTip content={title}>
            <EuiLink
              onClick={() => onNavigateToTraceDataset(traceDatasetId)}
              style={{
                maxWidth: '200px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'inline-block',
              }}
            >
              {title}
            </EuiLink>
          </EuiToolTip>
        );
      },
    },
    {
      field: 'id',
      name: i18n.translate('datasetManagement.correlatedTraces.table.logsDatasets', {
        defaultMessage: 'Logs datasets',
      }),
      render: (_: string, correlation: CorrelationSavedObject) => {
        const { logDatasetIds } = extractDatasetIdsFromEntities(
          correlation.attributes.entities,
          correlation.references
        );

        return (
          <EuiFlexGroup gutterSize="xs" wrap>
            {logDatasetIds.map((datasetId) => {
              const title = datasetTitles[datasetId] || datasetId;
              const isCurrentDataset = datasetId === currentDatasetId;

              return (
                <EuiFlexItem key={datasetId} grow={false}>
                  <EuiToolTip content={title}>
                    <span
                      style={{
                        maxWidth: '150px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'inline-block',
                        fontWeight: isCurrentDataset ? 'bold' : 'normal',
                      }}
                    >
                      {title}
                      {isCurrentDataset && ' (current)'}
                    </span>
                  </EuiToolTip>
                </EuiFlexItem>
              );
            })}
          </EuiFlexGroup>
        );
      },
    },
    {
      field: 'updated_at',
      name: i18n.translate('datasetManagement.correlatedTraces.table.lastUpdated', {
        defaultMessage: 'Last updated',
      }),
      render: (updatedAt: string) => {
        return moment(updatedAt).format(dateFormat);
      },
      sortable: true,
    },
    {
      name: i18n.translate('datasetManagement.correlatedTraces.table.actions', {
        defaultMessage: 'Actions',
      }),
      actions: [
        {
          name: i18n.translate('datasetManagement.correlatedTraces.table.viewAction', {
            defaultMessage: 'View',
          }),
          description: i18n.translate(
            'datasetManagement.correlatedTraces.table.viewActionDescription',
            {
              defaultMessage: 'View this correlation',
            }
          ),
          icon: 'inspect',
          type: 'icon',
          onClick: (correlation: CorrelationSavedObject) => onView(correlation),
          'data-test-subj': 'viewCorrelationButton',
        },
      ],
    },
  ];

  const search = {
    box: {
      incremental: true,
      schema: true,
    },
  };

  return (
    <EuiInMemoryTable
      items={correlations}
      columns={columns}
      search={search}
      pagination={{
        pageSizeOptions: [10, 25, 50],
        initialPageSize: 10,
      }}
      sorting={{
        sort: {
          field: 'updated_at',
          direction: 'desc',
        },
      }}
      loading={loading}
      data-test-subj="correlatedTracesTable"
    />
  );
};
