/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiTabbedContent, EuiTabbedContentTab } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { LineChartStyleControls } from './line_vis_config';
import { BasicVisOptions } from '../style_panel/basic_vis_options';
import { ThresholdOptions } from '../style_panel/threshold_options';
import { GridOptions } from '../style_panel/grid_options';
import { SeriesPanel } from '../style_panel/series_panel';
import { DataConfigPanel } from '../style_panel/data_config_panel';
import { DiscoverVisColumn } from '../types';

export interface LineVisStyleControlsProps {
  styleOptions: Partial<LineChartStyleControls>;
  onStyleChange: (newOptions: Partial<LineChartStyleControls>) => void;
  numericalColumns?: DiscoverVisColumn[];
  categoricalColumns?: DiscoverVisColumn[];
  dateColumns?: DiscoverVisColumn[];
}

export const LineVisStyleControls: React.FC<LineVisStyleControlsProps> = ({
  styleOptions,
  onStyleChange,
  numericalColumns = [],
  categoricalColumns = [],
  dateColumns = [],
}) => {
  console.log('LineVisStyleControls', styleOptions);
  const updateStyleOption = <K extends keyof LineChartStyleControls>(
    key: K,
    value: LineChartStyleControls[K]
  ) => {
    onStyleChange({ [key]: value });
  };

  const tabs: EuiTabbedContentTab[] = [
    {
      id: 'basic',
      name: i18n.translate('discover.vis.lineChart.tabs.basic', {
        defaultMessage: 'Basic',
      }),
      content: (
        <BasicVisOptions
          addTooltip={styleOptions.addTooltip}
          addLegend={styleOptions.addLegend}
          legendPosition={styleOptions.legendPosition}
          addTimeMarker={styleOptions.addTimeMarker}
          onAddTooltipChange={(addTooltip) => updateStyleOption('addTooltip', addTooltip)}
          onAddLegendChange={(addLegend) => updateStyleOption('addLegend', addLegend)}
          onLegendPositionChange={(legendPosition) =>
            updateStyleOption('legendPosition', legendPosition)
          }
          onAddTimeMarkerChange={(addTimeMarker) =>
            updateStyleOption('addTimeMarker', addTimeMarker)
          }
        />
      ),
    },
    {
      id: 'series',
      name: i18n.translate('discover.vis.lineChart.tabs.series', {
        defaultMessage: 'Series',
      }),
      content: (
        <SeriesPanel
          seriesParams={styleOptions.seriesParams}
          valueAxes={styleOptions.valueAxes}
          onSeriesParamsChange={(seriesParams) => updateStyleOption('seriesParams', seriesParams)}
          onValueAxesChange={(valueAxes) => updateStyleOption('valueAxes', valueAxes)}
        />
      ),
    },
    {
      id: 'threshold',
      name: i18n.translate('discover.vis.lineChart.tabs.threshold', {
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
      name: i18n.translate('discover.vis.lineChart.tabs.grid', {
        defaultMessage: 'Grid & Axes',
      }),
      content: (
        <GridOptions
          grid={styleOptions.grid}
          categoryAxes={styleOptions.categoryAxes}
          valueAxes={styleOptions.valueAxes}
          onGridChange={(grid) => updateStyleOption('grid', grid)}
          onCategoryAxesChange={(categoryAxes) => updateStyleOption('categoryAxes', categoryAxes)}
          onValueAxesChange={(valueAxes) => updateStyleOption('valueAxes', valueAxes)}
        />
      ),
    },
    {
      id: 'data',
      name: i18n.translate('discover.vis.lineChart.tabs.data', {
        defaultMessage: 'Data',
      }),
      content: (
        <DataConfigPanel
          dataConfig={styleOptions.dataConfig}
          onDataConfigChange={(dataConfig) => updateStyleOption('dataConfig', dataConfig)}
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
