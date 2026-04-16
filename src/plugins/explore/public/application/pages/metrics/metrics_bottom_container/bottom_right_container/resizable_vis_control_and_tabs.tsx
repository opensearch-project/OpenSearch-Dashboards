/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import './resizable_vis_control_and_tabs.scss';
import { useObservable } from 'react-use';
import { useSelector } from 'react-redux';
import { i18n } from '@osd/i18n';
import {
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiResizableContainer,
  EuiTab,
  EuiTabs,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { PanelDirection } from '@elastic/eui/src/components/resizable_container/types';

import { getVisualizationBuilder } from '../../../../../components/visualizations/visualization_builder';
import { ExploreTabs } from '../../../../../components/tabs/tabs';
import { selectActiveTab } from '../../../../utils/state_management/selectors';
import { useOpenSearchDashboards } from '../../../../../../../opensearch_dashboards_react/public';
import { useTabError } from '../../../../utils/hooks/use_tab_error';
import { ExploreServices } from '../../../../../types';
import { EXPLORE_VISUALIZATION_TAB_ID } from '../../../../../../common';
import { MetricsAlertsPanel } from './metrics_alerts_panel';
import { METRICS_ALERTING_APP_ID } from '../../../../utils/metrics_feature_constants';

type SidePanelTabId = 'settings' | 'alerts';

export const ResizableVisControlAndTabs = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const visualizationTab = services.tabRegistry.getTab(EXPLORE_VISUALIZATION_TAB_ID);
  const visualizationTabError = useTabError(visualizationTab);
  const visualizationBuilder = getVisualizationBuilder();
  const data = useObservable(visualizationBuilder.data$);
  const availableApplications = useObservable(
    services.core.application.applications$,
    new Map<string, unknown>()
  ) as ReadonlyMap<string, unknown>;
  const activeTabId = useSelector(selectActiveTab);
  const collapseFn = useRef((id: string, direction: PanelDirection) => {});
  const [activeSidePanelTab, setActiveSidePanelTab] = useState<SidePanelTabId>('settings');
  const isAlertingUiAvailable = useMemo(
    () => availableApplications?.has?.(METRICS_ALERTING_APP_ID) ?? false,
    [availableApplications]
  );

  const sidePanelTabs = useMemo(
    () =>
      [
        {
          id: 'settings' as SidePanelTabId,
          name: i18n.translate('explore.visualization.stylePanel.settingsTabLabel', {
            defaultMessage: 'Settings',
          }),
        },
        isAlertingUiAvailable
          ? {
              id: 'alerts' as SidePanelTabId,
              name: i18n.translate('explore.visualization.stylePanel.alertsTabLabel', {
                defaultMessage: 'Alerts',
              }),
            }
          : null,
      ].filter(Boolean) as Array<{ id: SidePanelTabId; name: string }>,
    [isAlertingUiAvailable]
  );

  useEffect(() => {
    if (!isAlertingUiAvailable && activeSidePanelTab === 'alerts') {
      setActiveSidePanelTab('settings');
    }
  }, [activeSidePanelTab, isAlertingUiAvailable]);

  const onChange = (panelId: string) => {
    collapseFn.current(panelId, 'right');
  };

  if (activeTabId !== EXPLORE_VISUALIZATION_TAB_ID) {
    return <ExploreTabs />;
  }

  // Do not display style panel if there are errors
  if (activeTabId === EXPLORE_VISUALIZATION_TAB_ID && !!visualizationTabError) {
    return <ExploreTabs />;
  }

  return (
    <EuiResizableContainer className="tabsPanelContainer">
      {(EuiResizablePanel, EuiResizableButton, { togglePanel }) => {
        collapseFn.current = (id, direction: PanelDirection = 'left') =>
          togglePanel?.(id, { direction });
        return (
          <>
            <EuiResizablePanel
              id="explore_tabs"
              className="tabsPanel"
              initialSize={77.5}
              paddingSize="none"
            >
              <ExploreTabs />
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
                        {i18n.translate('explore.metrics.visualization.stylePanel.title', {
                          defaultMessage: 'Metric tools',
                        })}
                      </p>
                    </EuiTitle>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiButtonIcon
                      color="text"
                      aria-label={i18n.translate(
                        'explore.visualization.stylePanel.toggleAriaLabel',
                        {
                          defaultMessage: 'Toggle visualization style panel',
                        }
                      )}
                      iconType="menuRight"
                      onClick={() => onChange('vis_style_panel')}
                    />
                  </EuiFlexItem>
                </EuiFlexGroup>

                <EuiTabs className="visStylePanelTabs">
                  {sidePanelTabs.map((tab) => (
                    <EuiTab
                      key={tab.id}
                      onClick={() => setActiveSidePanelTab(tab.id)}
                      isSelected={activeSidePanelTab === tab.id}
                    >
                      {tab.name}
                    </EuiTab>
                  ))}
                </EuiTabs>

                {activeSidePanelTab === 'settings' ? (
                  Boolean(data) ? (
                    visualizationBuilder.renderStylePanel({ className: 'visStylePanelBody' })
                  ) : (
                    <EuiText size="xs" className="visStylePanelBody">
                      <p>
                        {i18n.translate('explore.visualization.stylePanel.noSettingsMessage', {
                          defaultMessage:
                            'Settings will appear after a metric visualization is available.',
                        })}
                      </p>
                    </EuiText>
                  )
                ) : (
                  <MetricsAlertsPanel />
                )}
              </div>
            </EuiResizablePanel>
          </>
        );
      }}
    </EuiResizableContainer>
  );
};
