/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { HeatmapChartStyleControls } from './heatmap_vis_config';
import { StandardAxes, AxisRole } from '../types';
import { TooltipOptionsPanel } from '../style_panel/tooltip/tooltip';
import { LegendOptionsPanel } from '../style_panel/legend/legend';
import {
  HeatmapLabelVisOptions,
  HeatmapExclusiveVisOptions,
} from './heatmap_exclusive_vis_options';
import { AllAxesOptions } from '../style_panel/standard_axes_options';
import { swapAxes } from '../utils/utils';
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
  const shouldShowType = numericalColumns.length === 3;
  const updateStyleOption = <K extends keyof HeatmapChartStyleControls>(
    key: K,
    value: HeatmapChartStyleControls[K]
  ) => {
    onStyleChange({ [key]: value });
  };

  useEffect(() => {
    const axesWithFields = styleOptions.StandardAxes.map((axis) => {
      if (axis.axisRole === AxisRole.X) {
        return {
          ...axis,
          field: {
            default: axisColumnMappings?.[AxisRole.X]!,
            options: [axisColumnMappings?.[AxisRole.X]!],
          },
        };
      }
      if (axis.axisRole === AxisRole.Y) {
        return {
          ...axis,
          field: {
            default: axisColumnMappings?.[AxisRole.Y]!,
            options: [axisColumnMappings?.[AxisRole.Y]!],
          },
        };
      }
      return axis;
    });

    updateStyleOption('StandardAxes', axesWithFields);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numericalColumns, categoricalColumns, dateColumns, axisColumnMappings]);

  const handleSwitchAxes = (axes: StandardAxes[]) => {
    const updateAxes = swapAxes(axes);
    updateStyleOption('StandardAxes', updateAxes);
    updateVisualization({
      mappings: {
        ...axisColumnMappings,
        [AxisRole.Y]: axisColumnMappings[AxisRole.X],
        [AxisRole.X]: axisColumnMappings[AxisRole.Y],
      },
    });
  };

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
      <EuiFlexItem grow={false}>
        <HeatmapExclusiveVisOptions
          styles={styleOptions.exclusive}
          onChange={(exclusive) => updateStyleOption('exclusive', exclusive)}
        />
      </EuiFlexItem>

      <EuiFlexItem grow={false}>
        <HeatmapLabelVisOptions
          shouldShowType={shouldShowType}
          styles={styleOptions.label}
          onChange={(label) => updateStyleOption('label', label)}
        />
      </EuiFlexItem>

      <EuiFlexItem grow={false}>
        <AllAxesOptions
          disableGrid={true}
          standardAxes={styleOptions.StandardAxes}
          onChangeSwitchAxes={handleSwitchAxes}
          onStandardAxesChange={(standardAxes) => updateStyleOption('StandardAxes', standardAxes)}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
