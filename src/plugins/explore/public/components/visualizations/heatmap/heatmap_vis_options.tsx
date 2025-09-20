/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { isEmpty } from 'lodash';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { HeatmapChartStyleControls } from './heatmap_vis_config';
import { TooltipOptionsPanel } from '../style_panel/tooltip/tooltip';
import { LegendOptionsPanel } from '../style_panel/legend/legend';
import { HeatmapExclusiveVisOptions } from './heatmap_exclusive_vis_options';
import { AllAxesOptions } from '../style_panel/axes/standard_axes_options';
import { StyleControlsProps } from '../utils/use_visualization_types';
import { AxesSelectPanel } from '../style_panel/axes/axes_selector';
import { TitleOptionsPanel } from '../style_panel/title/title';
import { AxisRole } from '../types';

export type HeatmapVisStyleControlsProps = StyleControlsProps<HeatmapChartStyleControls>;

export const HeatmapVisStyleControls: React.FC<HeatmapVisStyleControlsProps> = ({
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
  const shouldShowTypeAndGrid = numericalColumns.length === 3;
  const updateStyleOption = <K extends keyof HeatmapChartStyleControls>(
    key: K,
    value: HeatmapChartStyleControls[K]
  ) => {
    onStyleChange({ [key]: value });
  };

  // Determine if the legend should be shown based on the registration of a COLOR field
  const shouldShowLegend = !!axisColumnMappings?.[AxisRole.COLOR];

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
          chartType="heatmap"
          onSwitchAxes={(v) => updateStyleOption('switchAxes', v)}
          switchAxes={styleOptions.switchAxes}
        />
      </EuiFlexItem>
      {hasMappingSelected && (
        <>
          <EuiFlexItem grow={false}>
            <AllAxesOptions
              axisColumnMappings={axisColumnMappings}
              disableGrid={!shouldShowTypeAndGrid}
              standardAxes={styleOptions.standardAxes}
              onStandardAxesChange={(standardAxes) =>
                updateStyleOption('standardAxes', standardAxes)
              }
              switchAxes={styleOptions.switchAxes}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <HeatmapExclusiveVisOptions
              shouldShowType={shouldShowTypeAndGrid}
              styles={styleOptions.exclusive}
              onChange={(exclusive) => updateStyleOption('exclusive', exclusive)}
            />
          </EuiFlexItem>

          {shouldShowLegend && (
            <EuiFlexItem grow={false}>
              <LegendOptionsPanel
                legendOptions={styleOptions?.legends}
                onLegendOptionsChange={(index, changed) => {
                  const updated = [...styleOptions.legends];
                  updated[index] = {
                    ...styleOptions.legends[index],
                    ...changed,
                  };
                  updateStyleOption('legends', updated);
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
