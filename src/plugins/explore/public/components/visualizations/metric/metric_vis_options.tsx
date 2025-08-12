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
  EuiRange,
  EuiSelect,
  EuiSwitch,
  EuiFormRow,
} from '@elastic/eui';
import { MetricChartStyleControls } from './metric_vis_config';
import { RangeValue, ColorSchemas, AxisRole } from '../types';
import { CustomRange } from '../style_panel/custom_ranges';
import { DebouncedText } from '../style_panel/utils';
import { useDebouncedNumericValue } from '../utils/use_debounced_value';
import { getColorSchemas } from '../utils/collections';
import { StyleControlsProps } from '../utils/use_visualization_types';
import { StyleAccordion } from '../style_panel/style_accordion';
import { AxesSelectPanel } from '../style_panel/axes/axes_selector';

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

  const [fontSize, handleFontSize] = useDebouncedNumericValue(
    styleOptions.fontSize,
    (val) => onStyleChange({ fontSize: val }),
    {
      min: 10,
      max: 100,
      defaultValue: 60,
    }
  );

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
          <EuiFlexItem grow={false}>
            <StyleAccordion
              id="metricSection"
              accordionLabel={i18n.translate('explore.stylePanel.tabs.metric', {
                defaultMessage: 'Metric',
              })}
              initialIsOpen={true}
            >
              <EuiFormRow
                label={i18n.translate('explore.vis.metric.fontSize', {
                  defaultMessage: 'Font size',
                })}
              >
                <EuiRange
                  compressed
                  value={fontSize}
                  onChange={(e) => handleFontSize((e.target as HTMLInputElement).value)}
                  min={10}
                  max={100}
                  step={1}
                  showLabels
                  showValue
                  aria-label={i18n.translate('explore.vis.metric.fontSize', {
                    defaultMessage: 'Font size',
                  })}
                />
              </EuiFormRow>
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
                <EuiFormRow>
                  <DebouncedText
                    value={styleOptions.title || axisColumnMappings[AxisRole.Value]?.name || ''}
                    placeholder={i18n.translate('explore.vis.metric.title', {
                      defaultMessage: 'Title',
                    })}
                    onChange={(text) => updateStyleOption('title', text)}
                    label={i18n.translate('explore.vis.metric.title', {
                      defaultMessage: 'Title',
                    })}
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
