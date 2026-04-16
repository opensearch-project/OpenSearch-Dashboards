/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './metrics_vis_tab.scss';

import { useState, useEffect, useCallback } from 'react';
import { useObservable } from 'react-use';
import { useSelector } from 'react-redux';
import { createPortal } from 'react-dom';
import { i18n } from '@osd/i18n';
import { EuiButtonGroup, EuiButtonIcon, EuiFlexGroup, EuiFlexItem, EuiTitle } from '@elastic/eui';

import { VisualizationContainer } from '../visualizations/visualization_container';
import { ExploreMetricsRawTable } from '../data_table/explore_metrics_raw_table';
import { ActionBar } from './action_bar/action_bar';
import { EXPLORE_ACTION_BAR_SLOT_ID } from './tabs';
import { getVisualizationBuilder } from '../visualizations/visualization_builder';
import { shouldSkipQueryExecution } from '../../application/utils/state_management/actions/query_actions';
import { RootState } from '../../application/utils/state_management/store';
import { ChartType } from '../visualizations/utils/use_visualization_types';

const QUICK_CHART_TYPES: Array<{ id: ChartType; label: string; iconType: string }> = [
  { id: 'line', label: 'Line', iconType: 'visLine' },
  { id: 'bar', label: 'Bar', iconType: 'visBarVertical' },
  { id: 'area', label: 'Area', iconType: 'visArea' },
  { id: 'metric', label: 'Metric', iconType: 'visMetric' },
];

export const MetricsVisTab = () => {
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const [isSettingsCollapsed, setIsSettingsCollapsed] = useState(true);
  const visualizationBuilder = getVisualizationBuilder();
  const data = useObservable(visualizationBuilder.data$);
  const visConfig = useObservable(visualizationBuilder.visConfig$);
  const query = useSelector((state: RootState) => state.query);

  useEffect(() => {
    setSlot(document.getElementById(EXPLORE_ACTION_BAR_SLOT_ID));
  }, []);

  const showSettings = Boolean(data) && !shouldSkipQueryExecution(query);

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
      <EuiButtonGroup
        legend="Chart type"
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
