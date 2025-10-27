/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiTabs, EuiTab, EuiBadge } from '@elastic/eui';
import { TraceDetailTab } from '../../constants/trace_detail_tabs';

export interface TraceDetailTabsProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  transformedHits: any[];
  logDatasets?: any[];
  logCount: number;
  isLogsLoading?: boolean;
}

export const TraceDetailTabs: React.FC<TraceDetailTabsProps> = ({
  activeTab,
  setActiveTab,
  transformedHits,
  logDatasets = [],
  logCount = 0,
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

  tabs.push({
    id: TraceDetailTab.LOGS,
    name: (
      <>
        {!isLogsLoading && (
          <>
            <EuiBadge color="default">{logCount}</EuiBadge>{' '}
          </>
        )}
        {i18n.translate('explore.traceView.tab.logs', {
          defaultMessage: 'Related logs',
        })}
      </>
    ),
  });

  return (
    <EuiTabs>
      {tabs.map((tab) => (
        <EuiTab key={tab.id} isSelected={activeTab === tab.id} onClick={() => setActiveTab(tab.id)}>
          {tab.name}
        </EuiTab>
      ))}
    </EuiTabs>
  );
};
