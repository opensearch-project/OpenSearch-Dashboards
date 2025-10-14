/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiEmptyPrompt, EuiButton } from '@elastic/eui';
import { i18n } from '@osd/i18n';

interface EmptyStateProps {
  onCreateClick: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onCreateClick }) => {
  return (
    <EuiEmptyPrompt
      title={
        <h4>
          {i18n.translate('datasetManagement.correlatedDatasets.emptyState.title', {
            defaultMessage: 'There are no correlated datasets',
          })}
        </h4>
      }
      titleSize="s"
      body={
        <p>
          {i18n.translate('datasetManagement.correlatedDatasets.emptyState.description', {
            defaultMessage:
              'Create a correlation to link this trace dataset with log datasets for better observability.',
          })}
        </p>
      }
      actions={
        <EuiButton
          data-test-subj="createCorrelationButton"
          onClick={onCreateClick}
          fill
          iconType="plus"
        >
          {i18n.translate('datasetManagement.correlatedDatasets.emptyState.createButton', {
            defaultMessage: 'Create correlation',
          })}
        </EuiButton>
      }
    />
  );
};
