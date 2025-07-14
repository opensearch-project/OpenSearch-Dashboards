/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { ScatterChartStyleControls } from './scatter_vis_config';
import { AxisRole, AxisStyleStoredInMapping } from '../types';
import { ScatterExclusiveVisOptions } from './scatter_exclusive_vis_options';
import { AllAxesOptions } from '../style_panel/axes/standard_axes_options';
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

  const handleAxisStyleChange = (
    role: AxisRole,
    updatedStyles: Partial<AxisStyleStoredInMapping>
  ) => {
    const updatedMapping = {
      ...axisColumnMappings,
      [role]: {
        ...axisColumnMappings[role],
        styles: {
          ...axisColumnMappings[role]?.styles,
          ...updatedStyles,
        },
      },
    };
    updateVisualization({ mappings: updatedMapping });
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
          chartType="scatter"
        />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <AllAxesOptions
          axisColumnMappings={axisColumnMappings}
          onChangeAxisStyle={handleAxisStyleChange}
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

      <EuiFlexItem grow={false}>
        <ScatterExclusiveVisOptions
          styles={styleOptions.exclusive}
          onChange={(exclusive) => updateStyleOption('exclusive', exclusive)}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
