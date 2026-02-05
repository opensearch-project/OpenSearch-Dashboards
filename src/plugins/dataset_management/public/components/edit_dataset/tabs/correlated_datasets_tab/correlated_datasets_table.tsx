/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  EuiInMemoryTable,
  // @ts-expect-error TS6133 TODO(ts-error): fixme
  EuiButtonIcon,
  // @ts-expect-error TS6133 TODO(ts-error): fixme
  EuiFlexGroup,
  // @ts-expect-error TS6133 TODO(ts-error): fixme
  EuiFlexItem,
  EuiToolTip,
  EuiConfirmModal,
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

interface CorrelatedDatasetsTableProps {
  correlations: CorrelationSavedObject[];
  onEdit: (correlation: CorrelationSavedObject) => void;
  onDelete: (correlationId: string) => void;
  loading?: boolean;
  message?: React.ReactNode;
}

export const CorrelatedDatasetsTable: React.FC<CorrelatedDatasetsTableProps> = ({
  correlations,
  onEdit,
  onDelete,
  loading = false,
  message,
}) => {
  // @ts-expect-error TS6133 TODO(ts-error): fixme
  const { data, uiSettings, savedObjects } = useOpenSearchDashboards<
    DatasetManagmentContext
  >().services;
  const [correlationToDelete, setCorrelationToDelete] = useState<string | null>(null);
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
            // Use displayName if available, fallback to title
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
      name: i18n.translate('datasetManagement.correlatedDatasets.table.correlationType', {
        defaultMessage: 'Correlation type',
      }),
      render: (correlationType: string) => {
        return getCorrelationTypeDisplay(correlationType);
      },
    },
    {
      field: 'id',
      name: i18n.translate('datasetManagement.correlatedDatasets.table.traceDataset', {
        defaultMessage: 'Trace dataset',
      }),
      truncateText: true,
      render: (_: string, correlation: CorrelationSavedObject) => {
        const { traceDatasetId } = extractDatasetIdsFromEntities(
          correlation.attributes.entities,
          correlation.references
        );
        const title = datasetTitles[traceDatasetId] || traceDatasetId;

        return (
          <EuiToolTip content={title}>
            <span>{title}</span>
          </EuiToolTip>
        );
      },
    },
    {
      field: 'id',
      name: i18n.translate('datasetManagement.correlatedDatasets.table.logsDatasets', {
        defaultMessage: 'Logs datasets',
      }),
      truncateText: true,
      render: (_: string, correlation: CorrelationSavedObject) => {
        const { logDatasetIds } = extractDatasetIdsFromEntities(
          correlation.attributes.entities,
          correlation.references
        );

        const names = logDatasetIds.map((datasetId) => datasetTitles[datasetId] || datasetId);
        const displayText = names.join(', ');

        return (
          <EuiToolTip content={displayText}>
            <span>{displayText}</span>
          </EuiToolTip>
        );
      },
    },
    {
      field: 'updated_at',
      name: i18n.translate('datasetManagement.correlatedDatasets.table.lastUpdated', {
        defaultMessage: 'Last updated',
      }),
      render: (updatedAt: string) => {
        return moment(updatedAt).format(dateFormat);
      },
    },
    {
      name: i18n.translate('datasetManagement.correlatedDatasets.table.actions', {
        defaultMessage: 'Actions',
      }),
      actions: [
        {
          name: i18n.translate('datasetManagement.correlatedDatasets.table.editAction', {
            defaultMessage: 'Edit',
          }),
          description: i18n.translate(
            'datasetManagement.correlatedDatasets.table.editActionDescription',
            {
              defaultMessage: 'Edit this correlation',
            }
          ),
          icon: 'pencil',
          type: 'icon',
          onClick: (correlation: CorrelationSavedObject) => onEdit(correlation),
          'data-test-subj': 'editCorrelationButton',
        },
        {
          name: i18n.translate('datasetManagement.correlatedDatasets.table.deleteAction', {
            defaultMessage: 'Delete',
          }),
          description: i18n.translate(
            'datasetManagement.correlatedDatasets.table.deleteActionDescription',
            {
              defaultMessage: 'Delete this correlation',
            }
          ),
          icon: 'trash',
          type: 'icon',
          color: 'danger',
          onClick: (correlation: CorrelationSavedObject) => setCorrelationToDelete(correlation.id),
          'data-test-subj': 'deleteCorrelationButton',
        },
      ],
    },
  ];

  return (
    <>
      <EuiInMemoryTable
        items={correlations}
        // @ts-expect-error TS2322 TODO(ts-error): fixme
        columns={columns}
        loading={loading}
        message={message}
        data-test-subj="correlatedDatasetsTable"
      />

      {correlationToDelete && (
        <EuiConfirmModal
          title={i18n.translate('datasetManagement.correlatedDatasets.deleteModal.title', {
            defaultMessage: 'Delete correlation?',
          })}
          onCancel={() => setCorrelationToDelete(null)}
          onConfirm={() => {
            onDelete(correlationToDelete);
            setCorrelationToDelete(null);
          }}
          cancelButtonText={i18n.translate(
            'datasetManagement.correlatedDatasets.deleteModal.cancel',
            {
              defaultMessage: 'Cancel',
            }
          )}
          confirmButtonText={i18n.translate(
            'datasetManagement.correlatedDatasets.deleteModal.confirm',
            {
              defaultMessage: 'Delete',
            }
          )}
          buttonColor="danger"
          defaultFocusedButton="confirm"
        >
          <p>
            {i18n.translate('datasetManagement.correlatedDatasets.deleteModal.description', {
              defaultMessage:
                'This action will permanently delete the correlation. This cannot be undone.',
            })}
          </p>
        </EuiConfirmModal>
      )}
    </>
  );
};
