/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { EuiSpacer, EuiCallOut, EuiFlexGroup, EuiFlexItem, EuiLoadingSpinner } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { DataView } from '../../../../../../data/public';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { DatasetManagmentContext } from '../../../../types';
import { useCorrelations } from '../../../../hooks/use_correlations';
import { CorrelationSavedObject } from '../../../../types/correlations';
import { EmptyState } from './empty_state';
import { CorrelatedTracesTable } from './correlated_traces_table';
import { ViewCorrelationModal } from './view_correlation_modal';

interface CorrelatedTracesTabProps {
  dataset: DataView;
}

export const CorrelatedTracesTab: React.FC<CorrelatedTracesTabProps> = ({ dataset }) => {
  const { savedObjects, application } = useOpenSearchDashboards<DatasetManagmentContext>().services;
  const history = useHistory();
  const [viewingCorrelation, setViewingCorrelation] = useState<CorrelationSavedObject | null>(null);

  const { correlations, loading, error } = useCorrelations(savedObjects.client, {
    datasetId: dataset.id,
  });

  const handleView = useCallback((correlation: CorrelationSavedObject) => {
    setViewingCorrelation(correlation);
  }, []);

  const handleCloseModal = useCallback(() => {
    setViewingCorrelation(null);
  }, []);

  const handleNavigateToTraceDataset = useCallback(
    (traceDatasetId: string) => {
      // Navigate to the trace dataset's correlated datasets tab
      application.navigateToApp('datasets', {
        path: `/patterns/${traceDatasetId}#/?_a=(tab:correlatedDatasets)`,
      });
    },
    [application]
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
          title={i18n.translate('datasetManagement.correlatedTraces.errorTitle', {
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

  return (
    <>
      {correlations.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <EuiSpacer size="m" />
          <CorrelatedTracesTable
            correlations={correlations}
            currentDatasetId={dataset.id || ''}
            onView={handleView}
            onNavigateToTraceDataset={handleNavigateToTraceDataset}
          />
        </>
      )}

      {viewingCorrelation && (
        <ViewCorrelationModal
          correlation={viewingCorrelation}
          currentDatasetId={dataset.id || ''}
          onClose={handleCloseModal}
          onEditInTraceDataset={handleNavigateToTraceDataset}
        />
      )}
    </>
  );
};
