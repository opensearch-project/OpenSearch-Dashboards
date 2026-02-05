/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { isEmpty } from 'lodash';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { ScatterChartStyle, ScatterChartStyleOptions } from './scatter_vis_config';
import { ScatterExclusiveVisOptions } from './scatter_exclusive_vis_options';
import { AllAxesOptions } from '../style_panel/axes/standard_axes_options';
import { StyleControlsProps } from '../utils/use_visualization_types';
// @ts-expect-error TS6133 TODO(ts-error): fixme
import { LegendOptionsPanel } from '../style_panel/legend/legend';
import { LegendOptionsWrapper } from '../style_panel/legend/legend_options_wrapper';
import { TooltipOptionsPanel } from '../style_panel/tooltip/tooltip';
import { AxesSelectPanel } from '../style_panel/axes/axes_selector';
import { TitleOptionsPanel } from '../style_panel/title/title';
import { AxisRole } from '../types';
import { ThresholdPanel } from '../style_panel/threshold/threshold_panel';

export type ScatterVisStyleControlsProps = StyleControlsProps<ScatterChartStyle>;

export const ScatterVisStyleControls: React.FC<ScatterVisStyleControlsProps> = ({
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
  const updateStyleOption = <K extends keyof ScatterChartStyleOptions>(
    key: K,
    value: ScatterChartStyleOptions[K]
  ) => {
    onStyleChange({ [key]: value });
  };

  // The mapping object will be an empty object if no fields are selected on the axes selector. No
  // visualization is generated in this case so we shouldn't display style option panels.
  const hasMappingSelected = !isEmpty(axisColumnMappings);
  const hasColorMapping = !!axisColumnMappings?.[AxisRole.COLOR];
  const hasSizeMapping = !!axisColumnMappings?.[AxisRole.SIZE];

  return (
    <EuiFlexGroup direction="column" gutterSize="none">
      <EuiFlexItem>
        <AxesSelectPanel
          numericalColumns={numericalColumns}
          categoricalColumns={categoricalColumns}
          dateColumns={dateColumns}
          currentMapping={axisColumnMappings}
          updateVisualization={updateVisualization}
          onSwitchAxes={(v: boolean) => updateStyleOption('switchAxes', v)}
          switchAxes={styleOptions.switchAxes}
          chartType="scatter"
        />
      </EuiFlexItem>
      {hasMappingSelected && (
        <>
          <EuiFlexItem grow={false}>
            <ScatterExclusiveVisOptions
              styles={styleOptions.exclusive}
              useThresholdColor={styleOptions?.useThresholdColor}
              onChange={(exclusive) => updateStyleOption('exclusive', exclusive)}
              onUseThresholdColorChange={(useThresholdColor) =>
                updateStyleOption('useThresholdColor', useThresholdColor)
              }
              shouldDisableUseThresholdColor={hasColorMapping}
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <ThresholdPanel
              thresholdsOptions={styleOptions.thresholdOptions}
              onChange={(options) => updateStyleOption('thresholdOptions', options)}
              showThresholdStyle={true}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <AllAxesOptions
              switchAxes={styleOptions.switchAxes}
              axisColumnMappings={axisColumnMappings}
              standardAxes={styleOptions.standardAxes}
              onStandardAxesChange={(standardAxes) =>
                updateStyleOption('standardAxes', standardAxes)
              }
            />
          </EuiFlexItem>

          <LegendOptionsWrapper
            styleOptions={styleOptions}
            updateStyleOption={updateStyleOption}
            shouldShow={hasColorMapping}
            hasSizeLegend={hasSizeMapping}
          />

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
