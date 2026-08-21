/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  EuiModal,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiModalBody,
  EuiInMemoryTable,
  EuiTableFieldDataColumnType,
  EuiLink,
  EuiLoadingSpinner,
  EuiEmptyPrompt,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { getPromQLResourceClient } from '../../../../../variables/promql_variable_query_utils';
import { DataPublicPluginStart } from '../../../../../../../data/public';

interface MetricExplorerRow {
  name: string;
  type: string;
  description: string;
}

export interface MetricsExplorerModalProps {
  data: DataPublicPluginStart;
  /** Dataset id identifying the PromQL data connection to query. */
  dataConnectionId?: string;
  onClose: () => void;
  /** Called with the selected metric name; the caller is responsible for closing the modal. */
  onSelectMetric: (metric: string) => void;
}

export const MetricsExplorerModal: React.FC<MetricsExplorerModalProps> = ({
  data,
  dataConnectionId,
  onClose,
  onSelectMetric,
}) => {
  const [rows, setRows] = useState<MetricExplorerRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset stale results/errors from a prior dataConnectionId before evaluating the new one,
    // so an old error doesn't permanently block new results and the spinner reappears while
    // switching between valid datasets.
    setError(null);
    setRows(null);

    if (!dataConnectionId) {
      setError(
        i18n.translate('dashboard.variableQueryPanel.metricsExplorerNoDataset', {
          defaultMessage: 'Select a dataset first to browse its metrics.',
        })
      );
      return;
    }

    const client = getPromQLResourceClient(data);
    if (!client) {
      setError(
        i18n.translate('dashboard.variableQueryPanel.metricsExplorerNoClient', {
          defaultMessage: 'PromQL resource client is not available.',
        })
      );
      return;
    }

    let cancelled = false;

    Promise.all([client.getMetrics(dataConnectionId), client.getMetricMetadata(dataConnectionId)])
      .then(([metrics, metadata]) => {
        if (cancelled) return;
        const nextRows: MetricExplorerRow[] = metrics.map((name) => {
          const entry = metadata[name]?.[0];
          return {
            name,
            type: entry?.type ?? '',
            description: entry?.help ?? '',
          };
        });
        setRows(nextRows);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err?.message ||
            i18n.translate('dashboard.variableQueryPanel.metricsExplorerLoadFailed', {
              defaultMessage: 'Failed to load metrics.',
            })
        );
      });

    return () => {
      cancelled = true;
    };
  }, [data, dataConnectionId]);

  const columns: Array<EuiTableFieldDataColumnType<MetricExplorerRow>> = useMemo(
    () => [
      {
        field: 'name',
        name: i18n.translate('dashboard.variableQueryPanel.metricsExplorerNameColumn', {
          defaultMessage: 'Name',
        }),
        sortable: true,
        render: (name: string) => (
          <EuiLink
            onClick={() => onSelectMetric(name)}
            data-test-subj={`metricsExplorerSelect-${name}`}
          >
            {name}
          </EuiLink>
        ),
      },
      {
        field: 'type',
        name: i18n.translate('dashboard.variableQueryPanel.metricsExplorerTypeColumn', {
          defaultMessage: 'Type',
        }),
        sortable: true,
        width: '140px',
      },
      {
        field: 'description',
        name: i18n.translate('dashboard.variableQueryPanel.metricsExplorerDescriptionColumn', {
          defaultMessage: 'Description',
        }),
      },
    ],
    [onSelectMetric]
  );

  const search = useMemo(
    () => ({
      box: {
        incremental: true,
        placeholder: i18n.translate(
          'dashboard.variableQueryPanel.metricsExplorerSearchPlaceholder',
          {
            defaultMessage: 'Search metrics by name...',
          }
        ),
      },
      filters: [
        {
          type: 'field_value_selection' as const,
          field: 'type',
          name: i18n.translate('dashboard.variableQueryPanel.metricsExplorerFilterByType', {
            defaultMessage: 'Filter by type',
          }),
          multiSelect: 'or' as const,
          options: Array.from(new Set((rows ?? []).map((row) => row.type).filter(Boolean))).map(
            (type) => ({ value: type })
          ),
        },
      ],
    }),
    [rows]
  );

  return (
    <EuiModal onClose={onClose} maxWidth={false} data-test-subj="metricsExplorerModal">
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          {i18n.translate('dashboard.variableQueryPanel.metricsExplorerTitle', {
            defaultMessage: 'Metrics explorer',
          })}
        </EuiModalHeaderTitle>
      </EuiModalHeader>
      <EuiModalBody
        style={{
          width: '80vw',
          height: '85vh',
        }}
      >
        {error ? (
          <EuiEmptyPrompt
            iconType="alert"
            color="danger"
            title={
              <h3>
                {i18n.translate('dashboard.variableQueryPanel.metricsExplorerErrorTitle', {
                  defaultMessage: 'Unable to load metrics',
                })}
              </h3>
            }
            body={<EuiText size="s">{error}</EuiText>}
          />
        ) : rows === null ? (
          <EuiEmptyPrompt
            icon={<EuiLoadingSpinner size="xl" />}
            title={
              <h3>
                {i18n.translate('dashboard.variableQueryPanel.metricsExplorerLoadingTitle', {
                  defaultMessage: 'Loading metrics',
                })}
              </h3>
            }
          />
        ) : (
          <EuiInMemoryTable
            items={rows}
            columns={columns}
            search={search}
            pagination={{ pageSizeOptions: [10, 25, 50] }}
            sorting={{ sort: { field: 'name', direction: 'asc' } }}
            data-test-subj="metricsExplorerTable"
          />
        )}
      </EuiModalBody>
    </EuiModal>
  );
};
