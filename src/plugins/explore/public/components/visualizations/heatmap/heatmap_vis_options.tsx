/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EuiSplitPanel, EuiButtonEmpty } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { HeatmapChartStyleControls } from './heatmap_vis_config';
import { GeneralVisOptions } from '../style_panel/general_vis_options';
import { StandardAxes } from '../types';
import {
  HeatmapLabelVisOptions,
  HeatmapExclusiveVisOptions,
} from './heatmap_exclusive_vis_options';
import { AllAxesOptions } from '../style_panel/standard_axes_options';
import { swapAxes } from '../utils/utils';
import { StyleControlsProps } from '../utils/use_visualization_types';
import { ChartTypeSwitcher } from '../style_panel/chart_type_switcher';

export type HeatmapVisStyleControlsProps = StyleControlsProps<HeatmapChartStyleControls>;

export const HeatmapVisStyleControls: React.FC<HeatmapVisStyleControlsProps> = ({
  styleOptions,
  onStyleChange,
  numericalColumns = [],
  categoricalColumns = [],
  dateColumns = [],
  availableChartTypes = [],
  selectedChartType,
  onChartTypeChange,
}) => {
  // State to track expanded/collapsed state of each panel
  const [expandedPanels, setExpandedPanels] = useState({
    general: false,
    basic: false,
    exclusive: false,
    label: false,
    axes: false,
  });

  const togglePanel = (panelId: string) => {
    setExpandedPanels({
      ...expandedPanels,
      [panelId]: !expandedPanels[panelId as keyof typeof expandedPanels],
    });
  };

  const shouldShowType = numericalColumns.length === 3;
  const updateStyleOption = <K extends keyof HeatmapChartStyleControls>(
    key: K,
    value: HeatmapChartStyleControls[K]
  ) => {
    onStyleChange({ [key]: value });
  };

  const handleSwitchAxes = (axes: StandardAxes[]) => {
    const updateAxes = swapAxes(axes);
    updateStyleOption('StandardAxes', updateAxes);
  };

  return (
    <EuiSplitPanel.Outer>
      <EuiSplitPanel.Inner paddingSize="s">
        <EuiButtonEmpty
          iconSide="left"
          color="text"
          iconType={expandedPanels.general ? 'arrowDown' : 'arrowRight'}
          onClick={() => togglePanel('general')}
          size="xs"
          data-test-subj="heatmapVisGeneralButton"
        >
          {i18n.translate('explore.vis.heatmapChart.tabs.general', {
            defaultMessage: 'General',
          })}
        </EuiButtonEmpty>
        {expandedPanels.general && (
          <ChartTypeSwitcher
            availableChartTypes={availableChartTypes}
            selectedChartType={selectedChartType}
            onChartTypeChange={onChartTypeChange}
          />
        )}
      </EuiSplitPanel.Inner>

      <EuiSplitPanel.Inner paddingSize="s">
        <EuiButtonEmpty
          iconSide="left"
          color="text"
          iconType={expandedPanels.basic ? 'arrowDown' : 'arrowRight'}
          onClick={() => togglePanel('basic')}
          size="xs"
          data-test-subj="heatmapVisBasicButton"
        >
          {i18n.translate('explore.vis.heatmapChart.tabs.basic', {
            defaultMessage: 'Basic',
          })}
        </EuiButtonEmpty>
        {expandedPanels.basic && (
          <GeneralVisOptions
            addTooltip={styleOptions.addTooltip}
            addLegend={styleOptions.addLegend}
            legendPosition={styleOptions.legendPosition}
            onAddTooltipChange={(addTooltip) => updateStyleOption('addTooltip', addTooltip)}
            onAddLegendChange={(addLegend) => updateStyleOption('addLegend', addLegend)}
            onLegendPositionChange={(legendPosition) =>
              updateStyleOption('legendPosition', legendPosition)
            }
          />
        )}
      </EuiSplitPanel.Inner>

      <EuiSplitPanel.Inner paddingSize="s">
        <EuiButtonEmpty
          iconSide="left"
          color="text"
          iconType={expandedPanels.exclusive ? 'arrowDown' : 'arrowRight'}
          onClick={() => togglePanel('exclusive')}
          size="xs"
          data-test-subj="heatmapVisExclusiveButton"
        >
          {i18n.translate('explore.vis.heatmapChart.tabs.exclusive', {
            defaultMessage: 'Heatmap',
          })}
        </EuiButtonEmpty>
        {expandedPanels.exclusive && (
          <HeatmapExclusiveVisOptions
            styles={styleOptions.exclusive}
            onChange={(exclusive) => updateStyleOption('exclusive', exclusive)}
          />
        )}
      </EuiSplitPanel.Inner>

      <EuiSplitPanel.Inner paddingSize="s">
        <EuiButtonEmpty
          iconSide="left"
          color="text"
          iconType={expandedPanels.label ? 'arrowDown' : 'arrowRight'}
          onClick={() => togglePanel('label')}
          size="xs"
          data-test-subj="heatmapVisLabelButton"
        >
          {i18n.translate('explore.vis.heatmapChart.tabs.label', {
            defaultMessage: 'Label',
          })}
        </EuiButtonEmpty>
        {expandedPanels.label && (
          <HeatmapLabelVisOptions
            shouldShowType={shouldShowType}
            styles={styleOptions.label}
            onChange={(label) => updateStyleOption('label', label)}
          />
        )}
      </EuiSplitPanel.Inner>

      <EuiSplitPanel.Inner paddingSize="s">
        <EuiButtonEmpty
          iconSide="left"
          color="text"
          iconType={expandedPanels.axes ? 'arrowDown' : 'arrowRight'}
          onClick={() => togglePanel('axes')}
          size="xs"
          data-test-subj="heatmapVisAxesButton"
        >
          {i18n.translate('explore.vis.heatmapChart.tabs.axes', {
            defaultMessage: 'Axes',
          })}
        </EuiButtonEmpty>
        {expandedPanels.axes && (
          <AllAxesOptions
            disableGrid={true}
            standardAxes={styleOptions.StandardAxes}
            onChangeSwitchAxes={handleSwitchAxes}
            onStandardAxesChange={(standardAxes) => updateStyleOption('StandardAxes', standardAxes)}
          />
        )}
      </EuiSplitPanel.Inner>
    </EuiSplitPanel.Outer>
  );
};
