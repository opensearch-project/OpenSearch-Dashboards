/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { isEmpty } from 'lodash';
import { i18n } from '@osd/i18n';
import { EuiFlexGroup, EuiFlexItem, EuiSwitch, EuiFormRow, EuiSelect } from '@elastic/eui';
import {
  defaultMetricChartStyles,
  MetricChartStyle,
  LayoutType,
  TextMode,
  ColorMode,
} from './metric_vis_config';
import { AxisRole } from '../types';
import { DebouncedFieldNumber, DebouncedFieldText } from '../style_panel/utils';
import { StyleControlsProps } from '../utils/use_visualization_types';
import { StyleAccordion } from '../style_panel/style_accordion';
import { AxesSelectPanel } from '../style_panel/axes/axes_selector';
import { ValueCalculationSelector } from '../style_panel/value/value_calculation_selector';
import { PercentageSelector } from '../style_panel/percentage/percentage_selector';
import { ThresholdPanel } from '../style_panel/threshold/threshold_panel';
import { StandardOptionsPanel } from '../style_panel/standard_options/standard_options_panel';

export type MetricVisStyleControlsProps = StyleControlsProps<MetricChartStyle>;

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
  const updateStyleOption = <K extends keyof MetricChartStyle>(
    key: K,
    value: MetricChartStyle[K]
  ) => {
    onStyleChange({ [key]: value });
  };

  // The mapping object will be an empty object if no fields are selected on the axes selector. No
  // visualization is generated in this case so we shouldn't display style option panels.
  const hasMappingSelected = !isEmpty(axisColumnMappings);

  // Check if FACET axis is mapped (multi-metric mode)
  const hasMultiMetric = axisColumnMappings?.[AxisRole.FACET] !== undefined;

  const layoutOptions = [
    {
      value: 'auto',
      text: i18n.translate('explore.vis.metric.layout.auto', {
        defaultMessage: 'Auto',
      }),
    },
    {
      value: 'horizontal',
      text: i18n.translate('explore.vis.metric.layout.horizontal', {
        defaultMessage: 'Horizontal',
      }),
    },
    {
      value: 'vertical',
      text: i18n.translate('explore.vis.metric.layout.vertical', {
        defaultMessage: 'Vertical',
      }),
    },
  ];

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
                  label={i18n.translate('explore.vis.metric.useThresholdColor', {
                    defaultMessage: 'Use threshold colors',
                  })}
                  data-test-subj="useThresholdColorButton"
                  checked={styleOptions?.useThresholdColor ?? false}
                  onChange={(e) => updateStyleOption('useThresholdColor', e.target.checked)}
                />
              </EuiFormRow>
              <EuiFormRow
                label={i18n.translate('explore.vis.metric.colorMode', {
                  defaultMessage: 'Color mode',
                })}
              >
                <EuiSelect
                  options={[
                    {
                      value: 'none',
                      text: i18n.translate('explore.vis.metric.colorMode.none', {
                        defaultMessage: 'None',
                      }),
                    },
                    {
                      value: 'value',
                      text: i18n.translate('explore.vis.metric.colorMode.value', {
                        defaultMessage: 'Value',
                      }),
                    },
                    {
                      value: 'background_gradient',
                      text: i18n.translate('explore.vis.metric.colorMode.backgroundGradient', {
                        defaultMessage: 'Background gradient',
                      }),
                    },
                    {
                      value: 'background_solid',
                      text: i18n.translate('explore.vis.metric.colorMode.backgroundSolid', {
                        defaultMessage: 'Background solid',
                      }),
                    },
                  ]}
                  value={styleOptions.colorMode || 'none'}
                  onChange={(e) => updateStyleOption('colorMode', e.target.value as ColorMode)}
                  data-test-subj="colorModeSelect"
                />
              </EuiFormRow>
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
                    value={styleOptions.title || ''}
                    placeholder={i18n.translate('explore.vis.metric.defaultTitle', {
                      defaultMessage: 'Default title',
                    })}
                    onChange={(text) => updateStyleOption('title', text)}
                  />
                </EuiFormRow>
              )}
            </StyleAccordion>
          </EuiFlexItem>

          <EuiFlexItem grow={false}>
            <StyleAccordion
              id="textModeSection"
              accordionLabel={i18n.translate('explore.stylePanel.tabs.textMode', {
                defaultMessage: 'Text Mode',
              })}
              initialIsOpen={false}
            >
              <EuiFormRow
                label={i18n.translate('explore.vis.metric.textMode', {
                  defaultMessage: 'Display mode',
                })}
              >
                <EuiSelect
                  options={[
                    {
                      value: 'value',
                      text: i18n.translate('explore.vis.metric.textMode.value', {
                        defaultMessage: 'Value only',
                      }),
                    },
                    {
                      value: 'name',
                      text: i18n.translate('explore.vis.metric.textMode.name', {
                        defaultMessage: 'Name only',
                      }),
                    },
                    {
                      value: 'value_and_name',
                      text: i18n.translate('explore.vis.metric.textMode.valueAndName', {
                        defaultMessage: 'Value and Name',
                      }),
                    },
                    {
                      value: 'none',
                      text: i18n.translate('explore.vis.metric.textMode.none', {
                        defaultMessage: 'None',
                      }),
                    },
                  ]}
                  value={styleOptions.textMode || 'value_and_name'}
                  onChange={(e) => updateStyleOption('textMode', e.target.value as TextMode)}
                  data-test-subj="textModeSelect"
                />
              </EuiFormRow>
            </StyleAccordion>
          </EuiFlexItem>
          {hasMultiMetric && (
            <EuiFlexItem grow={false}>
              <StyleAccordion
                id="metricLayoutSection"
                accordionLabel={i18n.translate('explore.stylePanel.tabs.metricLayout', {
                  defaultMessage: 'Layout',
                })}
                initialIsOpen={true}
              >
                <EuiFormRow
                  label={i18n.translate('explore.vis.metric.layoutType', {
                    defaultMessage: 'Layout type',
                  })}
                >
                  <EuiSelect
                    options={layoutOptions}
                    value={styleOptions.layoutType || 'auto'}
                    onChange={(e) => updateStyleOption('layoutType', e.target.value as LayoutType)}
                    data-test-subj="metricLayoutSelect"
                  />
                </EuiFormRow>
              </StyleAccordion>
            </EuiFlexItem>
          )}
          <EuiFlexItem>
            <StyleAccordion
              id="metricValueOptions"
              accordionLabel={i18n.translate('explore.stylePanel.tabs.metricValueOptions', {
                defaultMessage: 'Value options',
              })}
              initialIsOpen={true}
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
        </>
      )}
    </EuiFlexGroup>
  );
};
