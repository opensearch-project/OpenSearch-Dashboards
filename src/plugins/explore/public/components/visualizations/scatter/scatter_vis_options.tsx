/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { isEmpty } from 'lodash';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { ScatterChartStyleControls } from './scatter_vis_config';
import { ScatterExclusiveVisOptions } from './scatter_exclusive_vis_options';
import { AllAxesOptions } from '../style_panel/axes/standard_axes_options';
import { StyleControlsProps } from '../utils/use_visualization_types';
import { LegendOptions, LegendOptionsPanel } from '../style_panel/legend/legend';
import { TooltipOptionsPanel } from '../style_panel/tooltip/tooltip';
import { AxesSelectPanel } from '../style_panel/axes/axes_selector';
import { TitleOptionsPanel } from '../style_panel/title/title';
import { AxisRole } from '../types';

export type ScatterVisStyleControlsProps = StyleControlsProps<ScatterChartStyleControls>;

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
  const updateStyleOption = <K extends keyof ScatterChartStyleControls>(
    key: K,
    value: ScatterChartStyleControls[K]
  ) => {
    onStyleChange({ [key]: value });
  };

  // Determine if the legend should be shown based on the registration of a COLOR or FACET field
  const hasColorMapping = !!axisColumnMappings?.[AxisRole.COLOR];
  const hasFacetMapping = !!axisColumnMappings?.[AxisRole.FACET];
  const hasSizeMapping = !!axisColumnMappings?.[AxisRole.SIZE];
  const shouldShowLegend = hasColorMapping || hasFacetMapping;

  // The mapping object will be an empty object if no fields are selected on the axes selector. No
  // visualization is generated in this case so we shouldn't display style option panels.
  const hasMappingSelected = !isEmpty(axisColumnMappings);

  const filteredLegendOptions = styleOptions.legends.filter((legend) => {
    if (legend.role === 'color' && hasColorMapping) return true;
    if (legend.role === 'size' && hasSizeMapping) return true;
    return false;
  });

  const handleLegendOptionsChange = (index: number, changed: Partial<LegendOptions>) => {
    const updated = [...styleOptions.legends];
    if ('show' in changed || 'position' in changed) {
      updated.forEach((legend, i) => {
        updated[i] = {
          ...legend,
          ...(changed.show !== undefined && { show: changed.show }),
          ...(changed.position !== undefined && { position: changed.position }),
        };
      });
    } else {
      const actualIndex = styleOptions.legends.findIndex(
        (legend) => legend.role === filteredLegendOptions[index].role
      );
      updated[actualIndex] = { ...updated[actualIndex], ...changed };
    }
    updateStyleOption('legends', updated);
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
          onSwitchAxes={(v: boolean) => updateStyleOption('switchAxes', v)}
          switchAxes={styleOptions.switchAxes}
          chartType="scatter"
        />
      </EuiFlexItem>
      {hasMappingSelected && (
        <>
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
          <EuiFlexItem grow={false}>
            <ScatterExclusiveVisOptions
              styles={styleOptions.exclusive}
              onChange={(exclusive) => updateStyleOption('exclusive', exclusive)}
            />
          </EuiFlexItem>
          {shouldShowLegend && (
            <EuiFlexItem grow={false}>
              <LegendOptionsPanel
                legendOptions={filteredLegendOptions}
                onLegendOptionsChange={handleLegendOptionsChange}
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
