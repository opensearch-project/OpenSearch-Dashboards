/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import {
  EuiPanel,
  EuiSpacer,
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLoadingSpinner,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { LogHit } from '../../server/ppl_request_logs';
import { Dataset } from '../../../../../../../../data/common';
import { buildExploreLogsUrl, getTimeRangeFromTraceData, filterLogsBySpanId } from './url_builder';
import { LogsDataTable } from './logs_data_table';

export interface SpanLogsTabProps {
  traceId: string;
  spanId: string;
  logDatasets: Dataset[];
  logsData: LogHit[];
  isLoading: boolean;
}

export const SpanLogsTab: React.FC<SpanLogsTabProps> = ({
  traceId,
  spanId,
  logDatasets,
  logsData,
  isLoading,
}) => {
  const spanLogs = useMemo(() => {
    return filterLogsBySpanId(logsData, spanId);
  }, [logsData, spanId]);

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
            <EuiLoadingSpinner size="l" />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    );
  }

  return (
    <EuiPanel paddingSize="s">
      <EuiFlexGroup justifyContent="flexEnd" alignItems="center" gutterSize="s">
        <EuiFlexItem grow={false}>
          <EuiButton
            size="s"
            iconType="popout"
            onClick={handleViewInExplore}
            data-test-subj="span-logs-view-in-explore-button"
          >
            {i18n.translate('explore.spanLogsTab.viewInDiscoverLogs', {
              defaultMessage: 'View in Discover Logs',
            })}
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="s" />

      <LogsDataTable logs={spanLogs} isLoading={isLoading} compactMode={true} />
    </EuiPanel>
  );
};
