/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiRange,
  EuiSelect,
  EuiSwitch,
  EuiFormRow,
  EuiButtonGroup,
} from '@elastic/eui';
import { MetricChartStyleControls } from './metric_vis_config';
import { RangeValue, ColorSchemas } from '../types';
import { CustomRange } from '../style_panel/custom_ranges';
import { DebouncedText } from '../style_panel/utils';
import { useDebouncedNumericValue } from '../utils/use_debounced_value';
import { getColorSchemas } from '../utils/collections';
import { StyleControlsProps } from '../utils/use_visualization_types';
import { StyleAccordion } from '../style_panel/style_accordion';

export type MetricVisStyleControlsProps = StyleControlsProps<MetricChartStyleControls>;

export const MetricVisStyleControls: React.FC<MetricVisStyleControlsProps> = ({
  styleOptions,
  onStyleChange,
  numericalColumns = [],
  categoricalColumns = [],
  dateColumns = [],
  availableChartTypes = [],
  selectedChartType,
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

  return (
    <EuiFlexGroup direction="column" gutterSize="none">
      <EuiFlexItem grow={false}>
        <StyleAccordion
          id="metricSection"
          accordionLabel={i18n.translate('explore.stylePanel.tabs.metric', {
            defaultMessage: 'Metric Settings',
          })}
          initialIsOpen={true}
        >
          <EuiFormRow
            label={i18n.translate('explore.stylePanel.metric.title', {
              defaultMessage: 'Title Setting',
            })}
          >
            <EuiButtonGroup
              legend="Show or hide title"
              options={[
                {
                  id: 'show',
                  label: 'Shown',
                  'data-test-subj': 'showTitleShown',
                },
                {
                  id: 'hide',
                  label: 'Hidden',
                  'data-test-subj': 'showTitleHidden',
                },
              ]}
              idSelected={styleOptions.showTitle ? 'show' : 'hide'}
              onChange={(id) => updateStyleOption('showTitle', id === 'show')}
              buttonSize="compressed"
              isFullWidth={true}
              type="single"
              data-test-subj="showTitleButtonGroup"
            />
          </EuiFormRow>

          {styleOptions.showTitle && (
            <EuiFormRow>
              <DebouncedText
                value={styleOptions.title || numericalColumns[0]?.name || ''}
                placeholder="Metric title"
                onChange={(text) => updateStyleOption('title', text)}
                label={i18n.translate('explore.vis.metric.title', {
                  defaultMessage: 'Metric Title',
                })}
              />
            </EuiFormRow>
          )}

          <EuiFormRow
            label={i18n.translate('explore.vis.metric.fontSize', {
              defaultMessage: 'Font Size',
            })}
          >
            <EuiRange
              value={fontSize}
              onChange={(e) => handleFontSize((e.target as HTMLInputElement).value)}
              min={10}
              max={100}
              step={1}
              showLabels
              showValue
              aria-label={i18n.translate('explore.vis.metric.fontSize', {
                defaultMessage: 'Font Size',
              })}
            />
          </EuiFormRow>

          <EuiFormRow>
            <EuiSwitch
              label={i18n.translate('explore.vis.metric.useColor', {
                defaultMessage: 'Use color for font color',
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
                  options={colorSchemas}
                  value={styleOptions.colorSchema}
                  onChange={(e) => updateStyleOption('colorSchema', e.target.value as ColorSchemas)}
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
        </StyleAccordion>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
