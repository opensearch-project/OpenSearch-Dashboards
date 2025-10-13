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
  EuiAccordion,
  EuiLoadingContent,
  EuiTitle,
  EuiText,
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
  datasetLogs: Record<string, LogHit[]>;
  isLoading: boolean;
  onSpanClick?: (spanId: string) => void;
}

export const TraceLogsTab: React.FC<TraceLogsTabProps> = ({
  traceId,
  logDatasets,
  logsData,
  datasetLogs,
  isLoading,
  onSpanClick,
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
        <EuiText size="s" color="subdued">
          {i18n.translate('explore.traceLogsTab.noDatasets', {
            defaultMessage: 'No log datasets found for this trace',
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
            {i18n.translate('explore.traceLogsTab.title', {
              defaultMessage: 'Logs',
            })}
          </h3>
        </EuiTitle>
        <EuiText size="s" color="subdued">
          {i18n.translate('explore.traceLogsTab.description', {
            defaultMessage: 'View logs associated with this trace',
          })}
        </EuiText>
        <EuiSpacer size="m" />

        {logDatasets.map((dataset, index) => {
          const logs = datasetLogs[dataset.id] || [];
          const accordionId = `logsDatasetAccordion-${dataset.id}`;

          return (
            <div key={dataset.id}>
              <EuiAccordion
                id={accordionId}
                buttonContent={
                  <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
                    <EuiFlexItem>
                      <EuiFlexGroup direction="column" gutterSize="xs">
                        <EuiFlexItem>
                          <EuiFlexGroup gutterSize="s" alignItems="center">
                            <EuiFlexItem grow={false}>
                              <EuiText size="s" style={{ fontWeight: 'bold' }}>
                                {i18n.translate('explore.traceLogsTab.dataset', {
                                  defaultMessage: 'Dataset: ',
                                })}
                              </EuiText>
                            </EuiFlexItem>
                            <EuiFlexItem>
                              <EuiText size="s">{dataset.title}</EuiText>
                            </EuiFlexItem>
                          </EuiFlexGroup>
                        </EuiFlexItem>
                        <EuiFlexItem>
                          <EuiText size="xs" color="subdued">
                            {i18n.translate('explore.traceLogsTab.recentResults', {
                              defaultMessage: '10 recent results',
                            })}
                          </EuiText>
                        </EuiFlexItem>
                      </EuiFlexGroup>
                    </EuiFlexItem>
                    {logs.length > 0 && (
                      <EuiFlexItem grow={false}>
                        <EuiButton
                          size="s"
                          iconType="popout"
                          onClick={(event: React.MouseEvent) => {
                            event.stopPropagation();
                            handleViewInExplore(dataset, logs);
                          }}
                          data-test-subj={`trace-logs-view-in-explore-button-${dataset.id}`}
                        >
                          {i18n.translate('explore.traceLogsTab.viewInDiscoverLogs', {
                            defaultMessage: 'View in Discover Logs',
                          })}
                        </EuiButton>
                      </EuiFlexItem>
                    )}
                  </EuiFlexGroup>
                }
                paddingSize="m"
                initialIsOpen={index === 0} // Open first accordion by default
                data-test-subj={`dataset-accordion-${dataset.id}`}
              >
                <div>
                  {logs.length > 0 ? (
                    <DatasetLogsTable logs={logs} isLoading={false} onSpanClick={onSpanClick} />
                  ) : (
                    <EuiText size="s" color="subdued">
                      {i18n.translate('explore.traceLogsTab.noLogsForDataset', {
                        defaultMessage: 'No logs found for this dataset',
                      })}
                    </EuiText>
                  )}
                </div>
              </EuiAccordion>
              {index < logDatasets.length - 1 && <EuiSpacer size="m" />}
            </div>
          );
        })}
      </EuiPanel>
    </div>
  );
};
