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
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { VisualizationRule } from './types';
import { ChartType } from './utils/use_visualization_types';
import { CHART_METADATA } from './constants';
import { isChartType } from './utils/is_chart_type';
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
  rules: Array<Partial<VisualizationRule>>;
}

// TODO: refactor ChartTypeSelector a dumb component so that it won't compute the disabled options internally
export const ChartTypeSelector = <T extends ChartType>({
  visualizationData,
  onChartTypeChange,
  chartType,
}: ChartTypeSelectorProps<T>) => {
  // Indicates no rule is matched and the user should manually generate the visualization
  const shouldManuallyGenerate = useRef(!Boolean(chartType));
  const [currChartTypeId, setCurrChartTypeId] = useState(chartType);

  useEffect(() => {
    setCurrChartTypeId(chartType);
  }, [chartType]);

  // Map columns to add value and text fields for select component
  const { numericalColumns, categoricalColumns, dateColumns } = visualizationData;

  // Get icon type based on chart type
  const getChartIconType = (type: string): string => {
    if (isChartType(type)) {
      return CHART_METADATA[type].icon;
    }
    return '';
  };

  // Create base mapping once with all visualization rules
  const baseChartTypeMapping = useMemo(() => {
    return visualizationRegistry.getRules().reduce((acc, rule) => {
      rule.chartTypes.forEach(({ type, name }) => {
        if (!acc[type]) {
          const iconType = getChartIconType(type);
          acc[type] = {
            value: type,
            inputDisplay: name,
            iconType,
            rules: [],
          };
        }
        acc[type].rules.push({ ...rule });
      });
      return acc;
    }, {} as Record<string, AvailableChartTypeOption>);
  }, []); // Only calculate once

  // Process chart types to mark unavailable ones as disabled
  const chartTypeMappedOptions = useMemo(() => {
    // First, filter rules for each chart type based on current selected columns
    const processed = Object.fromEntries(
      Object.entries(baseChartTypeMapping).map(([type, option]) => {
        const filteredRules = option.rules.filter((rule) => {
          if (rule.matches?.(numericalColumns, categoricalColumns, dateColumns) === 'NOT_MATCH') {
            return false;
          }
          return true;
        });

        // Mark chart type as disabled if it has no valid rules
        const isDisabled = filteredRules.length === 0;

        return [
          type,
          {
            inputDisplay: option.inputDisplay,
            value: option.value,
            iconType: option.iconType,
            disabled: isDisabled,
          },
        ];
      })
    );

    return processed;
  }, [baseChartTypeMapping, numericalColumns, categoricalColumns, dateColumns]);

  const selectOptions = useMemo(() => {
    const allTypes = [
      ...Object.values(chartTypeMappedOptions).map((t) => ({
        value: t.value,
        disabled: t.disabled,
        inputDisplay: t.inputDisplay,
        iconType: t.iconType,
      })),
      {
        value: 'table',
        iconType: getChartIconType('table'),
        disabled: false,
        inputDisplay: 'Table',
      },
    ];
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

  const updateChartTypeSelection = (chartTypeId: ChartType) => {
    shouldManuallyGenerate.current = true;

    onChartTypeChange?.(chartTypeId);
    setCurrChartTypeId(chartTypeId);
  };

  if (!visualizationData || !Boolean(Object.keys(chartTypeMappedOptions).length)) return null;

  return (
    <EuiPanel hasBorder={false} hasShadow={false} color="subdued" paddingSize="s">
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
          valueOfSelected={currChartTypeId || ''}
          placeholder="Select a visualization type"
          options={selectOptions}
          onChange={(value) => {
            updateChartTypeSelection(value as ChartType);
          }}
        />
      </EuiFormRow>
    </EuiPanel>
  );
};
