/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './metrics_page_tabs.scss';
import React, { useMemo, useState } from 'react';
import {
  EuiTabs,
  EuiTab,
  EuiHorizontalRule,
  EuiIcon,
  EuiButtonEmpty,
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
import { CreateMetricsRuleFlyout } from './create_metrics_rule_flyout';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';

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
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const mode = useSelector((state: RootState) => state.ui.metricsPageMode) || 'explore';
  const dataConnectionId = useSelector((state: RootState) => state.query.dataset?.id || '');
  const [showAlertRuleFlyout, setShowAlertRuleFlyout] = useState(false);

  const metricsExploreState = useSelector((state: RootState) => state.tab.metricsExplore);

  // Read queries from either:
  // - Query tab: QueryStringManager (synced on every keystroke)
  // - Explore tab: the selected metric from the exploration state
  const parsedQueries = useMemo(() => {
    if (!showAlertRuleFlyout) return [];

    // Try QueryStringManager first (Query tab)
    const raw = String(services.data.query.queryString.getQuery().query || '');
    if (raw.trim()) {
      if (raw.includes(';\n') || raw.endsWith(';')) {
        return raw
          .split(/;\s*\n/)
          .map((q) => q.replace(/;\s*$/, '').trim())
          .filter(Boolean);
      }
      return [raw.trim()];
    }

    // Fallback: read from Explore tab's selected metric
    if (mode === 'explore' && metricsExploreState?.metric) {
      return [metricsExploreState.metric];
    }

    return [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAlertRuleFlyout, mode, metricsExploreState?.metric]);

  return (
    <MetricsPageModeContext.Provider value={mode}>
      <div className="metricsPageTabs__tabBar">
        <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
          <EuiFlexItem grow={false}>
            <DatasetSelectWidget />
          </EuiFlexItem>
          <EuiFlexItem>
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
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              size="s"
              iconType="bell"
              onClick={() => setShowAlertRuleFlyout(true)}
              data-test-subj="metricsCreateAlertRuleBtn"
            >
              {i18n.translate('explore.metricsPage.createAlertRule', {
                defaultMessage: 'Create alert rule',
              })}
            </EuiButtonEmpty>
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
      {showAlertRuleFlyout && (
        <CreateMetricsRuleFlyout
          queries={parsedQueries}
          datasourceId={dataConnectionId}
          onClose={() => setShowAlertRuleFlyout(false)}
          http={services.http as any}
        />
      )}
    </MetricsPageModeContext.Provider>
  );
};
