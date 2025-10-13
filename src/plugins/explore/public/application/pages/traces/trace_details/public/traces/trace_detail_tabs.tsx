/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiTabs,
  EuiTab,
  EuiBadge,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButton,
  EuiToolTip,
} from '@elastic/eui';
import { TraceDetailTab } from '../../constants/trace_detail_tabs';

export interface TraceDetailTabsProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  transformedHits: any[];
  errorCount: number;
  spanFilters: any[];
  handleErrorFilterClick: () => void;
  logDatasets?: any[];
  logsData?: any[];
  isLogsLoading?: boolean;
}

export const TraceDetailTabs: React.FC<TraceDetailTabsProps> = ({
  activeTab,
  setActiveTab,
  transformedHits,
  errorCount,
  spanFilters,
  handleErrorFilterClick,
  logDatasets = [],
  logsData = [],
  isLogsLoading = false,
}) => {
  const tabs = [
    {
      id: TraceDetailTab.TIMELINE,
      name: i18n.translate('explore.traceView.tab.timeline', {
        defaultMessage: 'Timeline',
      }),
    },
    // Disabled: Service Map tab
    // {
    //   id: TraceDetailTab.SERVICE_MAP,
    //   name: i18n.translate('explore.traceView.tab.serviceMap', {
    //     defaultMessage: 'Service map',
    //   }),
    // },
    {
      id: TraceDetailTab.SPAN_LIST,
      name: (
        <>
          {transformedHits.length > 0 && (
            <>
              <EuiBadge color="default">{transformedHits.length}</EuiBadge>{' '}
            </>
          )}
          {i18n.translate('explore.traceView.tab.spanList', {
            defaultMessage: 'Span list',
          })}
        </>
      ),
    },
  ];

  // Add logs tab if we have log datasets and logs data
  if (logDatasets.length > 0 && logsData.length > 0) {
    tabs.push({
      id: TraceDetailTab.LOGS,
      name: (
        <>
          <EuiBadge color="default">{logsData.length}</EuiBadge>{' '}
          {i18n.translate('explore.traceView.tab.logs', {
            defaultMessage: 'Logs',
          })}
        </>
      ),
    });
  }

  return (
    <EuiFlexGroup alignItems="center" justifyContent="spaceBetween">
      <EuiFlexItem>
        <EuiTabs>
          {tabs.map((tab) => (
            <EuiTab
              key={tab.id}
              isSelected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.name}
            </EuiTab>
          ))}
        </EuiTabs>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiFlexGroup gutterSize="s" alignItems="center">
          {errorCount > 0 &&
            !spanFilters.some(
              (filter) =>
                (filter.field === 'status.code' && filter.value === 2) ||
                (filter.field === 'isError' && filter.value === true)
            ) && (
              <EuiFlexItem grow={false}>
                <EuiToolTip
                  content={i18n.translate('explore.traceView.tooltip.clickToApplyFilter', {
                    defaultMessage: 'Click to apply filter',
                  })}
                >
                  <EuiButton
                    onClick={handleErrorFilterClick}
                    data-test-subj="error-count-button"
                    size="s"
                    color="secondary"
                  >
                    {i18n.translate('explore.traceView.button.filterErrors', {
                      defaultMessage: 'Filter errors ({errorCount})',
                      values: { errorCount },
                    })}
                  </EuiButton>
                </EuiToolTip>
              </EuiFlexItem>
            )}
        </EuiFlexGroup>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
