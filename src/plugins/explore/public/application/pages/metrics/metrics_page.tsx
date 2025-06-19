/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './metrics_page.scss';

import React, { useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  EuiErrorBoundary,
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiResizableContainer,
  EuiPage,
  EuiPageBody,
  EuiSpacer,
  useIsWithinBreakpoints,
} from '@elastic/eui';
import { AppMountParameters, HeaderVariant } from 'opensearch-dashboards/public';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';
import { RootState } from '../../utils/state_management/store';
import { ResultStatus } from '../../utils/state_management/types';
import { TopNav } from '../../legacy/discover/application/view_components/canvas/top_nav';
import { DiscoverChartContainer } from '../../legacy/discover/application/view_components/canvas/discover_chart_container';
import { QueryPanel } from '../../components/query_panel';
import { DiscoverPanel } from '../../legacy/discover/application/view_components/panel';
import { HeaderDatasetSelector } from '../../components/header_dataset_selector';
import { useInitialQueryExecution } from '../../utils/hooks/use_initial_query_execution';
import { useUrlStateSync } from '../../utils/hooks/use_url_state_sync';
import { useTimefilterSubscription } from '../../utils/hooks/use_timefilter_subscription';
import { ExploreTabs } from '../../../components/tabs/tabs';
import { useHeaderVariants } from '../../utils/hooks/use_header_variants';
import { NewExperienceBanner } from '../../../components/experience_banners/new_experience_banner';
import { useIndexPatternContext } from '../../components/index_pattern_context';
import { DiscoverNoIndexPatterns } from '../../legacy/discover/application/components/no_index_patterns/no_index_patterns';
import { DiscoverUninitialized } from '../../legacy/discover/application/components/uninitialized/uninitialized';
import { LoadingSpinner } from '../../legacy/discover/application/components/loading_spinner/loading_spinner';
import { DiscoverNoResults } from '../../legacy/discover/application/components/no_results/no_results';
import { executeQueries } from '../../utils/state_management/actions/query_actions';

/**
 * Main application component for the Explore plugin
 */
export const MetricsPage: React.FC<Partial<Pick<AppMountParameters, 'setHeaderActionMenu'>>> = ({
  setHeaderActionMenu,
}) => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const dispatch = useDispatch();
  const {
    indexPattern,
    isLoading: indexPatternLoading,
    error: indexPatternError,
  } = useIndexPatternContext();
  const showActionsInGroup = services.uiSettings.get('home:useNewHomePage', false);

  // Get status for conditional rendering
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
      // why return first hit?
      const results = state.results[cacheKey];
      if (results) {
        const hits = results.hits?.hits || [];
        return hits;
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

  // Function to refresh data (for uninitialized state)
  const onRefresh = () => {
    if (services) {
      dispatch(executeQueries({ services }) as any);
    }
  };

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

            {/* QueryPanel component - only render when IndexPattern is loaded */}
            <div className="dscCanvas__queryPanel">
              {indexPatternLoading ? (
                <div>Loading IndexPattern...</div>
              ) : indexPatternError ? (
                <div>Error loading IndexPattern: {indexPatternError}</div>
              ) : indexPattern ? (
                <QueryPanel
                  datePickerRef={datePickerRef}
                  services={services}
                  indexPattern={indexPattern}
                />
              ) : (
                <div>No IndexPattern available</div>
              )}
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

                        {/* Handle different states following Discover's pattern */}
                        {indexPattern ? (
                          <>
                            {/* NO_RESULTS state */}
                            {status === ResultStatus.NO_RESULTS && (
                              <DiscoverNoResults
                                queryString={services?.data?.query?.queryString}
                                query={services?.data?.query?.queryString?.getQuery()}
                                savedQuery={services?.data?.query?.savedQueries}
                                timeFieldName={indexPattern.timeFieldName}
                              />
                            )}

                            {/* UNINITIALIZED state */}
                            {status === ResultStatus.UNINITIALIZED && (
                              <DiscoverUninitialized onRefresh={onRefresh} />
                            )}

                            {/* LOADING state with no existing data */}
                            {status === ResultStatus.LOADING && !rows?.length && <LoadingSpinner />}

                            {/* ERROR state with no existing data */}
                            {status === ResultStatus.ERROR && !rows?.length && (
                              <DiscoverUninitialized onRefresh={onRefresh} />
                            )}

                            {/* READY state or LOADING/ERROR with existing data */}
                            {(status === ResultStatus.READY ||
                              (status === ResultStatus.LOADING && !!rows?.length) ||
                              (status === ResultStatus.ERROR && !!rows?.length)) && (
                              <>
                                <div className="dscCanvas__chart">
                                  <DiscoverChartContainer />
                                </div>
                                <ExploreTabs />
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            <EuiSpacer size="xxl" />
                            <DiscoverNoIndexPatterns />
                          </>
                        )}
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
