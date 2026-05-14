/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './metrics_page_tabs.scss';
import React from 'react';
import { EuiTabs, EuiTab, EuiHorizontalRule, EuiIcon } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { useSelector, useDispatch } from 'react-redux';
import { MetricsExploreTab } from './explore';
import { MetricsQueryPanel } from './metrics_query_panel';
import { BottomRightContainer } from './metrics_bottom_container/bottom_right_container';
import { DatasetSelectWidget } from '../../../components/query_panel/query_panel_widgets/dataset_select';
import { RootState } from '../../utils/state_management/store';
import { setMetricsPageMode } from '../../utils/state_management/slices/ui/ui_slice';
import { MetricsPageMode, MetricsPageModeContext } from './metrics_page_mode_context';

export { useMetricsPageMode } from './metrics_page_mode_context';

const PAGE_TABS: Array<{ id: MetricsPageMode; label: string; iconType: string }> = [
  {
    id: 'explore',
    label: i18n.translate('explore.metricsPage.exploreTab', { defaultMessage: 'Explore' }),
    iconType: 'compass',
  },
  {
    id: 'query',
    label: i18n.translate('explore.metricsPage.queryTab', { defaultMessage: 'Query' }),
    iconType: 'editorCodeBlock',
  },
];

export const MetricsPageTabs: React.FC = () => {
  const dispatch = useDispatch();
  const mode = useSelector((state: RootState) => state.ui.metricsPageMode) || 'explore';
  return (
    <MetricsPageModeContext.Provider value={mode}>
      <div className="metricsPageTabs__tabBar">
        <DatasetSelectWidget />
        <EuiTabs size="s" className="metricsPageTabs__tabs" bottomBorder={false}>
          {PAGE_TABS.map((tab) => (
            <EuiTab
              key={tab.id}
              isSelected={mode === tab.id}
              onClick={() => dispatch(setMetricsPageMode(tab.id))}
              data-test-subj={`metricsPageTab-${tab.id}`}
            >
              <EuiIcon type={tab.iconType} size="m" style={{ marginRight: 6 }} />
              {tab.label}
            </EuiTab>
          ))}
        </EuiTabs>
      </div>
      {mode === 'explore' ? (
        <div className="explore-layout__canvas metricsPageTabs__exploreCanvas">
          <MetricsExploreTab />
        </div>
      ) : (
        <>
          <MetricsQueryPanel />
          <EuiHorizontalRule margin="none" />
          <BottomRightContainer />
        </>
      )}
    </MetricsPageModeContext.Provider>
  );
};
