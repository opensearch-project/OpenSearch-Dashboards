/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import {
  EuiPage,
  EuiErrorBoundary,
  EuiResizableContainer,
  EuiPageBody,
  useIsWithinBreakpoints,
  EuiPanel,
} from '@elastic/eui';
import { HeaderVariant } from 'opensearch-dashboards/public';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../types';

import { useInitialSaveExplore } from './hooks/use_initial_save_explore';
import { getVisualizationBuilder } from '../../components/visualizations/visualization_builder';
import { ResizableQueryPanelAndVisualization } from './component/in_context_bottom_left_container';
import { TopNav } from './component/top_nav';
import { useHeaderVariants } from '../../application/utils/hooks/use_header_variants';

import './in_context_editor.scss';
import { useInContextEditor } from '../context';
import { useUrlStateSync } from '../utils/hooks/use_url_state_sync';

export const InContextVisEditorPage = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();

  const { setHeaderActionMenu } = useInContextEditor();

  const { savedExplore, isInitialized } = useInitialSaveExplore();

  const isMobile = useIsWithinBreakpoints(['xs', 's', 'm']);
  const visualizationBuilder = getVisualizationBuilder();

  useHeaderVariants(services, HeaderVariant.APPLICATION);
  useUrlStateSync(services);

  if (!isInitialized) return null;

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
                      <EuiPanel
                        paddingSize="s"
                        style={{ height: '100%' }}
                        borderRadius="none"
                        hasShadow={false}
                      >
                        {visualizationBuilder.renderStylePanel({ className: 'visStylePanelBody' })}
                      </EuiPanel>
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
