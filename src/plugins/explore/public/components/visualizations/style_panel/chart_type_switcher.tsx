/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import React, { useState, useEffect } from 'react';
import { EuiFormRow, EuiPanel, EuiSelect, EuiSuperSelect, EuiIcon, EuiSpacer } from '@elastic/eui';
import { ChartTypeMapping } from '../types';
import { ChartType } from '../utils/use_visualization_types';

export interface ChartTypeSwitcherProps {
  availableChartTypes: ChartTypeMapping[];
  selectedChartType?: string;
  onChartTypeChange?: (chartType: ChartType) => void;
}

const ALL_CHART_TYPES: Array<{ type: ChartType; name: string; icon: string }> = [
  { type: 'line', name: 'Line Chart', icon: 'visLine' },
  { type: 'bar', name: 'Bar Chart', icon: 'visBarVertical' },
  { type: 'area', name: 'Area Chart', icon: 'visArea' },
  { type: 'pie', name: 'Pie Chart', icon: 'visPie' },
  { type: 'metric', name: 'Metric', icon: 'visMetric' },
  { type: 'heatmap', name: 'Heatmap', icon: 'visHeatmap' },
  { type: 'scatter', name: 'Scatter Plot', icon: 'visScatter' },
];

export const ChartTypeSwitcher = ({
  availableChartTypes,
  selectedChartType,
  onChartTypeChange,
}: ChartTypeSwitcherProps) => {
  // Sort available chart types by priority (higher priority first)
  const sortedAvailableChartTypes =
    availableChartTypes && availableChartTypes.length > 0
      ? [...availableChartTypes].sort((a, b) => b.priority - a.priority)
      : [];

  const [currentChartType, setCurrentChartType] = useState<string>(
    selectedChartType ||
      (sortedAvailableChartTypes.length > 0 ? sortedAvailableChartTypes[0].type : '')
  );

  useEffect(() => {
    if (selectedChartType && selectedChartType !== currentChartType) {
      setCurrentChartType(selectedChartType);
    }
  }, [selectedChartType, currentChartType]);

  if (!availableChartTypes || availableChartTypes.length === 0) {
    return null;
  }

  // Create a set of available chart types for quick lookup
  const availableChartTypeSet = new Set(availableChartTypes.map((chart) => chart.type));

  // Create options for all chart types, marking unavailable ones as disabled
  const chartTypeOptions = ALL_CHART_TYPES.map((chartType) => {
    const isAvailable = availableChartTypeSet.has(chartType.type);
    return {
      value: chartType.type,
      text: chartType.name,
      disabled: !isAvailable,
    };
  });

  const handleChartTypeChange = (value: string) => {
    const newChartType = value as ChartType;
    setCurrentChartType(newChartType);
    if (onChartTypeChange) {
      onChartTypeChange(newChartType);
    }
  };

  return (
    <EuiPanel color="subdued" paddingSize="s">
      <EuiFormRow
        label={i18n.translate('explore.stylePanel.chartType', {
          defaultMessage: 'Visualization Type',
        })}
      >
        <EuiSuperSelect
          valueOfSelected={currentChartType}
          onChange={handleChartTypeChange}
          options={chartTypeOptions.map((option) => {
            const chartType = ALL_CHART_TYPES.find((chart) => chart.type === option.value);
            return {
              value: option.value,
              inputDisplay: (
                <>
                  <EuiIcon
                    type={chartType?.icon || 'empty'}
                    size="m"
                    style={{ marginRight: '8px' }}
                  />
                  {option.text}
                </>
              ),
              disabled: option.disabled,
            };
          })}
          data-test-subj="chartTypeSuperSelect"
          aria-label={i18n.translate('explore.stylePanel.chartTypeSwitcher.ariaLabel', {
            defaultMessage: 'Select visualization type',
          })}
        />
      </EuiFormRow>
    </EuiPanel>
  );
};
