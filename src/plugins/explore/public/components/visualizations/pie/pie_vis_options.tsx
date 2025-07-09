/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiFlexItem, EuiFlexGroup } from '@elastic/eui';
import { PieChartStyleControls } from './pie_vis_config';
import { PieExclusiveVisOptions } from './pie_exclusive_vis_options';
import { StyleControlsProps } from '../utils/use_visualization_types';
import { TooltipOptionsPanel } from '../style_panel/tooltip/tooltip';
import { LegendOptionsPanel } from '../style_panel/legend/legend';
import { AxesSelectPanel } from '../style_panel/axes/axes_selector';

export type PieVisStyleControlsProps = StyleControlsProps<PieChartStyleControls>;

export const PieVisStyleControls: React.FC<PieVisStyleControlsProps> = ({
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
  const updateStyleOption = <K extends keyof PieChartStyleControls>(
    key: K,
    value: PieChartStyleControls[K]
  ) => {
    onStyleChange({ [key]: value });
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
          chartType="pie"
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
        <PieExclusiveVisOptions
          styles={styleOptions.exclusive}
          onChange={(exclusive) => updateStyleOption('exclusive', exclusive)}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
