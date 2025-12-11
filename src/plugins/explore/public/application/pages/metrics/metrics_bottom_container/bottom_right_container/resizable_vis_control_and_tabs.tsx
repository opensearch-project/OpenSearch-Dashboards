/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './resizable_vis_control_and_tabs.scss';

import React, { useRef } from 'react';
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

import { getVisualizationBuilder } from '../../../../../components/visualizations/visualization_builder';
import { ExploreTabs } from '../../../../../components/tabs/tabs';
import { selectActiveTab } from '../../../../utils/state_management/selectors';
import { useOpenSearchDashboards } from '../../../../../../../opensearch_dashboards_react/public';
import { useTabError } from '../../../../utils/hooks/use_tab_error';
import { ExploreServices } from '../../../../../types';
import { EXPLORE_VISUALIZATION_TAB_ID } from '../../../../../../common';

export const ResizableVisControlAndTabs = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const visualizationTab = services.tabRegistry.getTab(EXPLORE_VISUALIZATION_TAB_ID);
  const visualizationTabError = useTabError(visualizationTab);
  const visualizationBuilder = getVisualizationBuilder();
  const data = useObservable(visualizationBuilder.data$);
  const activeTabId = useSelector(selectActiveTab);
  const collapseFn = useRef((id: string, direction: PanelDirection) => {});

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
    <EuiResizableContainer style={{ height: '100%' }}>
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
                          {i18n.translate('explore.visualization.stylePanel.title', {
                            defaultMessage: 'Settings',
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
                  {visualizationBuilder.renderStylePanel({ className: 'visStylePanelBody' })}
                </div>
              )}
            </EuiResizablePanel>
          </>
        );
      }}
    </EuiResizableContainer>
  );
};
