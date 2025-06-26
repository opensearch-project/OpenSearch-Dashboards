/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { i18n } from '@osd/i18n';
import { EuiSplitPanel, EuiButtonEmpty } from '@elastic/eui';
import { GeneralVisOptions } from '../style_panel/general_vis_options';
import { BarChartStyleControls } from './bar_vis_config';
import { BarExclusiveVisOptions } from './bar_exclusive_vis_options';
import { ThresholdOptions } from '../style_panel/threshold/threshold_options';
import { GridOptionsPanel } from '../style_panel/grid_options';
import { AxesOptions } from '../style_panel/axes_options';
import { TooltipOptionsPanel } from '../style_panel/tooltip_options';
import { StyleControlsProps } from '../utils/use_visualization_types';
import { ChartTypeSwitcher } from '../style_panel/chart_type_switcher';

export type BarVisStyleControlsProps = StyleControlsProps<BarChartStyleControls>;

export const BarVisStyleControls: React.FC<BarVisStyleControlsProps> = ({
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
    general: true,
    basic: false,
    exclusive: false,
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

  const updateStyleOption = <K extends keyof BarChartStyleControls>(
    key: K,
    value: BarChartStyleControls[K]
  ) => {
    onStyleChange({ [key]: value });
  };

  // if it is 1 metric and 1 category, then it should not show legend
  const notShowLegend =
    numericalColumns.length === 1 && categoricalColumns.length === 1 && dateColumns.length === 0;

  return (
    <EuiSplitPanel.Outer>
      <EuiSplitPanel.Inner paddingSize="s">
        <EuiButtonEmpty
          iconSide="left"
          color="text"
          iconType={expandedPanels.general ? 'arrowDown' : 'arrowRight'}
          onClick={() => togglePanel('general')}
          size="xs"
          data-test-subj="barVisGeneralButton"
        >
          {i18n.translate('explore.vis.barChart.tabs.general', {
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
          data-test-subj="barVisBasicButton"
        >
          {i18n.translate('explore.vis.barChart.tabs.basic', {
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
          iconType={expandedPanels.exclusive ? 'arrowDown' : 'arrowRight'}
          onClick={() => togglePanel('exclusive')}
          size="xs"
          data-test-subj="barVisExclusiveButton"
        >
          {i18n.translate('explore.vis.barChart.tabs.exclusive', {
            defaultMessage: 'Bar',
          })}
        </EuiButtonEmpty>
        {expandedPanels.exclusive && (
          <BarExclusiveVisOptions
            barWidth={styleOptions.barWidth}
            barPadding={styleOptions.barPadding}
            showBarBorder={styleOptions.showBarBorder}
            barBorderWidth={styleOptions.barBorderWidth}
            barBorderColor={styleOptions.barBorderColor}
            onBarWidthChange={(barWidth) => updateStyleOption('barWidth', barWidth)}
            onBarPaddingChange={(barPadding) => updateStyleOption('barPadding', barPadding)}
            onShowBarBorderChange={(showBarBorder) =>
              updateStyleOption('showBarBorder', showBarBorder)
            }
            onBarBorderWidthChange={(barBorderWidth) =>
              updateStyleOption('barBorderWidth', barBorderWidth)
            }
            onBarBorderColorChange={(barBorderColor) =>
              updateStyleOption('barBorderColor', barBorderColor)
            }
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
          data-test-subj="barVisTooltipButton"
        >
          {i18n.translate('explore.vis.barChart.tabs.tooltip', {
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
          iconType={expandedPanels.threshold ? 'arrowDown' : 'arrowRight'}
          onClick={() => togglePanel('threshold')}
          size="xs"
          data-test-subj="barVisThresholdButton"
        >
          {i18n.translate('explore.vis.barChart.tabs.threshold', {
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
          data-test-subj="barVisGridButton"
        >
          {i18n.translate('explore.vis.barChart.tabs.grid', {
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
          data-test-subj="barVisAxesButton"
        >
          {i18n.translate('explore.vis.barChart.tabs.axes', {
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
