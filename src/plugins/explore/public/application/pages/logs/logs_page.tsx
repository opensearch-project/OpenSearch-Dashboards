/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import '../explore_page.scss';

import React, { useCallback, useEffect, useState } from 'react';
import { EuiErrorBoundary, EuiLoadingSpinner, EuiPage, EuiPageBody, EuiText } from '@elastic/eui';
import { AppMountParameters, HeaderVariant } from 'opensearch-dashboards/public';
import { useDispatch, useSelector } from 'react-redux';
import { i18n } from '@osd/i18n';
import { RootState } from '../../utils/state_management/store';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';
import { QueryPanel } from '../../../components/query_panel';
import { useAnalyzePanelState } from '../../../components/query_panel/query_panel_widgets';
import {
  PPLAnalyzePanel,
  getPPLAnalyzeResult$,
  runPPLAnalyzeInBackground,
  setPPLAnalyzeOpen,
} from '../../../../../data/public';
import { useInitialQueryExecution } from '../../utils/hooks/use_initial_query_execution';
import { useUrlStateSync } from '../../utils/hooks/use_url_state_sync';
import { useTimefilterSubscription } from '../../utils/hooks/use_timefilter_subscription';
import { useHeaderVariants } from '../../utils/hooks/use_header_variants';
import { NewExperienceBanner } from '../../../components/experience_banners/new_experience_banner';
import { BottomContainer } from '../../../components/container/bottom_container';
import { ResizableQueryContainer } from '../../../components/container/resizable_query_container';
import { TopNav } from '../../../components/top_nav/top_nav';
import { useInitPage } from '../../../application/utils/hooks/use_page_initialization';
import {
  EXPLORE_LOGS_TAB_ID,
  EXPLORE_PATTERNS_TAB_ID,
  EXPLORE_VISUALIZATION_TAB_ID,
} from '../../../../common';
import { setActiveTab } from '../../utils/state_management/slices';
import { selectDataset } from '../../utils/state_management/selectors';
import { LogsQueryPanel } from './logs_query_panel';

/**
 * Main application component for the Explore plugin
 */
export const LogsPage: React.FC<Partial<Pick<AppMountParameters, 'setHeaderActionMenu'>>> = ({
  setHeaderActionMenu,
}) => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { savedExplore } = useInitPage();
  const { keyboardShortcut } = services;
  const dispatch = useDispatch();

  keyboardShortcut?.useKeyboardShortcut({
    id: 'switchToLogsTabLogs',
    pluginId: 'explore',
    name: i18n.translate('explore.logsPage.switchToLogsTabShortcut', {
      defaultMessage: 'Switch to logs tab',
    }),
    category: i18n.translate('explore.logsPage.navigationCategory', {
      defaultMessage: 'Navigation',
    }),
    keys: 'shift+l',
    execute: () => dispatch(setActiveTab(EXPLORE_LOGS_TAB_ID)),
  });

  keyboardShortcut?.useKeyboardShortcut({
    id: 'switchToPatternsTabLogs',
    pluginId: 'explore',
    name: i18n.translate('explore.logsPage.switchToPatternsTabShortcut', {
      defaultMessage: 'Switch to patterns tab',
    }),
    category: i18n.translate('explore.logsPage.navigationCategory', {
      defaultMessage: 'Navigation',
    }),
    keys: 'shift+p',
    execute: () => dispatch(setActiveTab(EXPLORE_PATTERNS_TAB_ID)),
  });

  keyboardShortcut?.useKeyboardShortcut({
    id: 'switchToVisualizationTabLogs',
    pluginId: 'explore',
    name: i18n.translate('explore.logsPage.switchToVisualizationTabShortcut', {
      defaultMessage: 'Switch to visualization tab',
    }),
    category: i18n.translate('explore.logsPage.navigationCategory', {
      defaultMessage: 'Navigation',
    }),
    keys: 'shift+v',
    execute: () => dispatch(setActiveTab(EXPLORE_VISUALIZATION_TAB_ID)),
  });

  useInitialQueryExecution(services);
  useUrlStateSync(services);
  useTimefilterSubscription(services);
  useHeaderVariants(services, HeaderVariant.APPLICATION);

  const { isOpen, setIsOpen, hasResult, isLoading: isAnalyzeLoading } = useAnalyzePanelState();
  const [analyzeResult, setAnalyzeResult] = useState(() => getPPLAnalyzeResult$().getValue());
  useEffect(() => {
    const sub = getPPLAnalyzeResult$().subscribe(setAnalyzeResult);
    return () => sub.unsubscribe();
  }, []);
  const queryState = useSelector((state: RootState) => state.query);

  const queryBuilderEnabled = Boolean(services.capabilities?.explore?.logsQueryBuilderEnabled);

  // Keyed on dataset id below to remount the builder panel on dataset switch, discarding stale draft state.
  const dataset = useSelector(selectDataset);

  // When the logs query builder is active, analyze is only available while the
  // builder is showing its code editor (not the visual builder). The builder
  // reports its live mode up via onModeChange; default to true for the classic
  // editor, which is always "code mode".
  const [isBuilderCodeMode, setIsBuilderCodeMode] = useState(true);

  const isPPLAnalyzeEnabled = services.pplAnalyzeEnabled;

  // Analyze is available in the classic editor and in the builder's code mode,
  // but never while the visual builder is on screen.
  const isAnalyzeAvailable = isPPLAnalyzeEnabled && (!queryBuilderEnabled || isBuilderCodeMode);

  const handleToggleAnalyze = useCallback(() => {
    if (!isOpen) {
      runPPLAnalyzeInBackground({
        query: queryState,
        http: services.http,
        timefilter: services.data.query.timefilter.timefilter,
      });
      setIsOpen(true);
      setPPLAnalyzeOpen(true);
    } else {
      setIsOpen(false);
      setPPLAnalyzeOpen(false);
    }
  }, [isOpen, queryState, services, setIsOpen]);

  return (
    <EuiErrorBoundary>
      <div className="mainPage">
        <EuiPage className="explore-layout" paddingSize="none" grow={false}>
          <EuiPageBody className="explore-layout__page-body">
            <TopNav setHeaderActionMenu={setHeaderActionMenu} savedExplore={savedExplore} />
            <NewExperienceBanner />

            <ResizableQueryContainer
              queryPanel={
                queryBuilderEnabled ? (
                  <LogsQueryPanel
                    key={dataset?.id}
                    analyzeIsOpen={isPPLAnalyzeEnabled ? isOpen : undefined}
                    onToggleAnalyze={isPPLAnalyzeEnabled ? handleToggleAnalyze : undefined}
                    hasAnalyzeResult={isPPLAnalyzeEnabled ? hasResult : undefined}
                    onModeChange={setIsBuilderCodeMode}
                  />
                ) : (
                  <QueryPanel
                    analyzeIsOpen={isPPLAnalyzeEnabled ? isOpen : undefined}
                    onToggleAnalyze={isPPLAnalyzeEnabled ? handleToggleAnalyze : undefined}
                    hasAnalyzeResult={isPPLAnalyzeEnabled ? hasResult : undefined}
                  />
                )
              }
              tallDefault={queryBuilderEnabled}
            >
              {isAnalyzeAvailable && isOpen && (isAnalyzeLoading || analyzeResult) ? (
                isAnalyzeLoading ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      gap: 12,
                    }}
                  >
                    <EuiLoadingSpinner size="xl" />
                    <EuiText size="s" color="subdued">
                      Running query analysis…
                    </EuiText>
                  </div>
                ) : (
                  <div style={{ overflowY: 'auto', height: '100%' }}>
                    <PPLAnalyzePanel
                      analyzeResult={analyzeResult!}
                      onClose={() => {
                        setIsOpen(false);
                        setPPLAnalyzeOpen(false);
                      }}
                    />
                  </div>
                )
              ) : (
                /* Main content area with resizable panels under QueryPanel */
                <BottomContainer />
              )}
            </ResizableQueryContainer>
          </EuiPageBody>
        </EuiPage>
      </div>
    </EuiErrorBoundary>
  );
};
