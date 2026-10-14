/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './metrics_page_tabs.scss';
import React from 'react';
import {
  EuiTabs,
  EuiTab,
  EuiHorizontalRule,
  EuiIcon,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { useSelector, useDispatch } from 'react-redux';
import { MetricsExploreTab } from './explore';
import { MetricsQueryPanel } from './metrics_query_panel';
import { BottomRightContainer } from './metrics_bottom_container/bottom_right_container';
import { DatasetSelectWidget } from '../../../components/query_panel/query_panel_widgets/dataset_select';
import { RootState } from '../../utils/state_management/store';
import { setMetricsPageMode } from '../../utils/state_management/slices/ui/ui_slice';
import { MetricsPageMode, MetricsPageModeContext } from './metrics_page_mode_context';
import { MetricsSourceTypeSelect } from './metrics_source_type_select';
import { selectDataset } from '../../utils/state_management/selectors';
import { getSourceTypeRegistry } from '../../../services/source_type_registry';

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
  const dataset = useSelector(selectDataset);
  // The Explore tab's metric browser needs the source's metrics resource client; a source
  // without one gets only the Query tab.
  const hasMetricBrowser = !!getSourceTypeRegistry().getMetricsResourceClientId(dataset);
  const selectedMode = useSelector((state: RootState) => state.ui.metricsPageMode) || 'explore';
  const mode: MetricsPageMode = hasMetricBrowser ? selectedMode : 'query';
  const tabs = hasMetricBrowser ? PAGE_TABS : PAGE_TABS.filter((tab) => tab.id === 'query');

  return (
    <MetricsPageModeContext.Provider value={mode}>
      <div className="metricsPageTabs__tabBar">
        <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
          <EuiFlexItem grow={false}>
            <MetricsSourceTypeSelect />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <DatasetSelectWidget />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiTabs size="s" className="metricsPageTabs__tabs" bottomBorder={false}>
              {tabs.map((tab) => (
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
          </EuiFlexItem>
        </EuiFlexGroup>
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
