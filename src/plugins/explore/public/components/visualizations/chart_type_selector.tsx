/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import {
  EuiFlexGroup,
  EuiSuperSelect,
  EuiFormRow,
  EuiFlexItem,
  EuiIcon,
  EuiText,
  EuiPanel,
} from '@elastic/eui';
import React, { useMemo } from 'react';
import { ChartType } from './utils/use_visualization_types';
import { VisData } from './visualization_builder.types';
import { visualizationRegistry } from './visualization_registry';

interface ChartTypeSelectorProps<T extends ChartType> {
  visualizationData: VisData;
  chartType?: ChartType;
  onChartTypeChange?: (chartType: ChartType) => void;
}

interface AvailableChartTypeOption {
  value: string;
  inputDisplay: React.ReactNode;
  iconType?: string;
  disabled?: boolean;
}

// TODO: refactor ChartTypeSelector a dumb component so that it won't compute the disabled options internally
export const ChartTypeSelector = <T extends ChartType>({
  visualizationData,
  onChartTypeChange,
  chartType,
}: ChartTypeSelectorProps<T>) => {
  // Map columns to add value and text fields for select component
  const { numericalColumns, categoricalColumns, dateColumns } = visualizationData;

  const chartTypeMappedOptions = useMemo(() => {
    return visualizationRegistry.getAvailableChartTypes().reduce((acc, metadata) => {
      if (!acc[metadata.type]) {
        const { all } = visualizationRegistry.findRulesByColumns(
          numericalColumns,
          categoricalColumns,
          dateColumns,
          metadata.type
        );
        acc[metadata.type] = {
          value: metadata.type,
          inputDisplay: metadata.name,
          iconType: metadata.icon,
          disabled: all.length === 0 && metadata.type !== 'table',
        };
      }
      return acc;
    }, {} as Record<string, AvailableChartTypeOption>);
  }, [numericalColumns, categoricalColumns, dateColumns]);

  const selectOptions = useMemo(() => {
    const allTypes = [...Object.values(chartTypeMappedOptions)];
    const options = allTypes.map((option) => ({
      value: option.value,
      disabled: option.disabled,
      inputDisplay: (
        <EuiFlexGroup gutterSize="s" alignItems="center">
          <EuiFlexItem grow={false}>
            <EuiIcon
              type={option.iconType || 'visualizeApp'}
              size="m"
              color={option.disabled ? 'subdued' : 'default'}
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiText
              data-test-subj={`exploreChartTypeSelector-${option.value}`}
              size="s"
              color={option.disabled ? 'subdued' : 'default'}
            >
              {option.inputDisplay}
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
      ),
    }));
    return options;
  }, [chartTypeMappedOptions]);

  const updateChartTypeSelection = (type: ChartType) => {
    onChartTypeChange?.(type);
  };

  if (!visualizationData || !Boolean(Object.keys(chartTypeMappedOptions).length)) return null;

  return (
    <EuiPanel hasBorder={false} hasShadow={false} paddingSize="s">
      <EuiFormRow
        key="ChartTypeSelector"
        label={i18n.translate('explore.chartTypeSwitcher.title', {
          defaultMessage: 'Visualization type',
        })}
      >
        <EuiSuperSelect
          id="chartType"
          data-test-subj="exploreChartTypeSelector"
          compressed
          valueOfSelected={chartType || ''}
          options={selectOptions}
          onChange={(value) => {
            updateChartTypeSelection(value as ChartType);
          }}
        />
      </EuiFormRow>
    </EuiPanel>
  );
};
