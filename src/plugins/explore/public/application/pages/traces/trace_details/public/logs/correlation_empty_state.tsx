/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiEmptyPrompt, EuiButton, EuiText, EuiSpacer } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { Dataset } from '../../../../../../../../data/common';

export interface CorrelationEmptyStateProps {
  traceDataset?: Dataset;
}

/**
 * Generates a dynamic URL for the datasets patterns page with correlated datasets tab
 * @param datasetId - Dataset ID to navigate to
 * @returns Formatted datasets patterns URL or '#' if datasetId is missing
 */
function generateDatasetUrl(datasetId: string | null): string {
  if (!datasetId) {
    return '#';
  }

  // Use window.location to construct the URL properly
  const { protocol, host, pathname } = window.location;

  // Extract the base path up to /app/ (includes workspace context)
  const appIndex = pathname.indexOf('/app/');
  if (appIndex === -1) {
    return '#';
  }

  const basePath = pathname.substring(0, appIndex);

  // Construct the datasets patterns URL with proper base path
  return `${protocol}//${host}${basePath}/app/datasets/patterns/${datasetId}#/?_a=(tab:correlatedDatasets)`;
}

export const CorrelationEmptyState: React.FC<CorrelationEmptyStateProps> = ({ traceDataset }) => {
  const handleCreateFromTracesDataset = () => {
    const url = generateDatasetUrl(traceDataset?.id || null);
    if (url !== '#') {
      window.location.href = url;
    }
  };
  // TODO: Update the link
  // const handleLearnMore = () => {
  //   const url = generateDatasetUrl(traceDataset?.id || null);
  //   if (url !== '#') {
  //     window.open(url, '_blank');
  //   }
  // };

  return (
    <EuiEmptyPrompt
      title={
        <h3>
          {i18n.translate('explore.logs.emptyState.correlationNotConfigured', {
            defaultMessage: 'Correlation not configured',
          })}
        </h3>
      }
      titleSize="xs"
      body={
        <>
          <EuiText size="s" color="subdued">
            {i18n.translate('explore.logs.emptyState.correlationDescription', {
              defaultMessage: 'To view related logs, create a trace correlation with log data.',
            })}
          </EuiText>
          <EuiSpacer size="m" />
          <EuiButton size="s" onClick={handleCreateFromTracesDataset} disabled={!traceDataset?.id}>
            {i18n.translate('explore.logs.emptyState.createFromTracesDataset', {
              defaultMessage: 'Create from traces dataset',
            })}
          </EuiButton>
          <EuiSpacer size="m" />
          {/* TODO */}
          {/* <EuiText size="s">
            {i18n.translate('explore.logs.emptyState.needHelp', {
              defaultMessage: 'Need help?',
            })}{' '}
            <EuiLink onClick={handleLearnMore} disabled={!traceDataset?.id}>
              {i18n.translate('explore.logs.emptyState.learnAboutDataCorrelation', {
                defaultMessage: 'Learn about data correlation',
              })}
            </EuiLink>
          </EuiText> */}
        </>
      }
    />
  );
};
