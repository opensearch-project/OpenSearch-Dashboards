/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EuiSplitPanel, EuiButtonEmpty } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { ScatterChartStyleControls } from './scatter_vis_config';
import { GeneralVisOptions } from '../style_panel/general_vis_options';
import { StandardAxes } from '../types';
import { ScatterExclusiveVisOptions } from './scatter_exclusive_vis_options';
import { AllAxesOptions } from '../style_panel/standard_axes_options';
import { swapAxes } from '../utils/utils';
import { StyleControlsProps } from '../utils/use_visualization_types';
import { ChartTypeSwitcher } from '../style_panel/chart_type_switcher';

export type ScatterVisStyleControlsProps = StyleControlsProps<ScatterChartStyleControls>;

export const ScatterVisStyleControls: React.FC<ScatterVisStyleControlsProps> = ({
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
    axes: false,
  });

  const togglePanel = (panelId: string) => {
    setExpandedPanels({
      ...expandedPanels,
      [panelId]: !expandedPanels[panelId as keyof typeof expandedPanels],
    });
  };

  const updateStyleOption = <K extends keyof ScatterChartStyleControls>(
    key: K,
    value: ScatterChartStyleControls[K]
  ) => {
    onStyleChange({ [key]: value });
  };

  // if it is 2 metrics, then it should not show legend
  const notShowLegend = numericalColumns.length === 2 && categoricalColumns.length === 0;

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
          data-test-subj="scatterVisGeneralButton"
        >
          {i18n.translate('explore.vis.scatterChart.tabs.general', {
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
          data-test-subj="scatterVisBasicButton"
        >
          {i18n.translate('explore.vis.scatterChart.tabs.basic', {
            defaultMessage: 'Basic',
          })}
        </EuiButtonEmpty>
        {expandedPanels.basic && (
          <GeneralVisOptions
            shouldShowLegend={!notShowLegend}
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
          data-test-subj="scatterVisExclusiveButton"
        >
          {i18n.translate('explore.vis.scatterChart.tabs.exclusive', {
            defaultMessage: 'Scatter',
          })}
        </EuiButtonEmpty>
        {expandedPanels.exclusive && (
          <ScatterExclusiveVisOptions
            styles={styleOptions.exclusive}
            onChange={(exclusive) => updateStyleOption('exclusive', exclusive)}
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
          data-test-subj="scatterVisAxesButton"
        >
          {i18n.translate('explore.vis.scatterChart.tabs.axes', {
            defaultMessage: 'Axes',
          })}
        </EuiButtonEmpty>
        {expandedPanels.axes && (
          <AllAxesOptions
            disableGrid={false}
            standardAxes={styleOptions.StandardAxes}
            onChangeSwitchAxes={handleSwitchAxes}
            onStandardAxesChange={(standardAxes) => updateStyleOption('StandardAxes', standardAxes)}
          />
        )}
      </EuiSplitPanel.Inner>
    </EuiSplitPanel.Outer>
  );
};
