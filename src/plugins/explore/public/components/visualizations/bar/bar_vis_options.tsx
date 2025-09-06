/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { isEmpty } from 'lodash';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { BarChartStyleControls } from './bar_vis_config';
import { StyleControlsProps } from '../utils/use_visualization_types';
import { LegendOptionsPanel } from '../style_panel/legend/legend';
import { ThresholdOptions } from '../style_panel/threshold_lines/threshold';
import { BarExclusiveVisOptions } from './bar_exclusive_vis_options';
import { TooltipOptionsPanel } from '../style_panel/tooltip/tooltip';
import { AxesSelectPanel } from '../style_panel/axes/axes_selector';
import { AllAxesOptions } from '../style_panel/axes/standard_axes_options';
import { TitleOptionsPanel } from '../style_panel/title/title';
import { AxisRole, VisFieldType } from '../types';
import { BucketOptionsPanel } from './bucket_options';

export type BarVisStyleControlsProps = StyleControlsProps<BarChartStyleControls>;

export const BarVisStyleControls: React.FC<BarVisStyleControlsProps> = ({
  styleOptions,
  onStyleChange,
  numericalColumns = [],
  categoricalColumns = [],
  dateColumns = [],
  availableChartTypes = [],
  selectedChartType,
  axisColumnMappings,
  updateVisualization,
}) => {
  const updateStyleOption = <K extends keyof BarChartStyleControls>(
    key: K,
    value: BarChartStyleControls[K]
  ) => {
    onStyleChange({ [key]: value });
  };

  // Determine if the legend should be shown based on the registration of a COLOR or FACET field
  const hasColorMapping = !!axisColumnMappings?.[AxisRole.COLOR];
  const hasFacetMapping = !!axisColumnMappings?.[AxisRole.FACET];
  const shouldShowLegend = hasColorMapping || hasFacetMapping;

  const bucketType =
    axisColumnMappings[AxisRole.X]?.schema === VisFieldType.Numerical
      ? axisColumnMappings[AxisRole.Y] === undefined
        ? 'single'
        : 'num'
      : axisColumnMappings[AxisRole.X]?.schema === VisFieldType.Date
      ? 'time'
      : 'cate';

  // The mapping object will be an empty object if no fields are selected on the axes selector. No
  // visualization is generated in this case so we shouldn't display style option panels.
  const hasMappingSelected = !isEmpty(axisColumnMappings);

  return (
    <EuiFlexGroup direction="column" gutterSize="none">
      <EuiFlexItem>
        <AxesSelectPanel
          numericalColumns={numericalColumns}
          categoricalColumns={categoricalColumns}
          dateColumns={dateColumns}
          currentMapping={axisColumnMappings}
          updateVisualization={updateVisualization}
          chartType="bar"
          onSwitchAxes={(v) => updateStyleOption('switchAxes', v)}
          switchAxes={styleOptions.switchAxes}
        />
      </EuiFlexItem>
      {hasMappingSelected && (
        <>
          <EuiFlexItem>
            <BucketOptionsPanel
              styles={styleOptions?.bucket}
              bucketType={bucketType}
              onChange={(bucket) => updateStyleOption('bucket', bucket)}
            />
          </EuiFlexItem>

          <EuiFlexItem grow={false}>
            <AllAxesOptions
              axisColumnMappings={axisColumnMappings}
              standardAxes={styleOptions.standardAxes}
              onStandardAxesChange={(standardAxes) =>
                updateStyleOption('standardAxes', standardAxes)
              }
              switchAxes={styleOptions.switchAxes}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <BarExclusiveVisOptions
              barSizeMode={styleOptions.barSizeMode}
              barWidth={styleOptions.barWidth}
              barPadding={styleOptions.barPadding}
              showBarBorder={styleOptions.showBarBorder}
              barBorderWidth={styleOptions.barBorderWidth}
              barBorderColor={styleOptions.barBorderColor}
              onBarSizeModeChange={(barSizeMode) => updateStyleOption('barSizeMode', barSizeMode)}
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
