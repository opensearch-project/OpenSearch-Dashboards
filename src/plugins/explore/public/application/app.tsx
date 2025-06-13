/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './app.scss';

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
import { HeaderVariant } from 'opensearch-dashboards/public';
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
import { ExploreDataTable } from '../components/data_table/explore_data_table';
import { ExploreTabs } from '../components/tabs/tabs';
import { useHeaderVariants } from './utils/hooks/use_header_variants';
import { NewExperienceBanner } from '../components/experience_banners/new_experience_banner';
import { VisualizationContainer } from '../components/visualizations/visualization_container';

/**
 * Main application component for the Explore plugin
 */
export const ExploreApp: React.FC<{ setHeaderActionMenu?: (menuMount: any) => void }> = ({
  setHeaderActionMenu,
}) => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const showActionsInGroup = services.uiSettings.get('home:useNewHomePage', false);

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
        const hits = results.hits?.hits || [];
        return hits;
      }
    }

    return [];
  });

  const fieldSchema = useSelector((state: RootState) => {
    const executionCacheKeys = state.ui?.executionCacheKeys || [];
    if (executionCacheKeys.length === 0) {
      return [];
    }

    // Try all available cache keys to find one with field schema
    for (const cacheKey of executionCacheKeys) {
      const results = state.results[cacheKey];
      if (results && results.fieldSchema) {
        return results.fieldSchema;
      }
    }

    return [];
  });

  const isMobile = useIsWithinBreakpoints(['xs', 's', 'm']);

  useInitialQueryExecution(services);
  useUrlStateSync(services);
  useTimefilterSubscription(services);
  useHeaderVariants(services, HeaderVariant.APPLICATION);

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

  const showChart =
    status === ResultStatus.READY ||
    (status === ResultStatus.LOADING && !!rows?.length) ||
    (status === ResultStatus.ERROR && !!rows?.length);

  const tabs = [
    // TODO: Translate
    {
      id: 'explore_logs_tab',
      name: 'Logs',
      content: <ExploreDataTable rows={rows} />,
    },
    {
      id: 'explore_visualization_tab',
      name: 'Visualization',
      content: <MemoizedVisualizationContainer rows={rows} fieldSchema={fieldSchema} />,
    },
  ];

  return (
    <EuiErrorBoundary>
      <div className="mainPage">
        {/* Nav bar structure exactly like data_explorer */}
        <EuiFlexGroup
          direction="row"
          className={showActionsInGroup ? '' : 'mainPage navBar'}
          gutterSize="none"
          alignItems="center"
          justifyContent="spaceBetween"
        >
          {!showActionsInGroup && (
            <EuiFlexItem grow={false}>
              <div ref={topLinkRef} />
            </EuiFlexItem>
          )}
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

            {/* HeaderDatasetSelector component - renders dataset selector in portal */}
            <HeaderDatasetSelector datasetSelectorRef={datasetSelectorRef} />

            <div className="dscCanvas__experienceBannerWrapper">
              <NewExperienceBanner />
            </div>

            {/* QueryPanel component */}
            <div className="dscCanvas__queryPanel">
              <QueryPanel datePickerRef={datePickerRef} />
            </div>

            {/* Main content area with resizable panels under QueryPanel */}
            <EuiResizableContainer
              direction={isMobile ? 'vertical' : 'horizontal'}
              style={{ flex: 1, minHeight: 0 }}
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
                  <EuiResizablePanel initialSize={80} minSize="65%" mode="main" paddingSize="none">
                    <EuiPageBody className="deLayout__canvas">
                      <EuiPanel
                        hasBorder={true}
                        hasShadow={false}
                        paddingSize="s"
                        className="dscCanvas"
                        data-test-subj="dscCanvas"
                        borderRadius="l"
                      >
                        <TopNav {...topNavProps} />
                        {/* Chart container from legacy - show above tabs when there are results */}
                        {showChart && (
                          <div className="dscCanvas__chart">
                            <DiscoverChartContainer />
                          </div>
                        )}

                        <ExploreTabs tabs={tabs} />
                      </EuiPanel>
                    </EuiPageBody>
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

const MemoizedVisualizationContainer = React.memo(VisualizationContainer);
