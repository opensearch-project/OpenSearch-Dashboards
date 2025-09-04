/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { isEmpty } from 'lodash';
import { i18n } from '@osd/i18n';
import { EuiFlexGroup, EuiFlexItem, EuiSelect, EuiSwitch, EuiFormRow } from '@elastic/eui';
import { defaultMetricChartStyles, MetricChartStyleControls } from './metric_vis_config';
import { RangeValue, ColorSchemas, AxisRole } from '../types';
import { CustomRange } from '../style_panel/custom_ranges';
import { DebouncedFieldNumber, DebouncedFieldText } from '../style_panel/utils';
import { getColorSchemas } from '../utils/collections';
import { StyleControlsProps } from '../utils/use_visualization_types';
import { StyleAccordion } from '../style_panel/style_accordion';
import { AxesSelectPanel } from '../style_panel/axes/axes_selector';
import { ValueCalculationSelector } from '../style_panel/value/value_calculation_selector';
import { PercentageSelector } from '../style_panel/percentage/percentage_selector';

export type MetricVisStyleControlsProps = StyleControlsProps<MetricChartStyleControls>;

export const MetricVisStyleControls: React.FC<MetricVisStyleControlsProps> = ({
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
  const updateStyleOption = <K extends keyof MetricChartStyleControls>(
    key: K,
    value: MetricChartStyleControls[K]
  ) => {
    onStyleChange({ [key]: value });
  };

  const colorSchemas = getColorSchemas();

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
          chartType="metric"
        />
      </EuiFlexItem>
      {hasMappingSelected && (
        <>
          <EuiFlexItem>
            <StyleAccordion
              id="metricValueOptions"
              accordionLabel={i18n.translate('explore.stylePanel.tabs.metricValueOptions', {
                defaultMessage: 'Value options',
              })}
              initialIsOpen={false}
            >
              <EuiFormRow
                label={i18n.translate('explore.vis.metric.calculation', {
                  defaultMessage: 'Calculation',
                })}
              >
                <ValueCalculationSelector
                  selectedValue={
                    styleOptions.valueCalculation ?? defaultMetricChartStyles.valueCalculation
                  }
                  onChange={(value) => updateStyleOption('valueCalculation', value)}
                />
              </EuiFormRow>
            </StyleAccordion>
          </EuiFlexItem>
          <EuiFlexItem>
            <StyleAccordion
              id="metricTextStyles"
              accordionLabel={i18n.translate('explore.stylePanel.tabs.metricTextSize', {
                defaultMessage: 'Text size',
              })}
              initialIsOpen={false}
            >
              <EuiFormRow
                label={i18n.translate('explore.vis.metric.valueFontSize', {
                  defaultMessage: 'Value size',
                })}
              >
                <DebouncedFieldNumber
                  value={styleOptions.fontSize}
                  onChange={(val) => onStyleChange({ fontSize: val })}
                  placeholder="auto"
                  data-test-subj="valueFontSizeInput"
                />
              </EuiFormRow>
              <EuiFormRow
                label={i18n.translate('explore.vis.metric.titleFontSize', {
                  defaultMessage: 'Title size',
                })}
              >
                <DebouncedFieldNumber
                  value={styleOptions.titleSize}
                  onChange={(val) => onStyleChange({ titleSize: val })}
                  placeholder="auto"
                  data-test-subj="titleFontSizeInput"
                />
              </EuiFormRow>
              <EuiFormRow
                label={i18n.translate('explore.vis.metric.percentageFontSize', {
                  defaultMessage: 'Percentage size',
                })}
              >
                <DebouncedFieldNumber
                  value={styleOptions.percentageSize}
                  onChange={(val) => onStyleChange({ percentageSize: val })}
                  placeholder="auto"
                  data-test-subj="percentageFontSizeInput"
                />
              </EuiFormRow>
            </StyleAccordion>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <StyleAccordion
              id="metricSection"
              accordionLabel={i18n.translate('explore.stylePanel.tabs.metric', {
                defaultMessage: 'Metric',
              })}
              initialIsOpen={true}
            >
              <EuiFormRow>
                <EuiSwitch
                  compressed
                  label={i18n.translate('explore.vis.metric.useColor', {
                    defaultMessage: 'Value color',
                  })}
                  checked={styleOptions.useColor}
                  onChange={(e) => updateStyleOption('useColor', e.target.checked)}
                />
              </EuiFormRow>
              {styleOptions.useColor && (
                <>
                  <EuiFormRow
                    label={i18n.translate('explore.vis.metric.colorSchema', {
                      defaultMessage: 'Color Schema',
                    })}
                  >
                    <EuiSelect
                      compressed
                      options={colorSchemas}
                      value={styleOptions.colorSchema}
                      onChange={(e) =>
                        updateStyleOption('colorSchema', e.target.value as ColorSchemas)
                      }
                      data-test-subj="colorSchemaSelect"
                    />
                  </EuiFormRow>
                  <EuiFormRow>
                    <CustomRange
                      customRanges={styleOptions.customRanges}
                      onCustomRangesChange={(ranges: RangeValue[]) => {
                        updateStyleOption('customRanges', ranges);
                      }}
                    />
                  </EuiFormRow>
                </>
              )}
              <PercentageSelector
                percentageColor={
                  styleOptions.percentageColor ?? defaultMetricChartStyles.percentageColor
                }
                showPercentage={
                  styleOptions.showPercentage ?? defaultMetricChartStyles.showPercentage
                }
                onPercentageColorChange={(color) => updateStyleOption('percentageColor', color)}
                onShowPercentageToggle={(show) => updateStyleOption('showPercentage', show)}
              />
              <EuiFormRow>
                <EuiSwitch
                  compressed
                  label={i18n.translate('explore.stylePanel.metric.title', {
                    defaultMessage: 'Show title',
                  })}
                  checked={styleOptions.showTitle}
                  onChange={(e) => updateStyleOption('showTitle', e.target.checked)}
                  data-test-subj="showTitleSwitch"
                />
              </EuiFormRow>

              {styleOptions.showTitle && (
                <EuiFormRow
                  label={i18n.translate('explore.vis.metric.title', {
                    defaultMessage: 'Title',
                  })}
                >
                  <DebouncedFieldText
                    value={styleOptions.title || axisColumnMappings[AxisRole.Value]?.name || ''}
                    placeholder={i18n.translate('explore.vis.metric.title', {
                      defaultMessage: 'Title',
                    })}
                    onChange={(text) => updateStyleOption('title', text)}
                  />
                </EuiFormRow>
              )}
            </StyleAccordion>
          </EuiFlexItem>
        </>
      )}
    </EuiFlexGroup>
  );
};
