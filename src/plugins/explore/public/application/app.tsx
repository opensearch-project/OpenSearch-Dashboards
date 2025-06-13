/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import {
  EuiErrorBoundary,
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiResizableContainer,
  EuiPage,
  EuiPageBody,
  useIsWithinBreakpoints,
} from '@elastic/eui';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../types';
import { RootState } from './utils/state_management/store';
import { ResultStatus } from './utils/state_management/types';
import { TopNav } from './legacy/discover/application/view_components/canvas/top_nav';
import { DiscoverChartContainer } from './legacy/discover/application/view_components/canvas/discover_chart_container';
import { QueryPanel } from './components/query_panel';
import { TabBar } from './components/tab_bar';
import { TabContent } from './components/tab_content';
import { DiscoverPanel } from './legacy/discover/application/view_components/panel';
import { HeaderDatasetSelector } from './components/header_dataset_selector';
import { useInitialQueryExecution } from './utils/hooks/use_initial_query_execution';
import { useUrlStateSync } from './utils/hooks/use_url_state_sync';
import { useTimefilterSubscription } from './utils/hooks/use_timefilter_subscription';
import './app.scss';

/**
 * Main application component for the Explore plugin
 */
export const ExploreApp: React.FC<{ setHeaderActionMenu?: (menuMount: any) => void }> = ({
  setHeaderActionMenu,
}) => {
  const { services } = useOpenSearchDashboards<ExploreServices>();

  // Get status and rows for histogram and tab content
  const status = useSelector((state: RootState) => {
    return state.ui?.status || ResultStatus.UNINITIALIZED;
  });
  const rows = useSelector((state: RootState) => {
    const executionCacheKeys = state.ui?.executionCacheKeys || [];
    if (executionCacheKeys.length === 0) {
      return [];
    }

    // Try all available cache keys to find one with results (same logic as TabContent)
    for (const cacheKey of executionCacheKeys) {
      const results = state.results[cacheKey];
      if (results) {
        const hits = (results as any)?.hits?.hits || [];
        return hits;
      }
    }

    return [];
  });

  const isMobile = useIsWithinBreakpoints(['xs', 's', 'm']);

  useInitialQueryExecution(services);
  useUrlStateSync(services);
  useTimefilterSubscription(services);

  // TODO: Clean out refs for portal positioning if not needed.
  const topLinkRef = useRef<HTMLDivElement>(null);
  const datasetSelectorRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Create TopNav props - use portal approach for precise positioning
  const topNavProps = {
    isEnhancementsEnabled: true,
    opts: {
      setHeaderActionMenu: setHeaderActionMenu || (() => {}), // Use real global header mount point
      onQuerySubmit: ({ dateRange, query }: any) => {
        // Update time range
        if (dateRange && services?.data?.query?.timefilter?.timefilter) {
          services.data.query.timefilter.timefilter.setTime(dateRange);
        }
      },
      optionalRef: {
        topLinkRef,
        datasetSelectorRef,
        datePickerRef,
      },
    },
    showSaveQuery: true,
  };

  return (
    <EuiErrorBoundary>
      <div className="mainPage">
        {/* Nav bar structure exactly like data_explorer */}
        <EuiFlexGroup
          direction="row"
          className="mainPage navBar"
          gutterSize="none"
          alignItems="center"
          justifyContent="spaceBetween"
        >
          <EuiFlexItem grow={false}>
            <div ref={topLinkRef} />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiFlexGroup gutterSize="s" alignItems="center">
              <EuiFlexItem grow={false}>
                <div ref={datasetSelectorRef} />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <div ref={datePickerRef} />
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiPage className="deLayout" paddingSize="none" grow={false}>
          <EuiPageBody>
            {/* TopNav component - configured like discover */}
            <TopNav {...topNavProps} />

            {/* HeaderDatasetSelector component - renders dataset selector in portal */}
            <HeaderDatasetSelector datasetSelectorRef={datasetSelectorRef} />

            {/* QueryPanel component */}
            <div className="dscCanvas__queryPanel">
              <QueryPanel datePickerRef={datePickerRef} />
            </div>

            {/* Main content area with resizable panels under QueryPanel */}
            <EuiResizableContainer
              direction={isMobile ? 'vertical' : 'horizontal'}
              style={{ flex: 1 }}
            >
              {(EuiResizablePanel, EuiResizableButton) => (
                <>
                  {/* Left Panel: DiscoverPanel (Fields) */}
                  <EuiResizablePanel
                    initialSize={20}
                    minSize="260px"
                    mode={['collapsible', { position: 'top' }]}
                    paddingSize="none"
                  >
                    <DiscoverPanel />
                  </EuiResizablePanel>

                  <EuiResizableButton />

                  {/* Right Panel: Chart and Tab Content */}
                  <EuiResizablePanel initialSize={80} mode="main" paddingSize="none">
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      {/* Chart container from legacy - show above tabs when there are results */}
                      {(() => {
                        const showChart =
                          status === ResultStatus.READY ||
                          (status === ResultStatus.LOADING && !!rows?.length) ||
                          (status === ResultStatus.ERROR && !!rows?.length);

                        return showChart;
                      })() && (
                        <div className="dscCanvas__chart">
                          <DiscoverChartContainer />
                        </div>
                      )}

                      {/* Tab Bar for switching between tabs */}
                      <div className="dscCanvas__tabBar">
                        <TabBar />
                      </div>

                      {/* Tab content that renders the active tab */}
                      <div className="dscCanvas__tabContent">
                        <TabContent />
                      </div>
                    </div>
                  </EuiResizablePanel>
                </>
              )}
            </EuiResizableContainer>
          </EuiPageBody>
        </EuiPage>
      </div>
    </EuiErrorBoundary>
  );
};
