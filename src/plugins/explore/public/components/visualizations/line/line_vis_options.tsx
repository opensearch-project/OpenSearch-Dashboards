/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiTabbedContent, EuiTabbedContentTab } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { LineChartStyleControls } from './line_vis_config';
import { BasicVisOptions } from '../style_panel/basic_vis_options';
import { GeneralVisOptions } from '../style_panel/general_vis_options';
import { ThresholdOptions } from '../style_panel/threshold_options';
import { GridOptionsPanel } from '../style_panel/grid_options';
import { AxesOptions } from '../style_panel/axes_options';
import { StyleControlsProps } from '../utils/use_visualization_types';

export type LineVisStyleControlsProps = StyleControlsProps<LineChartStyleControls>;

export const LineVisStyleControls: React.FC<LineVisStyleControlsProps> = ({
  styleOptions,
  onStyleChange,
  numericalColumns = [],
  categoricalColumns = [],
  dateColumns = [],
}) => {
  const updateStyleOption = <K extends keyof LineChartStyleControls>(
    key: K,
    value: LineChartStyleControls[K]
  ) => {
    onStyleChange({ [key]: value });
  };

  // if it is 1 metric and 1 date, then it should not show legend
  const notShowLegend =
    numericalColumns.length === 1 && categoricalColumns.length === 0 && dateColumns.length === 1;
  const tabs: EuiTabbedContentTab[] = [
    {
      id: 'basic',
      name: i18n.translate('explore.vis.lineChart.tabs.general', {
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
      name: i18n.translate('explore.vis.lineChart.tabs.exclusive', {
        defaultMessage: 'Exclusive',
      }),
      content: (
        <BasicVisOptions
          addTimeMarker={styleOptions.addTimeMarker}
          showLine={styleOptions.showLine}
          lineMode={styleOptions.lineMode}
          lineWidth={styleOptions.lineWidth}
          showDots={styleOptions.showDots}
          onAddTimeMarkerChange={(addTimeMarker) =>
            updateStyleOption('addTimeMarker', addTimeMarker)
          }
          onShowLineChange={(showLine) => updateStyleOption('showLine', showLine)}
          onLineModeChange={(lineMode) => updateStyleOption('lineMode', lineMode)}
          onLineWidthChange={(lineWidth) => updateStyleOption('lineWidth', lineWidth)}
          onShowDotsChange={(showDots) => updateStyleOption('showDots', showDots)}
        />
      ),
    },
    {
      id: 'threshold',
      name: i18n.translate('explore.vis.lineChart.tabs.threshold', {
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
      name: i18n.translate('explore.vis.lineChart.tabs.grid', {
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
      name: i18n.translate('explore.vis.lineChart.tabs.axes', {
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
