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
  EuiSpacer,
} from '@elastic/eui';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { ALL_VISUALIZATION_RULES } from './rule_repository';
import { VisualizationRule } from './types';
import { ChartType, VisualizationTypeResult } from './utils/use_visualization_types';
import { CHART_METADATA } from './constants';
import { selectChartType } from '../../application/utils/state_management/selectors';

interface ChartTypeSelectorProps<T extends ChartType> {
  visualizationData: VisualizationTypeResult<T>;
  onChartTypeChange?: (chartType: ChartType) => void;
}

interface AvailableRuleOption {
  value: string;
  inputDisplay: React.ReactNode;
  iconType?: string;
  disabled?: boolean;
  rules: Array<Partial<VisualizationRule>>;
}

export const ChartTypeSelector = <T extends ChartType>({
  visualizationData,
  onChartTypeChange,
}: ChartTypeSelectorProps<T>) => {
  // Indicates no rule is matched and the user should manually generate the visualization
  const shouldManuallyGenerate = useRef(!Boolean(visualizationData.visualizationType));

  // Local state for chart type, initialized from Redux
  const storedChartTypeId = useSelector(selectChartType);
  const [currChartTypeId, setCurrChartTypeId] = useState(storedChartTypeId);

  useEffect(() => {
    setCurrChartTypeId(storedChartTypeId);
  }, [storedChartTypeId]);

  // Map columns to add value and text fields for select component
  const { numericalColumns = [], categoricalColumns = [], dateColumns = [] } = visualizationData;

  // Get icon type based on chart type
  const getChartIconType = (type: string): string => {
    switch (type) {
      case 'line':
        return 'visLine';
      case 'area':
        return 'visArea';
      case 'bar':
        return 'visBarVertical';
      case 'pie':
        return 'visPie';
      case 'metric':
        return 'visMetric';
      case 'heatmap':
        return 'heatmap';
      case 'scatterpoint':
        return 'visScatter';
      case 'table':
        return 'tableOfContents';
      default:
        return 'visualizeApp';
    }
  };

  // Create base mapping once with all visualization rules
  const baseChartTypeMapping = useMemo(() => {
    return ALL_VISUALIZATION_RULES.reduce((acc, rule) => {
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
        acc[type].rules.push({
          id: rule.id,
          name: rule.name,
          matchIndex: rule.matchIndex,
          toExpression: rule.toExpression,
        });
      });
      return acc;
    }, {} as Record<string, AvailableRuleOption>);
  }, []); // Only calculate once

  // Process chart types to mark unavailable ones as disabled
  const chartTypeMappedOptions = useMemo(() => {
    // First, filter rules for each chart type based on current selected columns
    const processed = Object.fromEntries(
      Object.entries(baseChartTypeMapping).map(([type, chartType]) => {
        const filteredRules = chartType.rules.filter((rule) => {
          const [numCount, cateCount, dateCount] = rule.matchIndex || [0, 0, 0];

          // Special condition for metric type
          if (type === CHART_METADATA.metric.type && numericalColumns.length > 0) {
            return numericalColumns[0].validValuesCount === 1;
          }

          return (
            numericalColumns.length >= numCount &&
            categoricalColumns.length >= cateCount &&
            dateColumns.length >= dateCount
          );
        });

        // Mark chart type as disabled if it has no valid rules
        const isDisabled = filteredRules.length === 0;

        // Create custom option content with greyed out text for disabled options
        const optionContent = (
          <EuiFlexGroup gutterSize="s" alignItems="center">
            <EuiFlexItem grow={false}>
              <EuiIcon
                type={chartType.iconType || 'visualizeApp'}
                size="m"
                color={isDisabled ? 'subdued' : 'default'}
              />
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiText size="s" color={isDisabled ? 'subdued' : 'default'}>
                {chartType.inputDisplay}
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        );

        return [
          type,
          {
            ...chartType,
            disabled: isDisabled,
            optionContent,
            rules: filteredRules,
          },
        ];
      })
    );

    return processed;
  }, [baseChartTypeMapping, numericalColumns, categoricalColumns.length, dateColumns.length]);

  const updateChartTypeSelection = (chartTypeId: ChartType) => {
    shouldManuallyGenerate.current = true;

    onChartTypeChange?.(chartTypeId);
    setCurrChartTypeId(chartTypeId);
  };

  if (!visualizationData || !Boolean(Object.keys(chartTypeMappedOptions).length)) return null;

  return (
    <>
      <EuiFormRow
        key="ChartTypeSelector"
        label={i18n.translate('explore.stylePanel.chartTypeSwitcher.title', {
          defaultMessage: 'Visualization type',
        })}
      >
        <EuiSuperSelect
          id="chartType"
          compressed
          valueOfSelected={
            currChartTypeId && chartTypeMappedOptions[currChartTypeId]
              ? chartTypeMappedOptions[currChartTypeId].disabled
                ? undefined
                : currChartTypeId
              : undefined
          }
          placeholder="Select a visualization type"
          options={Object.values(chartTypeMappedOptions).map((option) => ({
            ...option,
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
                  <EuiText size="s" color={option.disabled ? 'subdued' : 'default'}>
                    {option.inputDisplay}
                  </EuiText>
                </EuiFlexItem>
              </EuiFlexGroup>
            ),
          }))}
          onChange={(value) => {
            updateChartTypeSelection(value as ChartType);
          }}
        />
      </EuiFormRow>
      <EuiSpacer size="s" />
    </>
  );
};
