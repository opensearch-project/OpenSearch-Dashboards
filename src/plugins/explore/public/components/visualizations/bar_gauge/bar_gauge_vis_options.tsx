/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { isEmpty } from 'lodash';
import { i18n } from '@osd/i18n';
import { EuiFlexGroup, EuiFlexItem, EuiFormRow } from '@elastic/eui';
import { BarGaugeChartStyle, BarGaugeChartStyleOptions } from './bar_gauge_vis_config';
import { StyleControlsProps } from '../utils/use_visualization_types';
import { AxesSelectPanel } from '../style_panel/axes/axes_selector';
import { TitleOptionsPanel } from '../style_panel/title/title';
import { ThresholdPanel } from '../style_panel/threshold/threshold_panel';
import { TooltipOptionsPanel } from '../style_panel/tooltip/tooltip';
import { BarGaugeExclusiveVisOptions } from './bar_gauge_exclusive_vis_options';
import { ValueCalculationSelector } from '../style_panel/value/value_calculation_selector';
import { StyleAccordion } from '../style_panel/style_accordion';
import { StandardOptionsPanel } from '../style_panel/standard_options/standard_options_panel';
import { AxisRole, VisFieldType } from '../types';

export type BarGaugeVisStyleControlsProps = StyleControlsProps<BarGaugeChartStyle>;

export const BarGaugeVisStyleControls: React.FC<BarGaugeVisStyleControlsProps> = ({
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
  const updateStyleOption = <K extends keyof BarGaugeChartStyleOptions>(
    key: K,
    value: BarGaugeChartStyleOptions[K]
  ) => {
    onStyleChange({ [key]: value });
  };

  const hasMappingSelected = !isEmpty(axisColumnMappings);
  const isXaxisNumerical = axisColumnMappings[AxisRole.X]?.schema === VisFieldType.Numerical;

  return (
    <EuiFlexGroup direction="column" gutterSize="none">
      <EuiFlexItem>
        <AxesSelectPanel
          numericalColumns={numericalColumns}
          categoricalColumns={categoricalColumns}
          dateColumns={dateColumns}
          currentMapping={axisColumnMappings}
          updateVisualization={updateVisualization}
          chartType="bar_gauge"
        />
      </EuiFlexItem>
      {hasMappingSelected && (
        <>
          <EuiFlexItem>
            <StyleAccordion
              id="gaugeValueOptions"
              accordionLabel={i18n.translate('explore.stylePanel.gaugeValueOptions', {
                defaultMessage: 'Value options',
              })}
              initialIsOpen={false}
            >
              <EuiFormRow
                label={i18n.translate('explore.vis.gauge.calculation', {
                  defaultMessage: 'Calculation',
                })}
              >
                <ValueCalculationSelector
                  selectedValue={styleOptions.valueCalculation}
                  onChange={(value) => updateStyleOption('valueCalculation', value)}
                />
              </EuiFormRow>
            </StyleAccordion>
          </EuiFlexItem>

          <EuiFlexItem>
            <ThresholdPanel
              thresholdsOptions={styleOptions.thresholdOptions}
              onChange={(options) => updateStyleOption('thresholdOptions', options)}
              showThresholdStyle={false}
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <StandardOptionsPanel
              min={styleOptions.min}
              max={styleOptions.max}
              onMinChange={(value) => updateStyleOption('min', value)}
              onMaxChange={(value) => updateStyleOption('max', value)}
              unit={styleOptions.unitId}
              onUnitChange={(value) => updateStyleOption('unitId', value)}
            />
          </EuiFlexItem>

          <EuiFlexItem>
            <BarGaugeExclusiveVisOptions
              styles={styleOptions.exclusive}
              onChange={(options) => updateStyleOption('exclusive', options)}
              isXaxisNumerical={isXaxisNumerical}
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
