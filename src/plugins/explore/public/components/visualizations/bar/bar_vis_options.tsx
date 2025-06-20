/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiTabbedContent, EuiTabbedContentTab } from '@elastic/eui';
import { GeneralVisOptions } from '../style_panel/general_vis_options';
import { BarChartStyleControls } from './bar_vis_config';
import { VisColumn } from '../types';
import { BarExclusiveVisOptions } from './bar_exclusive_vis_options';
import { ThresholdOptions } from '../style_panel/threshold_options';
import { GridOptionsPanel } from '../style_panel/grid_options';
import { AxesOptions } from '../style_panel/axes_options';

export interface BarVisStyleControlsProps {
  styleOptions: BarChartStyleControls;
  onStyleChange: (newOptions: Partial<BarChartStyleControls>) => void;
  numericalColumns?: VisColumn[];
  categoricalColumns?: VisColumn[];
  dateColumns?: VisColumn[];
}

export const BarVisStyleControls: React.FC<BarVisStyleControlsProps> = ({
  styleOptions,
  onStyleChange,
  numericalColumns = [],
  categoricalColumns = [],
  dateColumns = [],
}) => {
  const updateStyleOption = <K extends keyof BarChartStyleControls>(
    key: K,
    value: BarChartStyleControls[K]
  ) => {
    onStyleChange({ [key]: value });
  };

  // if it is 1 metric and 1 category, then it should not show legend
  const notShowLegend =
    numericalColumns.length === 1 && categoricalColumns.length === 1 && dateColumns.length === 0;

  const tabs: EuiTabbedContentTab[] = [
    {
      id: 'basic',
      name: i18n.translate('explore.vis.barChart.tabs.general', {
        defaultMessage: 'Basic',
      }),
      content: (
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
      ),
    },
    {
      id: 'exclusive',
      name: i18n.translate('explore.vis.barChart.tabs.exclusive', {
        defaultMessage: 'Bar',
      }),
      content: (
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
      ),
    },
    {
      id: 'threshold',
      name: i18n.translate('explore.vis.barChart.tabs.threshold', {
        defaultMessage: 'Threshold',
      }),
      content: (
        <ThresholdOptions
          thresholdLine={styleOptions.thresholdLine}
          onThresholdChange={(thresholdLine) => updateStyleOption('thresholdLine', thresholdLine)}
        />
      ),
    },
    {
      id: 'grid',
      name: i18n.translate('explore.vis.barChart.tabs.grid', {
        defaultMessage: 'Grid',
      }),
      content: (
        <GridOptionsPanel
          grid={styleOptions.grid}
          onGridChange={(grid) => updateStyleOption('grid', grid)}
        />
      ),
    },
    {
      id: 'axes',
      name: i18n.translate('explore.vis.barChart.tabs.axes', {
        defaultMessage: 'Axes',
      }),
      content: (
        <AxesOptions
          categoryAxes={styleOptions.categoryAxes}
          valueAxes={styleOptions.valueAxes}
          onCategoryAxesChange={(categoryAxes) => updateStyleOption('categoryAxes', categoryAxes)}
          onValueAxesChange={(valueAxes) => updateStyleOption('valueAxes', valueAxes)}
          numericalColumns={numericalColumns}
          categoricalColumns={categoricalColumns}
          dateColumns={dateColumns}
        />
      ),
    },
  ];

  return (
    <EuiTabbedContent
      tabs={tabs}
      initialSelectedTab={tabs[0]}
      autoFocus="selected"
      size="s"
      expand={false}
    />
  );
};
