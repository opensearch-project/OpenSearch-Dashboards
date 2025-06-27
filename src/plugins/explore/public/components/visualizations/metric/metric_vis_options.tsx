/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiSplitPanel,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFieldNumber,
  EuiPanel,
  EuiSelect,
  EuiSwitch,
  EuiFormRow,
  EuiTitle,
} from '@elastic/eui';
import { MetricChartStyleControls } from './metric_vis_config';
import { RangeValue, ColorSchemas } from '../types';
import { CustomRange } from '../style_panel/custom_ranges';
import { DebouncedText } from '../style_panel/utils';
import { useDebouncedNumericValue } from '../utils/use_debounced_value';
import { getColorSchemas } from '../utils/collections';
import { StyleControlsProps } from '../utils/use_visualization_types';
import { ChartTypeSwitcher } from '../style_panel/chart_type_switcher/chart_type_switcher';

export type MetricVisStyleControlsProps = StyleControlsProps<MetricChartStyleControls>;

export const MetricVisStyleControls: React.FC<MetricVisStyleControlsProps> = ({
  styleOptions,
  onStyleChange,
  numericalColumns = [],
  categoricalColumns = [],
  dateColumns = [],
  availableChartTypes = [],
  selectedChartType,
  onChartTypeChange,
}) => {
  // State to track expanded/collapsed state of each panel
  const [expandedPanels, setExpandedPanels] = useState({
    general: false,
    exclusive: false,
  });

  const togglePanel = (panelId: string) => {
    setExpandedPanels({
      ...expandedPanels,
      [panelId]: !expandedPanels[panelId as keyof typeof expandedPanels],
    });
  };

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
    <EuiSplitPanel.Outer>
      <EuiSplitPanel.Inner paddingSize="s">
        <EuiButtonEmpty
          iconSide="left"
          color="text"
          iconType={expandedPanels.general ? 'arrowDown' : 'arrowRight'}
          onClick={() => togglePanel('general')}
          size="xs"
          data-test-subj="metricVisGeneralButton"
        >
          {i18n.translate('explore.vis.metric.tabs.general', {
            defaultMessage: 'General',
          })}
        </EuiButtonEmpty>
        {expandedPanels.general && (
          <ChartTypeSwitcher
            availableChartTypes={availableChartTypes}
            selectedChartType={selectedChartType}
            onChartTypeChange={onChartTypeChange}
          />
        )}
      </EuiSplitPanel.Inner>

      <EuiSplitPanel.Inner paddingSize="s">
        <EuiButtonEmpty
          iconSide="left"
          color="text"
          iconType={expandedPanels.exclusive ? 'arrowDown' : 'arrowRight'}
          onClick={() => togglePanel('exclusive')}
          size="xs"
          data-test-subj="metricVisExclusiveButton"
        >
          {i18n.translate('explore.vis.metric.tabs.exclusive', {
            defaultMessage: 'Metric',
          })}
        </EuiButtonEmpty>
        {expandedPanels.exclusive && (
          <EuiPanel paddingSize="s" data-test-subj="metricExclusivePanel">
            <EuiFlexGroup direction="column" alignItems="flexStart" gutterSize="m">
              <EuiFlexItem>
                <EuiTitle size="xs">
                  <h4>
                    {i18n.translate('explore.vis.metric.settings', {
                      defaultMessage: 'Exclusive Settings',
                    })}
                  </h4>
                </EuiTitle>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiSwitch
                  label="Show title"
                  checked={styleOptions.showTitle}
                  onChange={(e) => updateStyleOption('showTitle', e.target.checked)}
                  data-test-subj="showTitleButton"
                />
              </EuiFlexItem>
              {styleOptions.showTitle && (
                <EuiFlexItem>
                  <DebouncedText
                    value={styleOptions.title || numericalColumns[0]?.name || ''}
                    placeholder="Metric title"
                    onChange={(text) => updateStyleOption('title', text)}
                    label={i18n.translate('explore.vis.metric.title', {
                      defaultMessage: 'Axis title',
                    })}
                  />
                </EuiFlexItem>
              )}
              <EuiFlexItem>
                <EuiFormRow
                  label={i18n.translate('explore.vis.metric.fontSize', {
                    defaultMessage: 'Font Size',
                  })}
                >
                  <EuiFieldNumber
                    value={fontSize}
                    onChange={(e) => handleFontSize(e.target.value)}
                  />
                </EuiFormRow>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiSwitch
                  label={i18n.translate('explore.vis.metric.useColor', {
                    defaultMessage: 'Use color for font color',
                  })}
                  checked={styleOptions.useColor}
                  onChange={(e) => updateStyleOption('useColor', e.target.checked)}
                />
              </EuiFlexItem>
              {styleOptions.useColor && (
                <>
                  <EuiFlexItem>
                    <EuiFormRow
                      label={i18n.translate('explore.vis.metric.colorSchema', {
                        defaultMessage: 'Color Schema',
                      })}
                    >
                      <EuiSelect
                        options={colorSchemas}
                        value={styleOptions.colorSchema}
                        onChange={(e) =>
                          updateStyleOption('colorSchema', e.target.value as ColorSchemas)
                        }
                      />
                    </EuiFormRow>
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <CustomRange
                      customRanges={styleOptions.customRanges}
                      onCustomRangesChange={(ranges: RangeValue[]) => {
                        updateStyleOption('customRanges', ranges);
                      }}
                    />
                  </EuiFlexItem>
                </>
              )}
            </EuiFlexGroup>
          </EuiPanel>
        )}
      </EuiSplitPanel.Inner>
    </EuiSplitPanel.Outer>
  );
};
