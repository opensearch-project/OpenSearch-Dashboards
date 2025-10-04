/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { isEmpty } from 'lodash';
import { EuiFlexItem, EuiFlexGroup } from '@elastic/eui';
import { PieChartStyle, PieChartStyleOptions } from './pie_vis_config';
import { PieExclusiveVisOptions } from './pie_exclusive_vis_options';
import { StyleControlsProps } from '../utils/use_visualization_types';
import { TooltipOptionsPanel } from '../style_panel/tooltip/tooltip';
import { LegendOptionsPanel } from '../style_panel/legend/legend';
import { AxesSelectPanel } from '../style_panel/axes/axes_selector';
import { TitleOptionsPanel } from '../style_panel/title/title';

export type PieVisStyleControlsProps = StyleControlsProps<PieChartStyle>;

export const PieVisStyleControls: React.FC<PieVisStyleControlsProps> = ({
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
  const updateStyleOption = <K extends keyof PieChartStyleOptions>(
    key: K,
    value: PieChartStyleOptions[K]
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
          chartType="pie"
        />
      </EuiFlexItem>
      {hasMappingSelected && (
        <>
          <EuiFlexItem grow={false}>
            <PieExclusiveVisOptions
              styles={styleOptions.exclusive}
              onChange={(exclusive) => updateStyleOption('exclusive', exclusive)}
            />
          </EuiFlexItem>
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
                if (legendOptions.title !== undefined) {
                  updateStyleOption('legendTitle', legendOptions.title);
                }
              }}
            />
          </EuiFlexItem>
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
