/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
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

export interface SpanDetailTabsProps {
  selectedSpan?: any;
  addSpanFilter: (field: string, value: any) => void;
  serviceName?: string;
  setCurrentSpan?: (spanId: string) => void;
}

type TabId = 'overview' | 'errors' | 'metadata' | 'raw_span';

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
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  // Calculate counts for badges
  const issueCount = useMemo(() => {
    return selectedSpan ? getSpanIssueCount(selectedSpan) : 0;
  }, [selectedSpan]);

  const tabs = useMemo((): TabItem[] => {
    const tabList: TabItem[] = [
      {
        id: 'overview' as TabId,
        name: i18n.translate('explore.spanDetailTabs.tab.overview', {
          defaultMessage: 'Overview',
        }),
        content: (
          <SpanOverviewTab
            selectedSpan={selectedSpan}
            onSwitchToErrorsTab={() => setActiveTab('errors')}
          />
        ),
      },
    ];

    tabList.push({
      id: 'errors' as TabId,
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

    tabList.push(
      {
        id: 'metadata' as TabId,
        name: i18n.translate('explore.spanDetailTabs.tab.metadata', {
          defaultMessage: 'Metadata',
        }),
        content: <SpanMetadataTab selectedSpan={selectedSpan} addSpanFilter={addSpanFilter} />,
      },
      {
        id: 'raw_span' as TabId,
        name: i18n.translate('explore.spanDetailTabs.tab.rawSpan', {
          defaultMessage: 'Raw span',
        }),
        content: <SpanRawSpanTab selectedSpan={selectedSpan} />,
      }
    );

    return tabList;
  }, [selectedSpan, addSpanFilter, issueCount]);

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

        <EuiTabs size="s">
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
      </div>

      {/* Scrollable content section */}
      <div className="exploreSpanDetailSidebar__content">
        <EuiSpacer size="s" />
        {activeTabContent}
      </div>
    </EuiPanel>
  );
};
