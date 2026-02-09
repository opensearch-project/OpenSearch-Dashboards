/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiTabs,
  EuiTab,
  EuiButtonEmpty,
  EuiSpacer,
  EuiBadge,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import './span_detail_tabs.scss';
import { getSpanIssueCount } from '../utils/span_data_utils';
import { SpanOverviewTab } from './span_tabs/span_overview_tab';
import { SpanIssuesTab } from './span_tabs/span_issues_tab';
import { SpanMetadataTab } from './span_tabs/span_metadata_tab';
import { SpanRawSpanTab } from './span_tabs/span_raw_span_tab';
import { SpanLogsTab } from '../logs/span_logs_tab';
import { filterLogsBySpanId } from '../logs/url_builder';
import { SpanDetailTab } from '../../constants/span_detail_tabs';
import { Dataset } from '../../../../../../../../data/common';

export interface SpanDetailTabsProps {
  selectedSpan?: any;
  addSpanFilter: (field: string, value: any) => void;
  serviceName?: string;
  setCurrentSpan?: (spanId: string) => void;
  logDatasets?: any[];
  datasetLogs?: Record<string, any[]>;
  isLogsLoading?: boolean;
  activeTab?: TabId;
  onTabChange?: (tabId: TabId) => void;
  traceDataset?: Dataset;
}

type TabId = SpanDetailTab;

interface TabItem {
  id: TabId;
  name: string | React.ReactNode;
  content: React.ReactNode;
}

export const SpanDetailTabs: React.FC<SpanDetailTabsProps> = ({
  selectedSpan,
  addSpanFilter,
  serviceName,
  setCurrentSpan,
  logDatasets = [],
  datasetLogs = {},
  isLogsLoading = false,
  activeTab: externalActiveTab,
  onTabChange,
  traceDataset,
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState<TabId>(SpanDetailTab.OVERVIEW);

  // Use external tab state if provided, otherwise use internal state
  const activeTab = externalActiveTab !== undefined ? externalActiveTab : internalActiveTab;

  const handleTabChange = useCallback(
    (tabId: TabId) => {
      if (onTabChange) {
        onTabChange(tabId);
      } else {
        setInternalActiveTab(tabId);
      }
    },
    [onTabChange]
  );

  // Calculate counts for badges
  const issueCount = useMemo(() => {
    return selectedSpan ? getSpanIssueCount(selectedSpan) : 0;
  }, [selectedSpan]);

  // Filter logs for the selected span from datasetLogs
  // @ts-expect-error TS6133 TODO(ts-error): fixme
  const spanLogs = useMemo(() => {
    if (!selectedSpan?.spanId || Object.keys(datasetLogs).length === 0) return [];

    // Combine all logs from all datasets and filter by span ID
    const allLogs: any[] = [];
    Object.keys(datasetLogs).forEach((datasetId) => {
      const dataset = logDatasets.find((ds) => ds.id === datasetId);
      if (dataset) {
        const filteredLogs = filterLogsBySpanId(
          datasetLogs[datasetId],
          selectedSpan.spanId,
          dataset
        );
        allLogs.push(...filteredLogs);
      }
    });
    return allLogs;
  }, [datasetLogs, selectedSpan?.spanId, logDatasets]);

  const tabs = useMemo((): TabItem[] => {
    const tabList: TabItem[] = [
      {
        id: SpanDetailTab.OVERVIEW,
        name: i18n.translate('explore.spanDetailTabs.tab.overview', {
          defaultMessage: 'Overview',
        }),
        content: (
          <SpanOverviewTab
            selectedSpan={selectedSpan}
            onSwitchToErrorsTab={() => handleTabChange(SpanDetailTab.ERRORS)}
          />
        ),
      },
    ];

    tabList.push({
      id: SpanDetailTab.ERRORS,
      name: (
        <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
          <EuiFlexItem grow={false}>
            {i18n.translate('explore.spanDetailTabs.tab.errors', {
              defaultMessage: 'Errors',
            })}
          </EuiFlexItem>
          {issueCount > 0 && (
            <EuiFlexItem grow={false}>
              <EuiBadge color="danger">{issueCount}</EuiBadge>
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
      ),
      content: <SpanIssuesTab selectedSpan={selectedSpan} />,
    });

    tabList.push({
      id: SpanDetailTab.LOGS,
      name: i18n.translate('explore.spanDetailTabs.tab.logs', {
        defaultMessage: 'Logs',
      }),
      content: (
        <SpanLogsTab
          traceId={selectedSpan?.traceId || ''}
          spanId={selectedSpan?.spanId}
          logDatasets={logDatasets}
          datasetLogs={datasetLogs}
          isLoading={isLogsLoading}
          traceDataset={traceDataset}
        />
      ),
    });

    tabList.push(
      {
        id: SpanDetailTab.METADATA,
        name: i18n.translate('explore.spanDetailTabs.tab.metadata', {
          defaultMessage: 'Metadata',
        }),
        content: <SpanMetadataTab selectedSpan={selectedSpan} addSpanFilter={addSpanFilter} />,
      },
      {
        id: SpanDetailTab.RAW_SPAN,
        name: i18n.translate('explore.spanDetailTabs.tab.rawSpan', {
          defaultMessage: 'Raw span',
        }),
        content: <SpanRawSpanTab selectedSpan={selectedSpan} />,
      }
    );

    return tabList;
  }, [
    selectedSpan,
    addSpanFilter,
    issueCount,
    logDatasets,
    isLogsLoading,
    datasetLogs,
    handleTabChange,
    traceDataset,
  ]);

  // Auto-fallback to 'overview' tab when the current active tab is no longer available
  useEffect(() => {
    const availableTabIds = tabs.map((tab) => tab.id);
    if (!availableTabIds.includes(activeTab)) {
      handleTabChange(SpanDetailTab.OVERVIEW);
    }
  }, [tabs, activeTab, handleTabChange]);

  // Preserve the current tab when span changes, only reset if the tab becomes unavailable
  const prevSelectedSpanRef = React.useRef(selectedSpan?.spanId);
  useEffect(() => {
    if (prevSelectedSpanRef.current !== selectedSpan?.spanId) {
      prevSelectedSpanRef.current = selectedSpan?.spanId;
      // Don't reset the tab when span changes - let the fallback logic above handle unavailable tabs
    }
  }, [selectedSpan?.spanId]);

  const activeTabContent = useMemo(() => {
    const tab = tabs.find((t) => t.id === activeTab);
    return tab?.content || null;
  }, [tabs, activeTab]);

  return (
    <EuiPanel paddingSize="m" hasShadow={false} className="exploreSpanDetailSidebar">
      <div className="exploreSpanDetailSidebar__header">
        <EuiFlexGroup justifyContent="spaceBetween" alignItems="center" gutterSize="s">
          <EuiFlexItem>
            <EuiTitle size="s">
              <h2>
                {i18n.translate('explore.spanDetailTabs.header.spanDetail', {
                  defaultMessage: 'Span details',
                })}
              </h2>
            </EuiTitle>
          </EuiFlexItem>
          {serviceName && (
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                color="primary"
                onClick={() => setCurrentSpan && setCurrentSpan('')}
                iconType="arrowLeft"
                iconSide="left"
                size="xs"
              >
                {i18n.translate('explore.spanDetailTabs.button.back', {
                  defaultMessage: 'Back',
                })}
              </EuiButtonEmpty>
            </EuiFlexItem>
          )}
        </EuiFlexGroup>

        <EuiSpacer size="s" />
        <EuiTabs size="l">
          {tabs.map((tab) => (
            <EuiTab
              key={tab.id}
              isSelected={activeTab === tab.id}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.name}
            </EuiTab>
          ))}
        </EuiTabs>
      </div>

      {/* Scrollable content section */}
      <div className="exploreSpanDetailSidebar__content">
        <EuiSpacer size="s" />
        {activeTabContent}
      </div>
    </EuiPanel>
  );
};
