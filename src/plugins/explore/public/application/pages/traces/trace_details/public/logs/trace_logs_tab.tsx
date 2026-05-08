/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
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
import { DatasetAccordionList } from './dataset_accordion_list';
import { CorrelationEmptyState } from './correlation_empty_state';
import { LogHit } from '../../server/ppl_request_logs';
import { Dataset } from '../../../../../../../../data/common';
import { buildExploreLogsUrl, getTimeRangeFromTraceData } from './url_builder';

export interface TraceLogsTabProps {
  traceId: string;
  logDatasets: Dataset[];
  datasetLogs: Record<string, LogHit[]>;
  isLoading: boolean;
  onSpanClick?: (spanId: string) => void;
  traceDataset?: Dataset;
}

export const TraceLogsTab: React.FC<TraceLogsTabProps> = ({
  traceId,
  logDatasets,
  datasetLogs,
  isLoading,
  onSpanClick,
  traceDataset,
}) => {
  const handleViewInExplore = (logDataset: Dataset, logs: LogHit[]) => {
    try {
      const timeRange = getTimeRangeFromTraceData(logs);

      const url = buildExploreLogsUrl({
        traceId,
        logDataset,
        timeRange,
      });

      // Navigate to the URL
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
            {i18n.translate('explore.traceLogsTab.title', {
              defaultMessage: 'Logs',
            })}
          </h3>
        </EuiTitle>
        <EuiSpacer size="m" />
        <CorrelationEmptyState traceDataset={traceDataset} />
      </EuiPanel>
    );
  }

  return (
    <div>
      <EuiPanel>
        <EuiTitle size="s">
          <h3>
            {i18n.translate('explore.traceRelatedLogsTab.title', {
              defaultMessage: 'Related logs',
            })}
          </h3>
        </EuiTitle>
        <EuiText size="s" color="subdued">
          {i18n.translate('explore.traceLogsTab.description', {
            defaultMessage: 'View logs related with this trace',
          })}
        </EuiText>
        <EuiSpacer size="m" />

        <DatasetAccordionList
          logDatasets={logDatasets}
          datasetLogs={datasetLogs}
          onViewInExplore={handleViewInExplore}
          onSpanClick={onSpanClick}
          testSubjPrefix="trace-logs"
          traceDataset={traceDataset}
        />
      </EuiPanel>
    </div>
  );
};
