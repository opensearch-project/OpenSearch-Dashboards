/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './metrics_vis_tab.scss';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useObservable } from 'react-use';
import { useSelector } from 'react-redux';
import { createPortal } from 'react-dom';
import { i18n } from '@osd/i18n';
import {
  EuiButtonEmpty,
  EuiButtonGroup,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiText,
  EuiTitle,
} from '@elastic/eui';

import { VisualizationContainer } from '../visualizations/visualization_container';
import { useTabResults } from '../../application/utils/hooks/use_tab_results';
import { ExploreMetricsRawTable } from '../data_table/explore_metrics_raw_table';
import { ActionBar } from './action_bar/action_bar';
import { EXPLORE_ACTION_BAR_SLOT_ID } from './tabs';
import { getVisualizationBuilder } from '../visualizations/visualization_builder';
import { shouldSkipQueryExecution } from '../../application/utils/state_management/actions/query_actions';
import { RootState } from '../../application/utils/state_management/store';
import { ChartType } from '../visualizations/utils/use_visualization_types';

const DEFAULT_SERIES_LIMIT = 20;

const QUICK_CHART_TYPES: Array<{ id: ChartType; label: string; iconType: string }> = [
  {
    id: 'line',
    label: i18n.translate('explore.metricsVisTab.chartTypeLine', { defaultMessage: 'Line' }),
    iconType: 'visLine',
  },
  {
    id: 'bar',
    label: i18n.translate('explore.metricsVisTab.chartTypeBar', { defaultMessage: 'Bar' }),
    iconType: 'visBarVertical',
  },
  {
    id: 'area',
    label: i18n.translate('explore.metricsVisTab.chartTypeArea', { defaultMessage: 'Area' }),
    iconType: 'visArea',
  },
  {
    id: 'metric',
    label: i18n.translate('explore.metricsVisTab.chartTypeMetric', { defaultMessage: 'Metric' }),
    iconType: 'visMetric',
  },
];

export const MetricsVisTab = () => {
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const [isSettingsCollapsed, setIsSettingsCollapsed] = useState(true);
  const [showAllSeries, setShowAllSeries] = useState(false);
  const visualizationBuilder = getVisualizationBuilder();
  const { results } = useTabResults();
  const data = useObservable(visualizationBuilder.data$);
  const visConfig = useObservable(visualizationBuilder.visConfig$);
  const query = useSelector((state: RootState) => state.query);

  useEffect(() => {
    setSlot(document.getElementById(EXPLORE_ACTION_BAR_SLOT_ID));
  }, []);

  useEffect(() => {
    setShowAllSeries(false);
  }, [query]);

  const { limitedRows, totalSeriesCount } = useMemo(() => {
    const allRows = results?.hits?.hits || [];
    if (allRows.length === 0) return { limitedRows: allRows, totalSeriesCount: 0 };

    const seriesSet = new Set<string>();
    for (const hit of allRows) {
      const s = hit._source?.Series;
      if (s !== undefined) seriesSet.add(String(s));
    }
    const total = seriesSet.size;

    if (showAllSeries || total <= DEFAULT_SERIES_LIMIT) {
      return { limitedRows: allRows, totalSeriesCount: total };
    }

    const allowed = new Set<string>();
    const filtered: typeof allRows = [];
    for (const hit of allRows) {
      const s = String(hit._source?.Series ?? '');
      if (allowed.size < DEFAULT_SERIES_LIMIT || allowed.has(s)) {
        allowed.add(s);
        filtered.push(hit);
      }
    }
    return { limitedRows: filtered, totalSeriesCount: total };
  }, [results, showAllSeries]);

  // Override VisualizationContainer's handleData with limited rows.
  // React fires child effects before parent effects, so this runs after
  // VisualizationContainer's own handleData(allRows) call.
  useEffect(() => {
    if (results && limitedRows !== (results.hits?.hits || [])) {
      const fieldSchema = results.fieldSchema || [];
      visualizationBuilder.handleData(limitedRows, fieldSchema);
    }
  }, [visualizationBuilder, results, limitedRows]);

  const showSettings = Boolean(data) && !shouldSkipQueryExecution(query);
  const showSeriesDisclaimer = !showAllSeries && totalSeriesCount > DEFAULT_SERIES_LIMIT;

  const onToggleCollapsed = () => {
    setIsSettingsCollapsed((prev) => !prev);
  };

  const onExpandSettings = () => {
    setIsSettingsCollapsed(false);
  };

  const onChartTypeChange = useCallback(
    (optionId: string) => {
      visualizationBuilder.setCurrentChartType(optionId as ChartType);
    },
    [visualizationBuilder]
  );

  const chartTypeToggle = showSettings && visConfig?.type && (
    <div className="metricsVisTab__chartTypeToggle">
      {showSeriesDisclaimer && (
        <EuiFlexGroup
          gutterSize="s"
          alignItems="center"
          responsive={false}
          data-test-subj="seriesLimitDisclaimer"
        >
          <EuiFlexItem grow={false}>
            <EuiText size="xs" color="warning">
              <EuiIcon type="alert" size="s" />{' '}
              {i18n.translate('explore.visualization.seriesLimitWarning', {
                defaultMessage: 'Showing {limit} of {count} available series',
                values: {
                  limit: DEFAULT_SERIES_LIMIT,
                  count: totalSeriesCount.toLocaleString(),
                },
              })}
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              size="xs"
              onClick={() => setShowAllSeries(true)}
              data-test-subj="showAllSeriesButton"
              title={i18n.translate('explore.visualization.showAllSeriesTooltip', {
                defaultMessage:
                  'Rendering too many series may impact performance and make data harder to read. Consider refining your queries.',
              })}
            >
              {i18n.translate('explore.visualization.showAllSeries', {
                defaultMessage: 'Show {count}',
                values: { count: totalSeriesCount.toLocaleString() },
              })}
            </EuiButtonEmpty>
          </EuiFlexItem>
        </EuiFlexGroup>
      )}
      <EuiButtonGroup
        legend={i18n.translate('explore.metricsVisTab.chartTypeLegend', {
          defaultMessage: 'Chart type',
        })}
        options={QUICK_CHART_TYPES.map(({ id, label }) => ({
          id,
          label,
        }))}
        idSelected={visConfig.type}
        onChange={onChartTypeChange}
        buttonSize="compressed"
      />
    </div>
  );

  const settingsPanel = showSettings && !isSettingsCollapsed && (
    <div className="visStylePanelOuter metricsVisTab__settingsPanel">
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
              aria-label={i18n.translate('explore.visualization.stylePanel.toggleAriaLabel', {
                defaultMessage: 'Toggle visualization style panel',
              })}
              iconType="menuRight"
              onClick={onToggleCollapsed}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
        {visualizationBuilder.renderStylePanel({ className: 'visStylePanelBody' })}
      </div>
    </div>
  );

  return (
    <div className="metricsVisTab">
      {slot && createPortal(<ActionBar />, slot)}
      <div className="metricsVisTab__chartArea">
        <div className="metricsVisTab__collapsedLayout">
          <div className="metricsVisTab__collapsedChart">
            {chartTypeToggle}
            <VisualizationContainer />
          </div>
          {showSettings && isSettingsCollapsed && (
            <button
              className="metricsVisTab__expandButton"
              onClick={onExpandSettings}
              aria-label={i18n.translate('explore.visualization.stylePanel.expandAriaLabel', {
                defaultMessage: 'Expand visualization settings panel',
              })}
            >
              <EuiButtonIcon
                color="text"
                iconType="menuLeft"
                aria-label={i18n.translate('explore.visualization.stylePanel.expandAriaLabel', {
                  defaultMessage: 'Expand visualization settings panel',
                })}
              />
            </button>
          )}
          {settingsPanel}
        </div>
      </div>
      <div className="metricsVisTab__rawTable">
        <ExploreMetricsRawTable />
      </div>
    </div>
  );
};
