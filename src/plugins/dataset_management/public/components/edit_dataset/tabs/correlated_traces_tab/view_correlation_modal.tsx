/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  EuiModal,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiModalBody,
  EuiModalFooter,
  EuiButton,
  EuiButtonEmpty,
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  // @ts-expect-error TS6133 TODO(ts-error): fixme
  EuiBadge,
  EuiDescriptionList,
  EuiDescriptionListTitle,
  EuiDescriptionListDescription,
  EuiText,
  EuiLoadingSpinner,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { CorrelationSavedObject } from '../../../../types/correlations';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { DatasetManagmentContext } from '../../../../types';
import { extractDatasetIdsFromEntities } from '../../../../utils/correlation_display';

interface ViewCorrelationModalProps {
  correlation: CorrelationSavedObject;
  currentDatasetId: string;
  onClose: () => void;
  onEditInTraceDataset: (traceDatasetId: string) => void;
}

export const ViewCorrelationModal: React.FC<ViewCorrelationModalProps> = ({
  correlation,
  currentDatasetId,
  onClose,
  onEditInTraceDataset,
}) => {
  const { savedObjects } = useOpenSearchDashboards<DatasetManagmentContext>().services;
  const [datasetTitles, setDatasetTitles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Extract dataset IDs
  const { traceDatasetId, logDatasetIds } = extractDatasetIdsFromEntities(
    correlation.attributes.entities,
    correlation.references
  );

  // Fetch display names for all datasets
  useEffect(() => {
    const fetchTitles = async () => {
      setLoading(true);
      const titles: Record<string, string> = {};
      const allDatasetIds = [traceDatasetId, ...logDatasetIds];

      await Promise.all(
        allDatasetIds.map(async (id) => {
          try {
            const savedObject = await savedObjects.client.get('index-pattern', id);
            const attributes = savedObject.attributes as any;
            titles[id] = attributes.displayName || attributes.title || id;
          } catch (err) {
            titles[id] = id; // Fallback to ID if fetch fails
          }
        })
      );

      setDatasetTitles(titles);
      setLoading(false);
    };

    fetchTitles();
  }, [correlation.id, savedObjects.client]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <EuiModal onClose={onClose} maxWidth={600} data-test-subj="viewCorrelationModal">
        <EuiModalHeader>
          <EuiModalHeaderTitle>
            {i18n.translate('datasetManagement.correlatedTraces.viewModal.title', {
              defaultMessage: 'View correlation',
            })}
          </EuiModalHeaderTitle>
        </EuiModalHeader>

        <EuiModalBody>
          <EuiFlexGroup justifyContent="center" alignItems="center" style={{ minHeight: 200 }}>
            <EuiFlexItem grow={false}>
              <EuiLoadingSpinner size="xl" />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiModalBody>

        <EuiModalFooter>
          <EuiButtonEmpty onClick={onClose} data-test-subj="closeViewModalButton">
            {i18n.translate('datasetManagement.correlatedTraces.viewModal.closeButton', {
              defaultMessage: 'Close',
            })}
          </EuiButtonEmpty>
        </EuiModalFooter>
      </EuiModal>
    );
  }

  return (
    <EuiModal onClose={onClose} maxWidth={600} data-test-subj="viewCorrelationModal">
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          {i18n.translate('datasetManagement.correlatedTraces.viewModal.title', {
            defaultMessage: 'View correlation',
          })}
        </EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody>
        {/* Trace Dataset - using Description List */}
        <EuiDescriptionList>
          <EuiDescriptionListTitle>
            {i18n.translate('datasetManagement.correlatedTraces.viewModal.traceDatasetLabel', {
              defaultMessage: 'Trace dataset',
            })}
          </EuiDescriptionListTitle>
          <EuiDescriptionListDescription data-test-subj="traceDatasetName">
            {datasetTitles[traceDatasetId] || traceDatasetId}
          </EuiDescriptionListDescription>
        </EuiDescriptionList>

        <EuiSpacer size="m" />

        {/* Correlated Logs Datasets - using Text */}
        <EuiDescriptionList>
          <EuiDescriptionListTitle>
            {i18n.translate('datasetManagement.correlatedTraces.viewModal.logsDatasetLabel', {
              defaultMessage: 'Correlated logs datasets',
            })}
          </EuiDescriptionListTitle>
          <EuiDescriptionListDescription data-test-subj="logsDatasetNames">
            <EuiText size="s">
              {logDatasetIds.map((datasetId, index) => {
                const name = datasetTitles[datasetId] || datasetId;
                return (
                  <span key={datasetId}>
                    {name}
                    {index < logDatasetIds.length - 1 && ', '}
                  </span>
                );
              })}
            </EuiText>
          </EuiDescriptionListDescription>
        </EuiDescriptionList>
      </EuiModalBody>

      <EuiModalFooter>
        <EuiButtonEmpty onClick={onClose} data-test-subj="closeViewModalButton">
          {i18n.translate('datasetManagement.correlatedTraces.viewModal.closeButton', {
            defaultMessage: 'Close',
          })}
        </EuiButtonEmpty>

        <EuiButton
          onClick={() => onEditInTraceDataset(traceDatasetId)}
          iconType="popout"
          iconSide="right"
          data-test-subj="editInTraceDatasetButton"
        >
          {i18n.translate('datasetManagement.correlatedTraces.viewModal.editButton', {
            defaultMessage: 'Edit in trace dataset',
          })}
        </EuiButton>
      </EuiModalFooter>
    </EuiModal>
  );
};
