/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { isEmpty } from 'lodash';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { ScatterChartStyleControls } from './scatter_vis_config';
import { AxisRole, StandardAxes } from '../types';
import { ScatterExclusiveVisOptions } from './scatter_exclusive_vis_options';
import { AllAxesOptions } from '../style_panel/axes/standard_axes_options';
import { swapAxes } from '../utils/utils';
import { StyleControlsProps } from '../utils/use_visualization_types';
import { LegendOptionsPanel } from '../style_panel/legend/legend';
import { TooltipOptionsPanel } from '../style_panel/tooltip/tooltip';
import { AxesSelectPanel } from '../style_panel/axes/axes_selector';
import { GridOptionsPanel } from '../style_panel/grid/grid';

export type ScatterVisStyleControlsProps = StyleControlsProps<ScatterChartStyleControls>;

export const ScatterVisStyleControls: React.FC<ScatterVisStyleControlsProps> = ({
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
  const updateStyleOption = <K extends keyof ScatterChartStyleControls>(
    key: K,
    value: ScatterChartStyleControls[K]
  ) => {
    onStyleChange({ [key]: value });
  };

  // if it is 2 metrics, then it should not show legend
  const shouldShowLegend = !(numericalColumns.length === 2 && categoricalColumns.length === 0);

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
    if (axisColumnMappings[AxisRole.X] && axisColumnMappings[AxisRole.Y]) {
      const updateAxes = swapAxes(axes);
      updateStyleOption('StandardAxes', updateAxes);
      updateVisualization({
        mappings: {
          ...axisColumnMappings,
          [AxisRole.Y]: axisColumnMappings[AxisRole.X],
          [AxisRole.X]: axisColumnMappings[AxisRole.Y],
        },
      });
    }
  };

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
          chartType="scatter"
        />
      </EuiFlexItem>
      {hasMappingSelected && (
        <>
          <EuiFlexItem grow={false}>
            <AllAxesOptions
              standardAxes={styleOptions.StandardAxes}
              onChangeSwitchAxes={handleSwitchAxes}
              onStandardAxesChange={(standardAxes) =>
                updateStyleOption('StandardAxes', standardAxes)
              }
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <ScatterExclusiveVisOptions
              styles={styleOptions.exclusive}
              onChange={(exclusive) => updateStyleOption('exclusive', exclusive)}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <GridOptionsPanel
              grid={styleOptions.grid}
              onGridChange={(gridOption) => updateStyleOption('grid', gridOption)}
            />
          </EuiFlexItem>
          {shouldShowLegend && (
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
          )}
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
