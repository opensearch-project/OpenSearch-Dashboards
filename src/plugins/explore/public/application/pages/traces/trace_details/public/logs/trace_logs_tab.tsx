/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import {
  EuiPanel,
  EuiSpacer,
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLoadingSpinner,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { DatasetLogsTable } from './dataset_logs_table';
import { LogHit } from '../../server/ppl_request_logs';
import { Dataset } from '../../../../../../../../data/common';
import { buildExploreLogsUrl, getTimeRangeFromTraceData } from './url_builder';

export interface TraceLogsTabProps {
  traceId: string;
  logDatasets: Dataset[];
  logsData: LogHit[];
  isLoading: boolean;
  onSpanClick?: (spanId: string) => void;
}

export const TraceLogsTab: React.FC<TraceLogsTabProps> = ({
  traceId,
  logDatasets,
  logsData,
  isLoading,
  onSpanClick,
}) => {
  const handleViewInExplore = () => {
    if (logDatasets.length === 0) {
      return;
    }

    try {
      // Use the first available log dataset
      const logDataset = logDatasets[0];

      const timeRange = getTimeRangeFromTraceData(logsData);

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

  return (
    <EuiPanel>
      <EuiFlexGroup justifyContent="flexEnd" alignItems="center" gutterSize="s">
        <EuiFlexItem grow={false}>
          <EuiButton
            size="s"
            iconType="popout"
            onClick={handleViewInExplore}
            data-test-subj="trace-logs-view-in-explore-button"
          >
            {i18n.translate('explore.traceLogsTab.viewInDiscoverLogs', {
              defaultMessage: 'View in Discover Logs',
            })}
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="s" />

      <DatasetLogsTable logs={logsData} isLoading={isLoading} onSpanClick={onSpanClick} />
    </EuiPanel>
  );
};
