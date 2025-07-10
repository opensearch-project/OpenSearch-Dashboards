/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { LineChartStyleControls } from './line_vis_config';
import { StyleControlsProps } from '../utils/use_visualization_types';
import { LegendOptionsPanel } from '../style_panel/legend/legend';
import { ThresholdOptions } from '../style_panel/threshold/threshold';
import { LineExclusiveVisOptions } from './exclusive_style';
import { TooltipOptionsPanel } from '../style_panel/tooltip/tooltip';
import { AxesOptions } from '../style_panel/axes/axes';
import { GridOptionsPanel } from '../style_panel/grid/grid';
import { AxesSelectPanel } from '../style_panel/axes/axes_selector';

export type LineVisStyleControlsProps = StyleControlsProps<LineChartStyleControls>;

export const LineVisStyleControls: React.FC<LineVisStyleControlsProps> = ({
  styleOptions,
  onStyleChange,
  numericalColumns = [],
  categoricalColumns = [],
  dateColumns = [],
  axisColumnMappings,
  updateVisualization,
}) => {
  const updateStyleOption = <K extends keyof LineChartStyleControls>(
    key: K,
    value: LineChartStyleControls[K]
  ) => {
    onStyleChange({ [key]: value });
  };

  const notShowLegend =
    (numericalColumns.length === 1 &&
      categoricalColumns.length === 0 &&
      dateColumns.length === 1) ||
    (numericalColumns.length === 1 && categoricalColumns.length === 1 && dateColumns.length === 0);

  return (
    <EuiFlexGroup direction="column" gutterSize="none">
      <EuiFlexItem grow={false}>
        <AxesSelectPanel
          numericalColumns={numericalColumns}
          categoricalColumns={categoricalColumns}
          dateColumns={dateColumns}
          currentMapping={axisColumnMappings}
          updateVisualization={updateVisualization}
          chartType="line"
        />
      </EuiFlexItem>

      <EuiFlexItem grow={false}>
        <AxesOptions
          categoryAxes={styleOptions.categoryAxes}
          valueAxes={styleOptions.valueAxes}
          onCategoryAxesChange={(categoryAxes) => updateStyleOption('categoryAxes', categoryAxes)}
          onValueAxesChange={(valueAxes) => updateStyleOption('valueAxes', valueAxes)}
          numericalColumns={numericalColumns}
          categoricalColumns={categoricalColumns}
          dateColumns={dateColumns}
        />
      </EuiFlexItem>

      <EuiFlexItem grow={false}>
        <ThresholdOptions
          thresholdLines={styleOptions.thresholdLines}
          onThresholdLinesChange={(thresholdLines) =>
            updateStyleOption('thresholdLines', thresholdLines)
          }
        />
      </EuiFlexItem>

      <EuiFlexItem grow={false}>
        <GridOptionsPanel
          grid={styleOptions.grid}
          onGridChange={(grid) => updateStyleOption('grid', grid)}
        />
      </EuiFlexItem>

      <EuiFlexItem grow={false}>
        <LegendOptionsPanel
          shouldShowLegend={!notShowLegend}
          legendOptions={{
            show: styleOptions.addLegend,
            position: styleOptions.legendPosition,
          }}
          onLegendOptionsChange={(legendOptions) => {
            if (legendOptions.show !== undefined) {
              updateStyleOption('addLegend', legendOptions.show);
            }
            if (legendOptions.position !== undefined) {
              updateStyleOption('legendPosition', legendOptions.position);
            }
          }}
        />
      </EuiFlexItem>

      <EuiFlexItem grow={false}>
        <TooltipOptionsPanel
          tooltipOptions={styleOptions.tooltipOptions}
          onTooltipOptionsChange={(tooltipOptions) =>
            updateStyleOption('tooltipOptions', {
              ...styleOptions.tooltipOptions,
              ...tooltipOptions,
            })
          }
        />
      </EuiFlexItem>

      <EuiFlexItem grow={false}>
        <LineExclusiveVisOptions
          addTimeMarker={styleOptions.addTimeMarker}
          lineStyle={styleOptions.lineStyle}
          lineMode={styleOptions.lineMode}
          lineWidth={styleOptions.lineWidth}
          onAddTimeMarkerChange={(addTimeMarker) =>
            updateStyleOption('addTimeMarker', addTimeMarker)
          }
          onLineModeChange={(lineMode) => updateStyleOption('lineMode', lineMode)}
          onLineWidthChange={(lineWidth) => updateStyleOption('lineWidth', lineWidth)}
          onLineStyleChange={(lineStyle) => updateStyleOption('lineStyle', lineStyle)}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
