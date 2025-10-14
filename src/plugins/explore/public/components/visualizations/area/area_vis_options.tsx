/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { isEmpty } from 'lodash';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { AreaChartStyle, AreaChartStyleOptions } from './area_vis_config';
import { StyleControlsProps } from '../utils/use_visualization_types';
import { LegendOptionsWrapper } from '../style_panel/legend/legend_options_wrapper';
import { TooltipOptionsPanel } from '../style_panel/tooltip/tooltip';
import { AxesOptions } from '../style_panel/axes/axes';
import { AxesSelectPanel } from '../style_panel/axes/axes_selector';
import { TitleOptionsPanel } from '../style_panel/title/title';
import { AxisRole } from '../types';
import { ThresholdPanel } from '../style_panel/threshold/threshold_panel';

export type AreaVisStyleControlsProps = StyleControlsProps<AreaChartStyle>;

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
  const updateStyleOption = <K extends keyof AreaChartStyleOptions>(
    key: K,
    value: AreaChartStyleOptions[K]
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
          <EuiFlexItem>
            <ThresholdPanel
              thresholdsOptions={styleOptions.thresholdOptions}
              onChange={(options) => updateStyleOption('thresholdOptions', options)}
              showThresholdStyle={true}
            />
          </EuiFlexItem>
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

          <LegendOptionsWrapper
            styleOptions={styleOptions}
            updateStyleOption={updateStyleOption}
            shouldShow={shouldShowLegend}
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
