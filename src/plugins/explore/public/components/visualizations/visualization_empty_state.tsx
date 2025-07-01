/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import {
  EuiFlexGroup,
  EuiSuperSelect,
  EuiSpacer,
  EuiButtonIcon,
  EuiFormRow,
  EuiFlexItem,
  EuiIcon,
  EuiText,
} from '@elastic/eui';
import { isEqual } from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { ALL_VISUALIZATION_RULES } from './rule_repository';
import { VisColumn, VisFieldType, VisualizationRule } from './types';
import {
  ChartType,
  useVisualizationRegistry,
  VisualizationTypeResult,
} from './utils/use_visualization_types';
import { CHART_METADATA } from './constants';
import { StyleAccordion } from './style_panel/style_accordion';
import {
  selectFieldNames,
  selectChartType,
} from '../../application/utils/state_management/selectors';
import { UpdateVisualizationProps } from './visualization_container';

interface VisualizationEmptyStateProps {
  visualizationData: VisualizationTypeResult<ChartType>;
  updateVisualization: (data: UpdateVisualizationProps) => void;
}

interface AvailableRuleOption {
  value: string;
  inputDisplay: React.ReactNode;
  iconType?: string;
  disabled?: boolean;
  rules: Array<Partial<VisualizationRule>>;
}

interface VisColumnOption {
  value: string;
  column: VisColumn;
  inputDisplay: string;
}

// Exclude unknown fields since we cannot generate visualization with them
type VisFieldTypeString = VisFieldType.Numerical | VisFieldType.Categorical | VisFieldType.Date;

const FIELD_TYPE_ORDER: VisFieldTypeString[] = [
  VisFieldType.Numerical,
  VisFieldType.Categorical,
  VisFieldType.Date,
];

const FIELD_TYPE_LABELS = [
  i18n.translate('explore.stylePanel.fieldSwitcher.numericalFieldLabel', {
    defaultMessage: 'Numerical Field',
  }),
  i18n.translate('explore.stylePanel.fieldSwitcher.categoricalFieldLabel', {
    defaultMessage: 'Categorical Field',
  }),
  i18n.translate('explore.stylePanel.fieldSwitcher.dateFieldLabel', {
    defaultMessage: 'Date Field',
  }),
];

export const VisualizationEmptyState: React.FC<VisualizationEmptyStateProps> = ({
  visualizationData,
  updateVisualization,
}) => {
  const visualizationRegistry = useVisualizationRegistry();

  // Original vis data from the query result
  const originalVisualizationData = useRef(visualizationData);

  // Indicates no rule is matched and the user should manually generate the visualization
  const shouldManuallyGenerate = useRef(
    !Boolean(originalVisualizationData.current.visualizationType)
  );

  // Local state for chart type, initialized from Redux
  const storedChartTypeId = useSelector(selectChartType);
  const [currChartTypeId, setCurrChartTypeId] = useState(storedChartTypeId);

  // Local state for field selection, avoid trigger update on express in visualization container
  const [fieldsSelection, setFieldsSelection] = useState(
    useSelector(selectFieldNames) ?? {
      categorical: [],
      date: [],
      numerical: [],
    }
  );

  const currFieldsCountByType: [number, number, number] = useMemo(
    () => [
      fieldsSelection.numerical.length,
      fieldsSelection.categorical.length,
      fieldsSelection.date.length,
    ],
    [fieldsSelection]
  );

  // Map columns to add value and text fields for select component
  const {
    numericalColumns = [],
    categoricalColumns = [],
    dateColumns = [],
  } = originalVisualizationData.current;
  const convertToSelectOption = (col: VisColumn): VisColumnOption => ({
    column: col,
    value: col.name,
    inputDisplay: col.name,
  });
  const allColumnOptions = useMemo(
    () =>
      [numericalColumns, categoricalColumns, dateColumns].map((columns) =>
        columns.map(convertToSelectOption)
      ),
    [numericalColumns, categoricalColumns, dateColumns]
  );
  const [numericalColumnOptions, categoricalColumnOptions, dateColumnOptions] = allColumnOptions;

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
          if (type === CHART_METADATA.metric.type && numericalColumnOptions.length > 0) {
            return numericalColumnOptions[0].column.validValuesCount === 1;
          }

          return (
            numericalColumnOptions.length >= numCount &&
            categoricalColumnOptions.length >= cateCount &&
            dateColumnOptions.length >= dateCount
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
  }, [
    baseChartTypeMapping,
    numericalColumnOptions,
    categoricalColumnOptions.length,
    dateColumnOptions.length,
  ]);

  const currChartTypeOption = currChartTypeId ? chartTypeMappedOptions[currChartTypeId] : undefined;

  /**
   * Available rules remained base on count of the current selections.
   *
   * For example, there's a chart supports all of [2, 0, 1], [1, 1, 1], [1, 2, 0] rules. After selects
   * a categorical field, the [2, 0, 1] should no longer be available so should be filtered out, whereas
   * [1, 1, 1], [1, 2, 0] should remains available.
   */
  const availableRules = useMemo(() => {
    if (!currChartTypeId || !chartTypeMappedOptions[currChartTypeId]) return [];

    return chartTypeMappedOptions[currChartTypeId].rules.filter((rule) => {
      const [ruleNum, ruleCat, ruleDate] = rule.matchIndex || [0, 0, 0];
      const [currNum, currCat, currDate] = currFieldsCountByType;

      return ruleNum >= currNum && ruleCat >= currCat && ruleDate >= currDate;
    });
  }, [currChartTypeId, currFieldsCountByType, chartTypeMappedOptions]);

  const handleGeneration = useCallback(() => {
    // Update the visualizationData in the parent component
    if (originalVisualizationData.current) {
      const ruleToUse = availableRules.find((rule) =>
        isEqual(rule.matchIndex, currFieldsCountByType)
      );
      if (ruleToUse) {
        const visualizationType = visualizationRegistry.getVisualizationConfig(
          currChartTypeOption?.value!
        );
        if (visualizationType) {
          updateVisualization({
            visualizationType,
            rule: ruleToUse,
            fieldNames: fieldsSelection,
            columns: {
              numerical: originalVisualizationData.current.numericalColumns
                ? originalVisualizationData.current.numericalColumns.filter((col) =>
                    fieldsSelection.numerical.includes(col.name)
                  )
                : [],
              categorical: originalVisualizationData.current.categoricalColumns
                ? originalVisualizationData.current.categoricalColumns.filter((col) =>
                    fieldsSelection.categorical.includes(col.name)
                  )
                : [],
              date: originalVisualizationData.current.dateColumns
                ? originalVisualizationData.current.dateColumns.filter((col) =>
                    fieldsSelection.date.includes(col.name)
                  )
                : [],
            },
          });
          // Reset the flag after successful generation
          shouldManuallyGenerate.current = false;
        }
      }
    }
  }, [
    availableRules,
    currFieldsCountByType,
    fieldsSelection,
    visualizationRegistry,
    currChartTypeOption,
    updateVisualization,
  ]);

  useEffect(() => {
    if (
      currChartTypeId &&
      currChartTypeOption &&
      shouldManuallyGenerate.current &&
      !isEqual(currFieldsCountByType, [0, 0, 0])
    ) {
      handleGeneration();
    }
  }, [currChartTypeId, currChartTypeOption, currFieldsCountByType, handleGeneration]);

  // Max possible number of selections for each field types base on current available rules
  const maxMatchIndex = useMemo(() => {
    if (!availableRules.length) return [0, 0, 0];

    return availableRules.reduce(
      (max, rule) => {
        const [ruleNum, ruleCat, ruleDate] = rule.matchIndex || [0, 0, 0];
        return [Math.max(max[0], ruleNum), Math.max(max[1], ruleCat), Math.max(max[2], ruleDate)];
      },
      [0, 0, 0]
    );
  }, [availableRules]);

  // Max number of the remaining possible selection for each field types base on current fields selection
  const matchIndexDifference = useMemo(() => {
    const [maxNum, maxCat, maxDate] = maxMatchIndex;
    const [currNum, currCat, currDate] = currFieldsCountByType;

    return [
      Math.max(0, maxNum - currNum),
      Math.max(0, maxCat - currCat),
      Math.max(0, maxDate - currDate),
    ];
  }, [maxMatchIndex, currFieldsCountByType]);

  const updateChartTypeSelection = (chartTypeId: ChartType) => {
    shouldManuallyGenerate.current = true;

    setCurrChartTypeId(chartTypeId);
  };

  useEffect(() => {
    // Listen to the change of chart type, which will triggers maxMatchIndex changes
    maxMatchIndex.forEach((max, index) => {
      if (max < currFieldsCountByType[index]) {
        // Reset the fields selection when current selected fields are not support with the
        // chart type that the user just changed
        setFieldsSelection({
          numerical: [],
          categorical: [],
          date: [],
        });
        return;
      }
    });
  }, [maxMatchIndex, currFieldsCountByType]);

  const updateFieldSelection = useCallback(
    (fieldTypeString: VisFieldTypeString, fieldTypeIndex: number, columnName: string) => {
      shouldManuallyGenerate.current = true;

      const columnOption = allColumnOptions[fieldTypeIndex].find(
        (col) => col.value === columnName
      )!;

      setFieldsSelection((prev) => ({
        ...prev,
        [fieldTypeString]: [...prev[fieldTypeString], columnOption.column.name],
      }));
    },
    [allColumnOptions]
  );

  const removeFieldSelection = useCallback(
    (fieldTypeString: VisFieldTypeString, columnName: string) => {
      shouldManuallyGenerate.current = true;

      setFieldsSelection((prev) => ({
        ...prev,
        [fieldTypeString]: prev[fieldTypeString].filter((name) => name !== columnName),
      }));
    },
    []
  );

  const replaceFieldSelection = useCallback(
    (
      fieldTypeString: VisFieldTypeString,
      fieldTypeIndex: number,
      oldColumnName: string,
      newColumnName: string
    ) => {
      shouldManuallyGenerate.current = true;

      const newColumnOption = allColumnOptions[fieldTypeIndex].find(
        (col) => col.value === newColumnName
      )!;

      setFieldsSelection((prev) => ({
        ...prev,
        [fieldTypeString]: prev[fieldTypeString].map((name) =>
          name === oldColumnName ? newColumnOption.column.name : name
        ),
      }));
    },
    [allColumnOptions]
  );

  if (!originalVisualizationData.current || !Boolean(Object.keys(chartTypeMappedOptions).length))
    return null;

  return (
    <EuiFlexGroup direction="column" gutterSize="none" key="visualizationEmptyState">
      <EuiFlexItem grow={false}>
        <StyleAccordion
          id="generalSection"
          accordionLabel={i18n.translate('explore.stylePanel.tabs.general', {
            defaultMessage: 'General',
          })}
          initialIsOpen={true}
        >
          <EuiFormRow
            label={i18n.translate('explore.stylePanel.chartTypeSwitcher.title', {
              defaultMessage: 'Visualization Type',
            })}
          >
            <EuiSuperSelect
              id="chartType"
              valueOfSelected={currChartTypeId}
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
        </StyleAccordion>
      </EuiFlexItem>
      {currChartTypeId && (
        <EuiFlexItem grow={false}>
          <StyleAccordion
            id="axisAndScalesSection"
            accordionLabel={i18n.translate('explore.stylePanel.tabs.axisAndScales', {
              defaultMessage: 'Axis & scales',
            })}
            initialIsOpen={true}
          >
            <>
              {FIELD_TYPE_ORDER.map((fieldTypeString, index) => {
                const selectedColumns = fieldsSelection
                  ? fieldsSelection[fieldTypeString as keyof typeof fieldsSelection]
                  : [];
                const canSelectMoreFields = matchIndexDifference[index] > 0;

                // Label only displays when select component and/or selected fields are shown
                const shouldDisplayLabel = Boolean(selectedColumns.length) || canSelectMoreFields;

                return (
                  <React.Fragment key={`${fieldTypeString}_${index}`}>
                    {shouldDisplayLabel && (
                      <EuiFormRow label={FIELD_TYPE_LABELS[index]}>
                        <>
                          {selectedColumns.map((selectedColumn) => {
                            return (
                              <React.Fragment key={selectedColumn}>
                                <EuiFlexGroup
                                  gutterSize="none"
                                  alignItems="center"
                                  style={{ gap: 4 }}
                                >
                                  <EuiFlexItem>
                                    <EuiSuperSelect
                                      fullWidth
                                      valueOfSelected={selectedColumn}
                                      options={allColumnOptions[index].filter(
                                        // Filter out the fields already selected but keep the current one
                                        (col) => {
                                          const isCurrentColumn =
                                            col.column.name === selectedColumn;
                                          const isAlreadySelected = selectedColumns.some(
                                            (selected) => selected === col.column.name
                                          );
                                          // Only display as an available option when there is only one value
                                          // Avoiding render multiple overlapped values as metric
                                          const isValidForMetric =
                                            currChartTypeId === 'metric'
                                              ? col.column.validValuesCount === 1
                                              : true;

                                          return (
                                            (isCurrentColumn || !isAlreadySelected) &&
                                            isValidForMetric
                                          );
                                        }
                                      )}
                                      onChange={(value) => {
                                        replaceFieldSelection(
                                          fieldTypeString as VisFieldTypeString,
                                          index,
                                          selectedColumn,
                                          value
                                        );
                                      }}
                                    />
                                  </EuiFlexItem>
                                  <EuiFlexItem grow={false}>
                                    <EuiButtonIcon
                                      onClick={() =>
                                        removeFieldSelection(
                                          fieldTypeString as VisFieldTypeString,
                                          selectedColumn
                                        )
                                      }
                                      iconType="trash"
                                      aria-label={`delete selected field ${selectedColumn}`}
                                    />
                                  </EuiFlexItem>
                                </EuiFlexGroup>

                                <EuiSpacer size="xs" />
                              </React.Fragment>
                            );
                          })}
                        </>
                      </EuiFormRow>
                    )}
                    {canSelectMoreFields && (
                      <>
                        <EuiSuperSelect
                          id={`${fieldTypeString}_field`}
                          placeholder="Select a field"
                          options={allColumnOptions[index].filter(
                            (col) =>
                              !selectedColumns.some((selected) => selected === col.column.name)
                          )}
                          onChange={(value) =>
                            updateFieldSelection(
                              fieldTypeString as VisFieldTypeString,
                              index,
                              value
                            )
                          }
                        />
                      </>
                    )}
                  </React.Fragment>
                );
              })}
            </>
          </StyleAccordion>
        </EuiFlexItem>
      )}
    </EuiFlexGroup>
  );
};
