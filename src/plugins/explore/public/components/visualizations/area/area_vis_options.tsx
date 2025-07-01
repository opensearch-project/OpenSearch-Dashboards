/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { AreaChartStyleControls } from './area_vis_config';
import { StyleControlsProps } from '../utils/use_visualization_types';
import { LegendOptionsPanel } from '../style_panel/legend/legend';
import { ThresholdOptions } from '../style_panel/threshold/threshold';
import { TooltipOptionsPanel } from '../style_panel/tooltip/tooltip';
import { AxesOptions } from '../style_panel/axes/axes';
import { GridOptionsPanel } from '../style_panel/grid/grid';

export type AreaVisStyleControlsProps = StyleControlsProps<AreaChartStyleControls>;

export const AreaVisStyleControls: React.FC<AreaVisStyleControlsProps> = ({
  styleOptions,
  onStyleChange,
  numericalColumns = [],
  categoricalColumns = [],
  dateColumns = [],
  availableChartTypes = [],
  selectedChartType,
  onChartTypeChange,
}) => {
  const updateStyleOption = <K extends keyof AreaChartStyleControls>(
    key: K,
    value: AreaChartStyleControls[K]
  ) => {
    onStyleChange({ [key]: value });
  };

  const notShowLegend =
    (numericalColumns.length === 1 &&
      categoricalColumns.length === 0 &&
      dateColumns.length === 1) ||
    (numericalColumns.length === 1 && categoricalColumns.length === 1 && dateColumns.length === 0);

  return (
    <EuiFlexGroup direction="column" gutterSize="none">
      <EuiFlexItem grow={false}>
        <LegendOptionsPanel
          shouldShowLegend={!notShowLegend}
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
        <ThresholdOptions
          thresholdLines={styleOptions.thresholdLines}
          onThresholdLinesChange={(thresholdLines) =>
            updateStyleOption('thresholdLines', thresholdLines)
          }
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
        <AxesOptions
          categoryAxes={styleOptions.categoryAxes}
          valueAxes={styleOptions.valueAxes}
          onCategoryAxesChange={(categoryAxes) => updateStyleOption('categoryAxes', categoryAxes)}
          onValueAxesChange={(valueAxes) => updateStyleOption('valueAxes', valueAxes)}
          numericalColumns={numericalColumns}
          categoricalColumns={categoricalColumns}
          dateColumns={dateColumns}
        />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <GridOptionsPanel
          grid={styleOptions.grid}
          onGridChange={(grid) => updateStyleOption('grid', grid)}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
