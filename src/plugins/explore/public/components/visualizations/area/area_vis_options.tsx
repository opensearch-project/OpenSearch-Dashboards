/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { isEmpty } from 'lodash';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { AreaChartStyleControls } from './area_vis_config';
import { StyleControlsProps } from '../utils/use_visualization_types';
import { LegendOptionsPanel } from '../style_panel/legend/legend';
import { ThresholdOptions } from '../style_panel/threshold_lines/threshold';
import { TooltipOptionsPanel } from '../style_panel/tooltip/tooltip';
import { AxesOptions } from '../style_panel/axes/axes';
import { AxesSelectPanel } from '../style_panel/axes/axes_selector';
import { TitleOptionsPanel } from '../style_panel/title/title';
import { AxisRole } from '../types';

export type AreaVisStyleControlsProps = StyleControlsProps<AreaChartStyleControls>;

export const AreaVisStyleControls: React.FC<AreaVisStyleControlsProps> = ({
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
  const updateStyleOption = <K extends keyof AreaChartStyleControls>(
    key: K,
    value: AreaChartStyleControls[K]
  ) => {
    onStyleChange({ [key]: value });
  };

  // Determine if the legend should be shown based on the registration of a COLOR or FACET field
  const hasColorMapping = !!axisColumnMappings?.[AxisRole.COLOR];
  const hasFacetMapping = !!axisColumnMappings?.[AxisRole.FACET];
  const shouldShowLegend = hasColorMapping || hasFacetMapping;

  // The mapping object will be an empty object if no fields are selected on the axes selector. No
  // visualization is generated in this case so we shouldn't display style option panels.
  const hasMappingSelected = !isEmpty(axisColumnMappings);

  return (
    <EuiFlexGroup direction="column" gutterSize="none">
      <EuiFlexItem grow={false}>
        <AxesSelectPanel
          numericalColumns={numericalColumns}
          categoricalColumns={categoricalColumns}
          dateColumns={dateColumns}
          currentMapping={axisColumnMappings}
          updateVisualization={updateVisualization}
          chartType="area"
        />
      </EuiFlexItem>

      {hasMappingSelected && (
        <>
          <EuiFlexItem grow={false}>
            <AxesOptions
              categoryAxes={styleOptions.categoryAxes}
              valueAxes={styleOptions.valueAxes}
              onCategoryAxesChange={(categoryAxes) =>
                updateStyleOption('categoryAxes', categoryAxes)
              }
              onValueAxesChange={(valueAxes) => updateStyleOption('valueAxes', valueAxes)}
              numericalColumns={numericalColumns}
              categoricalColumns={categoricalColumns}
              dateColumns={dateColumns}
              axisColumnMappings={axisColumnMappings}
            />
          </EuiFlexItem>

          <EuiFlexItem grow={false}>
            <ThresholdOptions
              thresholdLines={styleOptions.thresholdLines}
              onThresholdLinesChange={(thresholdLines) =>
                updateStyleOption('thresholdLines', thresholdLines)
              }
            />
          </EuiFlexItem>

          {shouldShowLegend && (
            <EuiFlexItem grow={false}>
              <LegendOptionsPanel
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
