/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { isEmpty } from 'lodash';
import { i18n } from '@osd/i18n';
import { EuiFlexGroup, EuiFlexItem, EuiFormRow, EuiSwitch, EuiSpacer } from '@elastic/eui';
import { GaugeChartStyle } from './gauge_vis_config';
import { AxisRole } from '../types';
import { ThresholdPanel } from '../style_panel/threshold/threshold_panel';
import { StyleControlsProps } from '../utils/use_visualization_types';
import { StyleAccordion } from '../style_panel/style_accordion';
import { AxesSelectPanel } from '../style_panel/axes/axes_selector';
import { DebouncedFieldText } from '../style_panel/utils';
import { ValueCalculationSelector } from '../style_panel/value/value_calculation_selector';
import { StandardOptionsPanel } from '../style_panel/standard_options/standard_options_panel';

export type GaugeVisStyleControlsProps = StyleControlsProps<GaugeChartStyle>;

export const GaugeVisStyleControls: React.FC<GaugeVisStyleControlsProps> = ({
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
  const updateStyleOption = <K extends keyof GaugeChartStyle>(
    key: K,
    value: GaugeChartStyle[K]
  ) => {
    onStyleChange({ [key]: value });
  };

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
          chartType="gauge"
        />
      </EuiFlexItem>
      {hasMappingSelected && (
        <>
          <EuiFlexItem grow={false}>
            {/* @ts-expect-error TS2322 TODO(ts-error): fixme */}
            <StyleAccordion
              id="gaugeSection"
              accordionLabel={i18n.translate('explore.stylePanel.gauge', {
                defaultMessage: 'Gauge',
              })}
              initialIsOpen={true}
            >
              <EuiFormRow>
                <EuiSwitch
                  compressed
                  label={i18n.translate('explore.vis.gauge.useThresholdColor', {
                    defaultMessage: 'Use threshold colors',
                  })}
                  data-test-subj="useThresholdColorButton"
                  checked={styleOptions?.useThresholdColor ?? false}
                  onChange={(e) => updateStyleOption('useThresholdColor', e.target.checked)}
                />
              </EuiFormRow>

              <EuiSpacer size="s" />

              <EuiFormRow>
                <EuiSwitch
                  compressed
                  label={i18n.translate('explore.stylePanel.gauge.title', {
                    defaultMessage: 'Show title',
                  })}
                  checked={styleOptions.showTitle}
                  onChange={(e) => updateStyleOption('showTitle', e.target.checked)}
                  data-test-subj="showTitleSwitch"
                />
              </EuiFormRow>
              {styleOptions.showTitle && (
                <EuiFormRow>
                  <DebouncedFieldText
                    value={styleOptions.title || axisColumnMappings[AxisRole.Value]?.name || ''}
                    placeholder={i18n.translate('explore.vis.gauge.title', {
                      defaultMessage: 'Title',
                    })}
                    onChange={(text) => updateStyleOption('title', text)}
                  />
                </EuiFormRow>
              )}
            </StyleAccordion>
          </EuiFlexItem>

          <EuiFlexItem>
            {/* @ts-expect-error TS2322 TODO(ts-error): fixme */}
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
        </>
      )}
    </EuiFlexGroup>
  );
};
