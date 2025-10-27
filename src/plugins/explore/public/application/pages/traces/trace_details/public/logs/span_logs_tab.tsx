/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import {
  EuiPanel,
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLoadingSpinner,
  EuiTitle,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { LogHit } from '../../server/ppl_request_logs';
import { Dataset } from '../../../../../../../../data/common';
import { buildExploreLogsUrl, getTimeRangeFromTraceData, filterLogsBySpanId } from './url_builder';
import { DatasetAccordionList } from './dataset_accordion_list';

export interface SpanLogsTabProps {
  traceId: string;
  spanId: string;
  logDatasets: Dataset[];
  datasetLogs: Record<string, LogHit[]>;
  isLoading: boolean;
  traceDataset?: Dataset;
}

export const SpanLogsTab: React.FC<SpanLogsTabProps> = ({
  traceId,
  spanId,
  logDatasets,
  datasetLogs,
  isLoading,
  traceDataset,
}) => {
  // Filter dataset logs to only include logs for this specific span
  const spanFilteredDatasetLogs = useMemo(() => {
    if (!datasetLogs || typeof datasetLogs !== 'object') {
      return {};
    }

    const filtered: Record<string, LogHit[]> = {};
    Object.keys(datasetLogs).forEach((datasetId) => {
      // Find the corresponding dataset for this datasetId
      const dataset = logDatasets.find((ds) => ds.id === datasetId);
      if (dataset) {
        filtered[datasetId] = filterLogsBySpanId(datasetLogs[datasetId], spanId, dataset);
      }
    });
    return filtered;
  }, [datasetLogs, spanId, logDatasets]);

  const handleViewInExplore = (logDataset: Dataset, logs: LogHit[]) => {
    try {
      const timeRange = getTimeRangeFromTraceData(logs);

      const url = buildExploreLogsUrl({
        traceId,
        spanId, // Include span ID for filtering
        logDataset,
        timeRange,
      });

      window.location.href = url;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to generate logs URL:', error);
    }
  };

  if (isLoading) {
    return (
      <EuiPanel>
        <EuiFlexGroup justifyContent="center" alignItems="center" style={{ minHeight: 200 }}>
          <EuiFlexItem grow={false}>
            <EuiLoadingSpinner size="l" data-test-subj="loading-spinner" />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    );
  }

  if (logDatasets.length === 0) {
    return (
      <EuiPanel>
        <EuiTitle size="s">
          <h3>
            {i18n.translate('explore.spanLogsTab.title', {
              defaultMessage: 'Span Logs',
            })}
          </h3>
        </EuiTitle>
        <EuiSpacer size="m" />
        <EuiText size="s" color="subdued">
          {i18n.translate('explore.spanLogsTab.noDatasets', {
            defaultMessage: 'No log datasets found for this span',
          })}
        </EuiText>
      </EuiPanel>
    );
  }

  return (
    <div>
      <EuiPanel>
        <EuiTitle size="s">
          <h3>
            {i18n.translate('explore.spanLogsTab.relatedLogs', {
              defaultMessage: 'Related logs for span',
            })}
          </h3>
        </EuiTitle>
        <EuiText size="s" color="subdued">
          {i18n.translate('explore.spanLogsTab.description', {
            defaultMessage: 'View logs related to this specific span',
          })}
        </EuiText>
        <EuiSpacer size="m" />

        <DatasetAccordionList
          logDatasets={logDatasets}
          datasetLogs={spanFilteredDatasetLogs}
          onViewInExplore={handleViewInExplore}
          testSubjPrefix="span-logs"
          traceDataset={traceDataset}
        />
      </EuiPanel>
    </div>
  );
};
