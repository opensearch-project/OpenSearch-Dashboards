/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import {
  EuiPage,
  EuiErrorBoundary,
  EuiResizableContainer,
  EuiPageBody,
  useIsWithinBreakpoints,
} from '@elastic/eui';
import { HeaderVariant, MountPoint } from 'opensearch-dashboards/public';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../types';

import { useInitialSaveExplore } from './hooks/use_initial_save_explore';
import { ResizableQueryPanelAndVisualization } from './component/visualization_editor_bottom_left_container';
import { TopNav } from './component/top_nav';
import { useHeaderVariants } from '../utils/hooks/use_header_variants';
import './visualization_editor.scss';

import { RightStyleOptionsPanel } from './component/visualization_editor_right_container';
import { useMultiQueryBuilder } from './multi_query_builder/multi_query_builder_context';
import {
  loadContainerState,
  showContainerStateWarnings,
} from './multi_query_builder/container_state_utils';
import { useVisualizationBuilder } from './hooks/use_visualization_builder';
import { syncQueryStateWithUrl } from '../../../../data/public';
import { VISUALIZATION_EDITOR_APP_ID } from '../../../common';
import { getBreadcrumbs } from './utils';
import { useInitialContainerContext } from './hooks/use_initial_container_context';
import { useVariables } from './hooks/use_variables';
import { DashboardSelectionModal } from './component/dashboard_selection_modal';

export const VisualizationEditorPage = ({
  setHeaderActionMenu,
}: {
  setHeaderActionMenu: (menuMount: MountPoint | undefined) => void;
}) => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const {
    core: { application },
    scopedHistory,
    chrome,
    osdUrlStateStorage,
    data,
    embeddable,
    dashboard,
  } = services;
  const isMobile = useIsWithinBreakpoints(['xs', 's', 'm']);
  const container = useMultiQueryBuilder();
  const { visualizationBuilderForEditor } = useVisualizationBuilder();

  const {
    context: { containerInfo, originatingApp },
    containerVariables,
    referencingDashboards,
    needsDashboardSelection,
    selectDashboard,
    skipDashboardSelection,
  } = useInitialContainerContext();

  const { variableService } = useVariables(containerVariables);
  const { VariablesBar } = dashboard;

  const [initialized, setInitialized] = useState(false);

  const { savedExplore, savedContainerState, savedVisConfig, error, isLoading } =
    useInitialSaveExplore();

  // update breadcrumbs
  useEffect(() => {
    if (error) {
      scopedHistory?.push('/#');
      return;
    }
    if (!savedExplore) return;
    if (savedExplore.id) {
      chrome.docTitle.change(savedExplore.title);
      chrome.recentlyAccessed.add(
        `/app/${VISUALIZATION_EDITOR_APP_ID}/#/edit/${savedExplore.id}`,
        savedExplore.title,
        savedExplore.id,
        { type: 'explore' }
      );
    }
    chrome.setBreadcrumbs([
      ...getBreadcrumbs(application.navigateToApp, embeddable, originatingApp, containerInfo),
      { text: savedExplore.title },
    ]);
  }, [
    error,
    savedExplore,
    scopedHistory,
    chrome,
    application.navigateToApp,
    embeddable,
    originatingApp,
    containerInfo,
  ]);

  // Load vis config and queries states
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      if (!savedExplore) return;
      // Wait for dashboard selection if needed
      if (needsDashboardSelection) return;

      if (!container.isLoaded()) {
        // merge url states and saved states and validate query and dataset
        // return merged state and warnings when query and dataset are incompatible
        const { state: containerState, warnings } = await loadContainerState(
          services,
          savedContainerState
        );
        if (cancelled) return;

        // Show toasts for invalid datasets
        const toasts = services.notifications?.toasts;
        if (toasts) showContainerStateWarnings(toasts, warnings);

        if (savedVisConfig) {
          visualizationBuilderForEditor.setVisConfig({
            type: savedVisConfig.chartType,
            title: savedVisConfig.title,
            description: savedVisConfig.description,
            styles: savedVisConfig.params,
            axesMapping: savedVisConfig.axesMapping,
            splitField: savedVisConfig.splitField,
            splitLayout: savedVisConfig.splitLayout,
            showSplitLabel: savedVisConfig.showSplitLabel,
            dataTransformations: savedVisConfig.dataTransformations,
          });
        }

        // set baseline for visualization states and query states, used in dirty editor check
        // set baseline before init() to include URL's states.
        visualizationBuilderForEditor.setSavedBaseline();
        visualizationBuilderForEditor.init();
        container.load(containerState);
        container.setSavedBaseline(savedExplore.id ? savedContainerState : undefined);

        // For an existing saved explore, execute the query on page load. For a new saved explore,
        // execute only when it is not empty, which avoids fixing the visualization persisted as a
        // table for an empty query.
        if (
          savedExplore.id ||
          container.getAllRows().some((row) => row.queryState$.getValue().query !== '')
        ) {
          container.executeAll({ userInitiated: false });
        }
      }
      setInitialized(true);
    };
    init();
    return () => {
      cancelled = true;
    };
  }, [
    savedExplore,
    needsDashboardSelection,
    savedContainerState,
    savedVisConfig,
    visualizationBuilderForEditor,
    container,
    services,
  ]);

  useEffect(() => {
    // syncs `_g` timeRange of url with query services
    if (!osdUrlStateStorage) return;
    const { stop } = syncQueryStateWithUrl(data.query, osdUrlStateStorage);

    return () => {
      stop();
    };
  }, [osdUrlStateStorage, data.query]);

  useEffect(() => {
    return () => {
      visualizationBuilderForEditor.reset();
    };
  }, [visualizationBuilderForEditor]);

  // Update variable names in queryBuilder when variables change
  useEffect(() => {
    // Variable names are shared by every query row.
    if (!variableService) {
      container.setVariableNames([]);
      return;
    }
    const subscription = variableService.getVariables$().subscribe((variables) => {
      const variableNames = variables.map((v) => v.name);
      container.setVariableNames(variableNames);
    });
    return () => subscription.unsubscribe();
  }, [variableService, container]);

  useHeaderVariants(services, HeaderVariant.APPLICATION);

  // Show only the dashboard selection modal if needed
  if (needsDashboardSelection) {
    return (
      <EuiErrorBoundary>
        <DashboardSelectionModal
          dashboards={referencingDashboards}
          onSelect={selectDashboard}
          onCancel={skipDashboardSelection}
        />
      </EuiErrorBoundary>
    );
  }

  if (isLoading || !initialized) {
    return null;
  }

  return (
    <EuiErrorBoundary>
      <div className="mainPage">
        <EuiPage className="explore-layout" paddingSize="none" grow={false}>
          <EuiPageBody className="explore-layout__page-body">
            <TopNav setHeaderActionMenu={setHeaderActionMenu} savedExplore={savedExplore} />

            <EuiResizableContainer
              direction={isMobile ? 'vertical' : 'horizontal'}
              className="explore-layout__bottom-panel"
            >
              {(EuiResizablePanel, EuiResizableButton) => {
                return (
                  <>
                    <EuiResizablePanel
                      id="left_container"
                      initialSize={80}
                      minSize="75%"
                      paddingSize="none"
                      className="resizable-panel-left"
                    >
                      {variableService && VariablesBar && (
                        <VariablesBar variableService={variableService} />
                      )}
                      <ResizableQueryPanelAndVisualization />
                    </EuiResizablePanel>
                    <EuiResizableButton />
                    <EuiResizablePanel
                      id="right__container"
                      className="resizable-panel-right"
                      initialSize={20}
                      minSize="15%"
                      paddingSize="none"
                    >
                      <RightStyleOptionsPanel />
                    </EuiResizablePanel>
                  </>
                );
              }}
            </EuiResizableContainer>
          </EuiPageBody>
        </EuiPage>
      </div>
    </EuiErrorBoundary>
  );
};
