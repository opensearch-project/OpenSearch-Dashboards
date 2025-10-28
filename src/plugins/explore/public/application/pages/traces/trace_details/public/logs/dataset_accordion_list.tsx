/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiAccordion,
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { DatasetLogsTable } from './dataset_logs_table';
import { CorrelationEmptyState } from './correlation_empty_state';
import { LogHit } from '../../server/ppl_request_logs';
import { Dataset } from '../../../../../../../../data/common';

export interface DatasetAccordionListProps {
  logDatasets: Dataset[];
  datasetLogs: Record<string, LogHit[]>;
  onViewInExplore: (dataset: Dataset, logs: LogHit[]) => void;
  onSpanClick?: (spanId: string) => void;
  testSubjPrefix?: string;
  traceDataset?: Dataset;
}

export const DatasetAccordionList: React.FC<DatasetAccordionListProps> = ({
  logDatasets,
  datasetLogs,
  onViewInExplore,
  onSpanClick,
  testSubjPrefix = 'dataset',
  traceDataset,
}) => {
  // Show CorrelationEmptyState when no datasets are available
  if (logDatasets.length === 0) {
    return <CorrelationEmptyState traceDataset={traceDataset} />;
  }

  return (
    <>
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
                          onViewInExplore(dataset, logs);
                        }}
                        data-test-subj={`${testSubjPrefix}-view-in-explore-button-${dataset.id}`}
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
              initialIsOpen={true}
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
    </>
  );
};
