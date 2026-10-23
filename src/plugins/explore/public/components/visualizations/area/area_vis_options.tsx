/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { isEmpty } from 'lodash';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { AreaChartStyle, AreaChartStyleOptions } from './area_vis_config';
import { StyleControlsProps } from '../utils/use_visualization_types';
import { LegendOptionsWrapper } from '../style_panel/legend/legend_options_wrapper';
import { TooltipOptionsPanel } from '../style_panel/tooltip/tooltip';
import { AxisRole, VisFieldType } from '../types';
import { ThresholdPanel } from '../style_panel/threshold/threshold_panel';
import { AllAxesOptions } from '../style_panel/axes/standard_axes_options';
import { AreaExclusiveVisOptions } from './area_exclusive_vis_options';
import { StandardOptionsPanel } from '../style_panel/standard_options/standard_options_panel';

export type AreaVisStyleControlsProps = StyleControlsProps<AreaChartStyle>;

export const AreaVisStyleControls: React.FC<AreaVisStyleControlsProps> = ({
  styleOptions,
  onStyleChange,
  numericalColumns = [],
  categoricalColumns = [],
  dateColumns = [],
  axisColumnMappings,
  updateVisualization,
}) => {
  const updateStyleOption = <K extends keyof AreaChartStyleOptions>(
    key: K,
    value: AreaChartStyleOptions[K]
  ) => {
    onStyleChange({ [key]: value });
  };

  const hasColorMapping =
    !!axisColumnMappings?.[AxisRole.COLOR] && axisColumnMappings?.[AxisRole.COLOR].length > 0;
  const shouldShowLegend = hasColorMapping;

  // The mapping object will be an empty object if no fields are selected on the axes selector. No
  // visualization is generated in this case so we shouldn't display style option panels.
  const hasMappingSelected = !isEmpty(axisColumnMappings);
  const shouldShowTimeMarker = axisColumnMappings?.[AxisRole.X]?.[0]?.schema === VisFieldType.Date;

  return (
    <EuiFlexGroup direction="column" gutterSize="none">
      {hasMappingSelected && (
        <>
          <EuiFlexItem grow={false}>
            <AreaExclusiveVisOptions
              isTimeBased={shouldShowTimeMarker}
              addTimeMarker={styleOptions.addTimeMarker}
              areaOpacity={styleOptions.areaOpacity}
              gradientMode={styleOptions.gradientMode}
              stackMode={styleOptions.stackMode}
              lineDashStyle={styleOptions.lineDashStyle}
              lineMode={styleOptions.lineMode}
              lineWidth={styleOptions.lineWidth}
              pointSize={styleOptions.pointSize}
              showValues={styleOptions.showValues}
              connectNullValues={styleOptions.connectNullValues}
              disconnectValues={styleOptions.disconnectValues}
              lineStyle={styleOptions.lineStyle}
              onAddTimeMarkerChange={(addTimeMarker) =>
                updateStyleOption('addTimeMarker', addTimeMarker)
              }
              onFillOpacityChange={(areaOpacity) => updateStyleOption('areaOpacity', areaOpacity)}
              onGradientModeChange={(gradientMode) =>
                updateStyleOption('gradientMode', gradientMode)
              }
              onStackModeChange={(stackMode) => updateStyleOption('stackMode', stackMode)}
              onLineDashStyleChange={(lineDashStyle) =>
                updateStyleOption('lineDashStyle', lineDashStyle)
              }
              onLineModeChange={(lineMode) => updateStyleOption('lineMode', lineMode)}
              onLineWidthChange={(lineWidth) => updateStyleOption('lineWidth', lineWidth)}
              onPointSizeChange={(pointSize) => updateStyleOption('pointSize', pointSize)}
              onShowValuesChange={(showValues) => updateStyleOption('showValues', showValues)}
              onLineStyleChange={(lineStyle) => updateStyleOption('lineStyle', lineStyle)}
              onConnectNullValuesChange={(connectNullValues) =>
                updateStyleOption('connectNullValues', connectNullValues)
              }
              onDisconnectValuesChange={(disconnectValues) =>
                updateStyleOption('disconnectValues', disconnectValues)
              }
            />
          </EuiFlexItem>

          <EuiFlexItem>
            <ThresholdPanel
              thresholdsOptions={styleOptions.thresholdOptions}
              onChange={(options) => updateStyleOption('thresholdOptions', options)}
              showThresholdStyle={true}
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <StandardOptionsPanel
              min={styleOptions.min}
              max={styleOptions.max}
              onMinChange={(value) => updateStyleOption('min', value)}
              onMaxChange={(value) => updateStyleOption('max', value)}
              unit={styleOptions.unitId}
              onUnitChange={(value) => updateStyleOption('unitId', value)}
              decimals={styleOptions.decimals}
              onDecimalsChange={(value) => updateStyleOption('decimals', value)}
              unitSuffix={styleOptions.unitSuffix}
              onUnitSuffixChange={(value) => updateStyleOption('unitSuffix', value)}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <AllAxesOptions
              axisColumnMappings={axisColumnMappings}
              standardAxes={styleOptions.standardAxes}
              onStandardAxesChange={(standardAxes) =>
                updateStyleOption('standardAxes', standardAxes)
              }
              showFullTimeRange={styleOptions.showFullTimeRange}
              onShowFullTimeRangeChange={(showFullTimeRange) =>
                updateStyleOption('showFullTimeRange', showFullTimeRange)
              }
            />
          </EuiFlexItem>

          <LegendOptionsWrapper
            styleOptions={styleOptions}
            updateStyleOption={updateStyleOption}
            shouldShow={shouldShowLegend}
          />

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
