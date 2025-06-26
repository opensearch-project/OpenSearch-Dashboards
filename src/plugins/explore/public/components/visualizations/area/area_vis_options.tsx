/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EuiSplitPanel, EuiButtonEmpty } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { AreaChartStyleControls } from './area_vis_config';
import { GeneralVisOptions } from '../style_panel/general_vis_options';
import { ThresholdOptions } from '../style_panel/threshold/threshold_options';
import { GridOptionsPanel } from '../style_panel/grid_options';
import { AxesOptions } from '../style_panel/axes_options';
import { TooltipOptionsPanel } from '../style_panel/tooltip_options';
import { StyleControlsProps } from '../utils/use_visualization_types';
import { ChartTypeSwitcher } from '../style_panel/chart_type_switcher';

export type AreaVisStyleControlsProps = StyleControlsProps<AreaChartStyleControls>;

export const AreaVisStyleControls: React.FC<AreaVisStyleControlsProps> = ({
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
    tooltip: false,
    threshold: false,
    grid: false,
    axes: false,
  });

  const togglePanel = (panelId: string) => {
    setExpandedPanels({
      ...expandedPanels,
      [panelId]: !expandedPanels[panelId as keyof typeof expandedPanels],
    });
  };

  const updateStyleOption = <K extends keyof AreaChartStyleControls>(
    key: K,
    value: AreaChartStyleControls[K]
  ) => {
    onStyleChange({ [key]: value });
  };

  const notShowLegend =
    (numericalColumns.length === 1 && categoricalColumns.length === 1) ||
    (numericalColumns.length === 1 && dateColumns.length === 1);

  return (
    <EuiSplitPanel.Outer>
      <EuiSplitPanel.Inner paddingSize="s">
        <EuiButtonEmpty
          iconSide="left"
          color="text"
          iconType={expandedPanels.general ? 'arrowDown' : 'arrowRight'}
          onClick={() => togglePanel('general')}
          size="xs"
          data-test-subj="areaVisGeneralButton"
        >
          {i18n.translate('explore.vis.areaChart.tabs.general', {
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
          iconType={expandedPanels.tooltip ? 'arrowDown' : 'arrowRight'}
          onClick={() => togglePanel('tooltip')}
          size="xs"
          data-test-subj="areaVisTooltipButton"
        >
          {i18n.translate('explore.vis.areaChart.tabs.tooltip', {
            defaultMessage: 'Tooltip',
          })}
        </EuiButtonEmpty>
        {expandedPanels.tooltip && (
          <TooltipOptionsPanel
            tooltipOptions={styleOptions.tooltipOptions}
            onTooltipOptionsChange={(tooltipOptions) =>
              updateStyleOption('tooltipOptions', {
                ...styleOptions.tooltipOptions,
                ...tooltipOptions,
              })
            }
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
          data-test-subj="areaVisBasicButton"
        >
          {i18n.translate('explore.vis.areaChart.tabs.basic', {
            defaultMessage: 'Basic',
          })}
        </EuiButtonEmpty>
        {expandedPanels.basic && (
          <GeneralVisOptions
            shouldShowLegend={!notShowLegend}
            addLegend={styleOptions.addLegend}
            legendPosition={styleOptions.legendPosition}
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
          iconType={expandedPanels.threshold ? 'arrowDown' : 'arrowRight'}
          onClick={() => togglePanel('threshold')}
          size="xs"
          data-test-subj="areaVisThresholdButton"
        >
          {i18n.translate('explore.vis.areaChart.tabs.threshold', {
            defaultMessage: 'Threshold',
          })}
        </EuiButtonEmpty>
        {expandedPanels.threshold && (
          <ThresholdOptions
            thresholdLines={styleOptions.thresholdLines}
            onThresholdLinesChange={(thresholdLines) =>
              updateStyleOption('thresholdLines', thresholdLines)
            }
          />
        )}
      </EuiSplitPanel.Inner>

      <EuiSplitPanel.Inner paddingSize="s">
        <EuiButtonEmpty
          iconSide="left"
          color="text"
          iconType={expandedPanels.grid ? 'arrowDown' : 'arrowRight'}
          onClick={() => togglePanel('grid')}
          size="xs"
          data-test-subj="areaVisGridButton"
        >
          {i18n.translate('explore.vis.areaChart.tabs.grid', {
            defaultMessage: 'Grid',
          })}
        </EuiButtonEmpty>
        {expandedPanels.grid && (
          <GridOptionsPanel
            grid={styleOptions.grid}
            onGridChange={(grid) => updateStyleOption('grid', grid)}
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
          data-test-subj="areaVisAxesButton"
        >
          {i18n.translate('explore.vis.areaChart.tabs.axes', {
            defaultMessage: 'Axes',
          })}
        </EuiButtonEmpty>
        {expandedPanels.axes && (
          <AxesOptions
            categoryAxes={styleOptions.categoryAxes}
            valueAxes={styleOptions.valueAxes}
            onCategoryAxesChange={(categoryAxes) => updateStyleOption('categoryAxes', categoryAxes)}
            onValueAxesChange={(valueAxes) => updateStyleOption('valueAxes', valueAxes)}
            numericalColumns={numericalColumns}
            categoricalColumns={categoricalColumns}
            dateColumns={dateColumns}
          />
        )}
      </EuiSplitPanel.Inner>
    </EuiSplitPanel.Outer>
  );
};
