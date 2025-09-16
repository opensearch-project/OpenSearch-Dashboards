/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { isEmpty } from 'lodash';
import { i18n } from '@osd/i18n';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiSwitch,
  EuiSplitPanel,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { GaugeChartStyleControls } from './gauge_vis_config';
import { Threshold, AxisRole } from '../types';
import { ThresholdPanel } from '../style_panel/threshold/threshold_panel';
import { StyleControlsProps } from '../utils/use_visualization_types';
import { StyleAccordion } from '../style_panel/style_accordion';
import { AxesSelectPanel } from '../style_panel/axes/axes_selector';
import { DebouncedFieldText } from '../style_panel/utils';
import { ValueCalculationSelector } from '../style_panel/value/value_calculation_selector';
import { UnitPanel } from '../style_panel/unit/unit_panel';

export type GaugeVisStyleControlsProps = StyleControlsProps<GaugeChartStyleControls>;

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
  const updateStyleOption = <K extends keyof GaugeChartStyleControls>(
    key: K,
    value: GaugeChartStyleControls[K]
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
            <UnitPanel
              unit={styleOptions.unitId}
              onUnitChange={(value) => updateStyleOption('unitId', value)}
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <ThresholdPanel
              thresholds={styleOptions.thresholds}
              baseColor={styleOptions.baseColor}
              min={styleOptions.min}
              max={styleOptions.max}
              onThresholdValuesChange={(ranges: Threshold[]) => {
                updateStyleOption('thresholds', ranges);
              }}
              onBaseColorChange={(color: string) => updateStyleOption('baseColor', color)}
              onMinChange={(value) => updateStyleOption('min', value)}
              onMaxChange={(value) => updateStyleOption('max', value)}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <StyleAccordion
              id="gaugeSection"
              accordionLabel={i18n.translate('explore.stylePanel.gauge', {
                defaultMessage: 'Gauge',
              })}
              initialIsOpen={true}
            >
              <EuiSplitPanel.Inner paddingSize="s" color="subdued">
                <EuiText size="s" style={{ fontWeight: 600 }}>
                  {i18n.translate('explore.stylePanel.gauge.threshold.title.splitPanel', {
                    defaultMessage: 'Title',
                  })}
                </EuiText>
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
              </EuiSplitPanel.Inner>
            </StyleAccordion>
          </EuiFlexItem>
        </>
      )}
    </EuiFlexGroup>
  );
};
