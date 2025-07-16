/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { isEmpty } from 'lodash';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { ScatterChartStyleControls } from './scatter_vis_config';
import { ScatterExclusiveVisOptions } from './scatter_exclusive_vis_options';
import { AllAxesOptions } from '../style_panel/axes/standard_axes_options';
import { StyleControlsProps } from '../utils/use_visualization_types';
import { LegendOptionsPanel } from '../style_panel/legend/legend';
import { TooltipOptionsPanel } from '../style_panel/tooltip/tooltip';
import { AxesSelectPanel } from '../style_panel/axes/axes_selector';

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
          chartType="scatter"
        />
      </EuiFlexItem>
      {hasMappingSelected && (
        <>
          <EuiFlexItem grow={false}>
            <AllAxesOptions
              axisColumnMappings={axisColumnMappings}
              standardAxes={styleOptions.StandardAxes}
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
