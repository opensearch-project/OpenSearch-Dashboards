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
import {
  HeatmapLabelVisOptions,
  HeatmapExclusiveVisOptions,
} from './heatmap_exclusive_vis_options';
import { AllAxesOptions } from '../style_panel/axes/standard_axes_options';
import { StyleControlsProps } from '../utils/use_visualization_types';
import { AxesSelectPanel } from '../style_panel/axes/axes_selector';

export type HeatmapVisStyleControlsProps = StyleControlsProps<HeatmapChartStyleControls>;

export const HeatmapVisStyleControls: React.FC<HeatmapVisStyleControlsProps> = ({
  styleOptions,
  onStyleChange,
  numericalColumns = [],
  categoricalColumns = [],
  dateColumns = [],
  availableChartTypes = [],
  selectedChartType,
  onChartTypeChange,
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
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <HeatmapExclusiveVisOptions
              shouldShowType={shouldShowTypeAndGrid}
              styles={styleOptions.exclusive}
              onChange={(exclusive) => updateStyleOption('exclusive', exclusive)}
            />
          </EuiFlexItem>
          {/* <EuiFlexItem grow={false}>
            <HeatmapLabelVisOptions
              shouldShowType={shouldShowTypeAndGrid}
              styles={styleOptions.label}
              onChange={(label) => updateStyleOption('label', label)}
            />
          </EuiFlexItem> */}
          <EuiFlexItem grow={false}>
            <LegendOptionsPanel
              shouldShowLegend={true}
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
        </>
      )}
    </EuiFlexGroup>
  );
};
