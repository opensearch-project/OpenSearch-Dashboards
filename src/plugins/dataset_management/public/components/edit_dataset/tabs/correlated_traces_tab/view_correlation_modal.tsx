/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiModal,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiModalBody,
  EuiModalFooter,
  EuiButton,
  EuiButtonEmpty,
  EuiFormRow,
  EuiFieldText,
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiBadge,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { CorrelationSavedObject } from '../../../../types/correlations';

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
  const traceDatasetId = correlation.references[0]?.id || '';
  const logDatasetIds = correlation.references.slice(1).map((ref) => ref.id);

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
        {/* Trace Dataset */}
        <EuiFormRow
          label={i18n.translate('datasetManagement.correlatedTraces.viewModal.traceDatasetLabel', {
            defaultMessage: 'Trace dataset',
          })}
          fullWidth
        >
          <EuiFieldText
            value={traceDatasetId}
            readOnly
            fullWidth
            data-test-subj="traceDatasetField"
          />
        </EuiFormRow>

        <EuiSpacer size="m" />

        {/* Correlated Logs Datasets */}
        <EuiFormRow
          label={i18n.translate('datasetManagement.correlatedTraces.viewModal.logsDatasetLabel', {
            defaultMessage: 'Correlated logs datasets',
          })}
          helpText={i18n.translate('datasetManagement.correlatedTraces.viewModal.logsDatasetHelp', {
            defaultMessage: 'Your current dataset is highlighted.',
          })}
          fullWidth
        >
          <EuiFlexGroup gutterSize="s" wrap>
            {logDatasetIds.map((datasetId) => (
              <EuiFlexItem key={datasetId} grow={false}>
                <EuiBadge color={datasetId === currentDatasetId ? 'primary' : 'hollow'}>
                  {datasetId}
                </EuiBadge>
              </EuiFlexItem>
            ))}
          </EuiFlexGroup>
        </EuiFormRow>
      </EuiModalBody>

      <EuiModalFooter>
        <EuiButtonEmpty onClick={onClose} data-test-subj="closeViewModalButton">
          {i18n.translate('datasetManagement.correlatedTraces.viewModal.closeButton', {
            defaultMessage: 'Close',
          })}
        </EuiButtonEmpty>

        <EuiButton
          onClick={() => onEditInTraceDataset(traceDatasetId)}
          fill
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
