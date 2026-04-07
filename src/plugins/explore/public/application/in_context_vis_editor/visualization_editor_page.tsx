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

import { RightStyleOptionsPanel } from './component/visualization_editor__right_container';
import { useQueryBuilderState } from './hooks/use_query_builder_state';
import { useVisualizationBuilder } from './hooks/use_visualization_builder';
import { syncQueryStateWithUrl } from '../../../../data/public';
import { VISUALIZATION_EDITOR_APP_ID } from '../../../common';

export const VisualizationEditorPage = ({
  setHeaderActionMenu,
}: {
  setHeaderActionMenu: (menuMount: MountPoint | undefined) => void;
}) => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const isMobile = useIsWithinBreakpoints(['xs', 's', 'm']);
  const { queryBuilder } = useQueryBuilderState();
  const { visualizationBuilderForEditor } = useVisualizationBuilder();
  const [initialized, setInitialized] = useState(false);

  const {
    savedExplore,
    savedQueryState,
    savedVisConfig,
    error,
    isLoading,
  } = useInitialSaveExplore();

  useEffect(() => {
    const init = async () => {
      if (!savedExplore) return;

      if (error) {
        // return to default path
        services.scopedHistory?.push('/#');
      }
      if (savedExplore?.id) {
        services.chrome.docTitle.change(savedExplore.title);

        services.chrome.recentlyAccessed.add(
          `/app/${VISUALIZATION_EDITOR_APP_ID}/#/edit/${savedExplore.id}`,
          savedExplore.title,
          savedExplore.id,
          { type: 'explore' }
        );
      }

      if (savedVisConfig) {
        visualizationBuilderForEditor.setVisConfig({
          type: savedVisConfig.chartType,
          styles: savedVisConfig.params,
          axesMapping: savedVisConfig.axesMapping,
        });
      }
      visualizationBuilderForEditor.init();
      await queryBuilder.init({ savedQueryState });

      if (savedExplore.id || queryBuilder.queryState$.getValue().query !== '') {
        // For an existing saved explore, execute the query on page load.
        // For a new saved explore, execute the query only when it is not empty.
        // This avoids fixing the visualization persisted as a table for an empty query.
        queryBuilder.executeQuery();
      }
      setInitialized(true);
    };
    init();
    return () => {
      queryBuilder.reset();
      visualizationBuilderForEditor.reset();
    };
  }, [
    services.scopedHistory,
    error,
    services.chrome,
    isLoading,
    savedExplore,
    queryBuilder,
    savedVisConfig,
    savedQueryState,
    visualizationBuilderForEditor,
    services.chrome.docTitle,
    services.chrome.recentlyAccessed,
  ]);

  useEffect(() => {
    // syncs `_g` timeRange of url with query services
    if (!services.osdUrlStateStorage) return;
    const { stop } = syncQueryStateWithUrl(services.data.query, services.osdUrlStateStorage);

    return () => {
      stop();
    };
  }, [
    services.osdUrlStateStorage,
    queryBuilder.queryEditorState$,
    services.data.query,
    visualizationBuilderForEditor.visConfig$,
    queryBuilder.queryState$,
  ]);

  useHeaderVariants(services, HeaderVariant.APPLICATION);

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
