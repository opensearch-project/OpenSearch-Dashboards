/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { isEmpty } from 'lodash';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { LineChartStyleControls } from './line_vis_config';
import { StyleControlsProps } from '../utils/use_visualization_types';
import { LegendOptionsPanel } from '../style_panel/legend/legend';
import { ThresholdOptions } from '../style_panel/threshold_lines/threshold';
import { LineExclusiveVisOptions } from './line_exclusive_vis_options';
import { TooltipOptionsPanel } from '../style_panel/tooltip/tooltip';
import { AxesOptions } from '../style_panel/axes/axes';
import { AxesSelectPanel } from '../style_panel/axes/axes_selector';
import { TitleOptionsPanel } from '../style_panel/title/title';
import { AxisRole } from '../types';

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

  // Determine if the legend should be shown based on the selected mappings
  const hasColorMapping = !!axisColumnMappings?.[AxisRole.COLOR];
  const hasFacetMapping = !!axisColumnMappings?.[AxisRole.FACET];
  const hasYSecondMapping = !!axisColumnMappings?.[AxisRole.Y_SECOND];

  const shouldShowLegend = hasColorMapping || hasFacetMapping || hasYSecondMapping;
  const shouldShowTimeMarker = dateColumns.length !== 0;
  // The mapping object will be an empty object if no fields are selected on the axes selector. No
  // visualization is generated in this case so we shouldn't display style option panels.
  const hasMappingSelected = !isEmpty(axisColumnMappings);

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

      {hasMappingSelected && (
        <>
          <EuiFlexItem grow={false}>
            <AxesOptions
              categoryAxes={styleOptions.categoryAxes}
              valueAxes={styleOptions.valueAxes}
              onCategoryAxesChange={(categoryAxes) =>
                updateStyleOption('categoryAxes', categoryAxes)
              }
              onValueAxesChange={(valueAxes) => updateStyleOption('valueAxes', valueAxes)}
              numericalColumns={numericalColumns}
              categoricalColumns={categoricalColumns}
              dateColumns={dateColumns}
              axisColumnMappings={axisColumnMappings}
            />
          </EuiFlexItem>

          <EuiFlexItem grow={false}>
            <LineExclusiveVisOptions
              shouldShowTimeMarker={shouldShowTimeMarker}
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

          <EuiFlexItem grow={false}>
            <ThresholdOptions
              thresholdLines={styleOptions.thresholdLines}
              onThresholdLinesChange={(thresholdLines) =>
                updateStyleOption('thresholdLines', thresholdLines)
              }
            />
          </EuiFlexItem>

          {shouldShowLegend && (
            <EuiFlexItem grow={false}>
              <LegendOptionsPanel
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
          )}

          <EuiFlexItem grow={false}>
            <TitleOptionsPanel
              titleOptions={styleOptions.titleOptions}
              onShowTitleChange={(titleOptions) => {
                updateStyleOption('titleOptions', {
                  ...styleOptions.titleOptions,
                  ...titleOptions,
                });
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
        </>
      )}
    </EuiFlexGroup>
  );
};
