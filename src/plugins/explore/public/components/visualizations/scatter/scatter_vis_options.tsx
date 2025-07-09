/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { ScatterChartStyleControls } from './scatter_vis_config';
import { AxisRole, StandardAxes } from '../types';
import { ScatterExclusiveVisOptions } from './scatter_exclusive_vis_options';
import { AllAxesOptions } from '../style_panel/standard_axes_options';
import { swapAxes } from '../utils/utils';
import { inferAxesFromColumns } from './scatter_chart_utils';
import { StyleControlsProps } from '../utils/use_visualization_types';
import { LegendOptionsPanel } from '../style_panel/legend/legend';
import { TooltipOptionsPanel } from '../style_panel/tooltip/tooltip';

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
    const { x, y } = inferAxesFromColumns(numericalColumns, categoricalColumns);
    const axesWithFields = styleOptions.StandardAxes.map((axis) => {
      if (axis.axisRole === AxisRole.X) {
        return { ...axis, field: x };
      }
      if (axis.axisRole === AxisRole.Y) {
        return { ...axis, field: y };
      }
      return axis;
    });

    updateStyleOption('StandardAxes', axesWithFields);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numericalColumns, categoricalColumns, dateColumns]);

  const handleSwitchAxes = (axes: StandardAxes[]) => {
    const updateAxes = swapAxes(axes);
    updateStyleOption('StandardAxes', updateAxes);
  };

  return (
    <EuiFlexGroup direction="column" gutterSize="none">
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

      <EuiFlexItem grow={false}>
        <ScatterExclusiveVisOptions
          styles={styleOptions.exclusive}
          onChange={(exclusive) => updateStyleOption('exclusive', exclusive)}
        />
      </EuiFlexItem>

      <EuiFlexItem grow={false}>
        <AllAxesOptions
          disableGrid={false}
          standardAxes={styleOptions.StandardAxes}
          onChangeSwitchAxes={handleSwitchAxes}
          onStandardAxesChange={(standardAxes) => updateStyleOption('StandardAxes', standardAxes)}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
