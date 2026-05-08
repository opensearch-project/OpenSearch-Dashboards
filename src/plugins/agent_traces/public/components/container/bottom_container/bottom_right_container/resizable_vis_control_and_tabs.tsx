/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './resizable_vis_control_and_tabs.scss';

import { useRef } from 'react';
import { useObservable } from 'react-use';
import { useSelector } from 'react-redux';
import { i18n } from '@osd/i18n';
import {
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiResizableContainer,
  EuiTitle,
} from '@elastic/eui';
import { PanelDirection } from '@elastic/eui/src/components/resizable_container/types';

import { AgentTracesTabs } from '../../../tabs/tabs';
import {
  useTraceMetrics,
  TraceMetricsContext,
} from '../../../../application/pages/traces/hooks/use_trace_metrics';
import { useErrorFilterClick } from '../../../../application/pages/traces/hooks/use_error_filter_click';
import { TraceMetricsBar } from '../../../../application/pages/traces/trace_metrics_bar';
import { TraceFlyoutProvider } from '../../../../application/pages/traces/flyout/trace_flyout_context';
import { getVisualizationBuilder } from '../../../visualizations/visualization_builder_singleton';
import { selectActiveTab } from '../../../../application/utils/state_management/selectors';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { useTabError } from '../../../../application/utils/hooks/use_tab_error';
import { AgentTracesServices } from '../../../../types';
import { AGENT_TRACES_VISUALIZATION_TAB_ID } from '../../../../../common';

export const ResizableVisControlAndTabs = () => {
  const metricsResult = useTraceMetrics(true);
  const handleErrorClick = useErrorFilterClick();
  const { services } = useOpenSearchDashboards<AgentTracesServices>();
  const visualizationTab = services.tabRegistry.getTab(AGENT_TRACES_VISUALIZATION_TAB_ID);
  const visualizationTabError = useTabError(visualizationTab);
  const visualizationBuilder = getVisualizationBuilder();
  const data = useObservable(visualizationBuilder.data$);
  const activeTabId = useSelector(selectActiveTab);
  const collapseFn = useRef((id: string, direction: PanelDirection) => {});

  const onChange = (panelId: string) => {
    collapseFn.current(panelId, 'right');
  };

  const tabsContent = (
    <TraceMetricsContext.Provider value={metricsResult}>
      <TraceFlyoutProvider>
        <TraceMetricsBar metrics={metricsResult.metrics} onErrorClick={handleErrorClick} />
        <AgentTracesTabs />
      </TraceFlyoutProvider>
    </TraceMetricsContext.Provider>
  );

  // Show style panel only when visualization tab is active and has no errors
  if (activeTabId === AGENT_TRACES_VISUALIZATION_TAB_ID && !visualizationTabError) {
    return (
      <TraceMetricsContext.Provider value={metricsResult}>
        <TraceFlyoutProvider>
          <TraceMetricsBar metrics={metricsResult.metrics} onErrorClick={handleErrorClick} />
          <EuiResizableContainer className="tabsPanelContainer">
            {(EuiResizablePanel, EuiResizableButton, { togglePanel }) => {
              collapseFn.current = (id, direction: PanelDirection = 'left') =>
                togglePanel?.(id, { direction });
              return (
                <>
                  <EuiResizablePanel
                    id="agent_traces_tabs"
                    className="tabsPanel"
                    initialSize={77.5}
                    paddingSize="none"
                  >
                    <AgentTracesTabs />
                  </EuiResizablePanel>

                  <EuiResizableButton />

                  <EuiResizablePanel
                    mode={['custom', { position: 'top' }]}
                    id="vis_style_panel"
                    className="visStylePanelOuter"
                    initialSize={22.5}
                    minSize="280px"
                    paddingSize="none"
                  >
                    {Boolean(data) && (
                      <div className="visStylePanelInner">
                        <EuiFlexGroup
                          className="visStylePanelTitle"
                          gutterSize="none"
                          justifyContent="spaceBetween"
                          alignItems="center"
                        >
                          <EuiFlexItem>
                            <EuiTitle size="xxs">
                              <p>
                                {i18n.translate('agentTraces.visualization.stylePanel.title', {
                                  defaultMessage: 'Settings',
                                })}
                              </p>
                            </EuiTitle>
                          </EuiFlexItem>
                          <EuiFlexItem grow={false}>
                            <EuiButtonIcon
                              color="text"
                              aria-label={'Toggle visualization style panel'}
                              iconType="menuRight"
                              onClick={() => onChange('vis_style_panel')}
                            />
                          </EuiFlexItem>
                        </EuiFlexGroup>
                        {visualizationBuilder.renderStylePanel({
                          className: 'visStylePanelBody',
                        })}
                      </div>
                    )}
                  </EuiResizablePanel>
                </>
              );
            }}
          </EuiResizableContainer>
        </TraceFlyoutProvider>
      </TraceMetricsContext.Provider>
    );
  }

  return tabsContent;
};
