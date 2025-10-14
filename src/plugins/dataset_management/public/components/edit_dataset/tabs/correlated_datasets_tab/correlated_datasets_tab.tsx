/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import {
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButton,
  EuiCallOut,
  EuiLoadingSpinner,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { DataView } from '../../../../../../data/public';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { DatasetManagmentContext } from '../../../../types';
import { useCorrelations } from '../../../../hooks/use_correlations';
import { useDeleteCorrelation } from '../../../../hooks/use_correlation_mutations';
import { CorrelationSavedObject } from '../../../../types/correlations';
import { EmptyState } from './empty_state';
import { CorrelatedDatasetsTable } from './correlated_datasets_table';
import { ConfigureCorrelationModal } from './configure_correlation_modal';

interface CorrelatedDatasetsTabProps {
  dataset: DataView;
}

export const CorrelatedDatasetsTab: React.FC<CorrelatedDatasetsTabProps> = ({ dataset }) => {
  const { savedObjects, notifications } = useOpenSearchDashboards<
    DatasetManagmentContext
  >().services;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCorrelation, setEditingCorrelation] = useState<CorrelationSavedObject | null>(null);

  const { correlations, loading, error, refetch } = useCorrelations(savedObjects.client, {
    datasetId: dataset.id,
  });

  const { deleteCorrelation, loading: deleting } = useDeleteCorrelation(savedObjects.client);

  const handleCreateClick = useCallback(() => {
    setEditingCorrelation(null);
    setIsModalOpen(true);
  }, []);

  const handleEditClick = useCallback((correlation: CorrelationSavedObject) => {
    setEditingCorrelation(correlation);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingCorrelation(null);
  }, []);

  const handleSave = useCallback(async () => {
    setIsModalOpen(false);
    setEditingCorrelation(null);
    await refetch();

    notifications.toasts.addSuccess({
      title: i18n.translate('datasetManagement.correlatedDatasets.saveSuccess', {
        defaultMessage: 'Correlation has been {action}',
        values: {
          action: editingCorrelation ? 'updated' : 'created',
        },
      }),
      'data-test-subj': 'correlationSaveSuccessToast',
    });
  }, [editingCorrelation, refetch, notifications]);

  const handleDelete = useCallback(
    async (correlationId: string) => {
      const success = await deleteCorrelation(correlationId);

      if (success) {
        notifications.toasts.addSuccess({
          title: i18n.translate('datasetManagement.correlatedDatasets.deleteSuccess', {
            defaultMessage: 'Correlation has been deleted',
          }),
          'data-test-subj': 'correlationDeleteSuccessToast',
        });
        await refetch();
      } else {
        notifications.toasts.addDanger({
          title: i18n.translate('datasetManagement.correlatedDatasets.deleteError', {
            defaultMessage: 'Failed to delete correlation',
          }),
          'data-test-subj': 'correlationDeleteErrorToast',
        });
      }
    },
    [deleteCorrelation, refetch, notifications]
  );

  if (loading) {
    return (
      <EuiFlexGroup justifyContent="center" alignItems="center" style={{ minHeight: 400 }}>
        <EuiFlexItem grow={false}>
          <EuiLoadingSpinner size="xl" />
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  if (error) {
    return (
      <>
        <EuiSpacer size="m" />
        <EuiCallOut
          title={i18n.translate('datasetManagement.correlatedDatasets.errorTitle', {
            defaultMessage: 'Error loading correlations',
          })}
          color="danger"
          iconType="alert"
        >
          <p>{error.message}</p>
        </EuiCallOut>
      </>
    );
  }

  // A trace dataset can only be part of one correlation
  const hasCorrelation = correlations.length > 0;

  return (
    <>
      {!hasCorrelation ? (
        <EmptyState onCreateClick={handleCreateClick} />
      ) : (
        <>
          <CorrelatedDatasetsTable
            correlations={correlations}
            onEdit={handleEditClick}
            onDelete={handleDelete}
            loading={deleting}
          />
        </>
      )}

      {isModalOpen && (
        <ConfigureCorrelationModal
          traceDataset={dataset}
          existingCorrelation={editingCorrelation}
          onClose={handleCloseModal}
          onSave={handleSave}
        />
      )}
    </>
  );
};
