/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import React, { useState, useEffect } from 'react';
import { EuiPanel, EuiSelect } from '@elastic/eui';
import { ChartTypeMapping } from '../types';

export interface ChartTypeSwitcherProps {
  availableChartTypes: ChartTypeMapping[];
  selectedChartType?: string;
  onChartTypeChange?: (chartType: string) => void;
}

export const ChartTypeSwitcher = ({
  availableChartTypes,
  selectedChartType,
  onChartTypeChange,
}: ChartTypeSwitcherProps) => {
  // Sort chart types by priority (higher priority first)
  const sortedChartTypes =
    availableChartTypes && availableChartTypes.length > 0
      ? [...availableChartTypes].sort((a, b) => b.priority - a.priority)
      : [];

  const [currentChartType, setCurrentChartType] = useState<string>(
    selectedChartType || (sortedChartTypes.length > 0 ? sortedChartTypes[0].type : '')
  );

  useEffect(() => {
    if (selectedChartType && selectedChartType !== currentChartType) {
      setCurrentChartType(selectedChartType);
    }
  }, [selectedChartType, currentChartType]);

  if (!availableChartTypes || availableChartTypes.length === 0) {
    return null;
  }

  const chartTypeOptions = sortedChartTypes.map((chartType) => ({
    value: chartType.type,
    text: chartType.name,
  }));

  const handleChartTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newChartType = e.target.value;
    setCurrentChartType(newChartType);
    if (onChartTypeChange) {
      onChartTypeChange(newChartType);
    }
  };

  return (
    <EuiPanel color="subdued" paddingSize="s">
      <div style={{ fontSize: '16px', marginBottom: '8px' }}>
        {i18n.translate('explore.stylePanel.chartTypeSwitcher.title', {
          defaultMessage: 'Visualization Type',
        })}
      </div>
      <EuiSelect
        value={currentChartType}
        onChange={handleChartTypeChange}
        options={chartTypeOptions}
        data-test-subj="chartTypeSelect"
        aria-label={i18n.translate('explore.stylePanel.chartTypeSwitcher.ariaLabel', {
          defaultMessage: 'Select visualization type',
        })}
      />
    </EuiPanel>
  );
};
