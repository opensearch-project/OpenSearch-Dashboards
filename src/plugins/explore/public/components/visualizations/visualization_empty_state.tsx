/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import {
  EuiText,
  EuiFlexGroup,
  EuiPanel,
  EuiSelect,
  EuiSpacer,
  EuiButtonIcon,
  EuiAccordion,
  EuiHorizontalRule,
  EuiFormRow,
} from '@elastic/eui';
import { isEqual } from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { ALL_VISUALIZATION_RULES } from './rule_repository';
import { VisColumn, VisFieldType, VisualizationRule } from './types';
import {
  ChartType,
  useVisualizationRegistry,
  VisualizationTypeResult,
} from './utils/use_visualization_types';
import { setChartType, setStyleOptions } from '../../application/utils/state_management/slices';
import { CHART_METADATA } from './constants';

interface VisualizationEmptyStateProps {
  visualizationData: VisualizationTypeResult<ChartType>;
  setVisualizationData?: (data: VisualizationTypeResult<ChartType> | undefined) => void;
}

interface AvailableRuleOption {
  value: string;
  text: string;
  rules: Array<Partial<VisualizationRule>>;
}

interface VisColumnOption {
  value: string;
  text: string;
  column: VisColumn;
}

// Exclude unknown fields since we cannot generate visualization with them
type VisFieldTypeString = VisFieldType.Numerical | VisFieldType.Categorical | VisFieldType.Date;

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
  setVisualizationData,
}) => {
  const dispatch = useDispatch();

  const visualizationRegistry = useVisualizationRegistry();

  // Keep the original columns that get form the search because generated new visualization will
  // modifiy the columns in visualization data
  const originalVisualizationData = useRef(visualizationData);

  // Indicates no rule is matched and the user should manually generate the visualization
  const shouldManuallyGenerate = useRef(!Boolean(visualizationData.visualizationType));

  // Selected chart type id, such as "area" and "line"
  const [currChartTypeId, setCurrChartTypeId] = useState<string | undefined>(
    visualizationData.visualizationType ? visualizationData.visualizationType.name : undefined
  );

  // Selected fields by user, categorized by field types
  const [fieldsSelection, setFieldsSelection] = useState<{
    numerical: VisColumn[];
    categorical: VisColumn[];
    date: VisColumn[];
  }>(
    visualizationData.visualizationType
      ? {
          numerical: visualizationData.numericalColumns ?? [],
          categorical: visualizationData.categoricalColumns ?? [],
          date: visualizationData.dateColumns ?? [],
        }
      : {
          numerical: [],
          categorical: [],
          date: [],
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
    text: col.name,
  });
  const allColumnOptions = useMemo(
    () =>
      [numericalColumns, categoricalColumns, dateColumns].map((columns) =>
        columns.map(convertToSelectOption)
      ),
    [numericalColumns, categoricalColumns, dateColumns]
  );
  const [numericalColumnOptions, categoricalColumnOptions, dateColumnOptions] = allColumnOptions;

  // Create base mapping once with all visualization rules
  const baseChartTypeMapping = useMemo(() => {
    return ALL_VISUALIZATION_RULES.reduce((acc, rule) => {
      rule.chartTypes.forEach(({ type, name }) => {
        if (!acc[type]) {
          acc[type] = { value: type, text: name, rules: [] };
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

  // Filter rules based on current selected columns
  const chartTypeMappedOptions = useMemo(() => {
    const filtered = Object.fromEntries(
      Object.entries(baseChartTypeMapping).map(([type, chartType]) => [
        type,
        {
          ...chartType,
          rules: chartType.rules.filter((rule) => {
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
          }),
        },
      ])
    );

    // Filter out chart types with empty rules
    return Object.fromEntries(
      Object.entries(filtered).filter(([_, chartType]) => chartType.rules.length > 0)
    );
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
    if (!currChartTypeId) return [];

    return chartTypeMappedOptions[currChartTypeId].rules.filter((rule) => {
      const [ruleNum, ruleCat, ruleDate] = rule.matchIndex || [0, 0, 0];
      const [currNum, currCat, currDate] = currFieldsCountByType;

      return ruleNum >= currNum && ruleCat >= currCat && ruleDate >= currDate;
    });
  }, [currChartTypeId, currFieldsCountByType, chartTypeMappedOptions]);

  const handleGeneration = useCallback(() => {
    // Update the visualizationData in the parent component
    if (setVisualizationData && originalVisualizationData.current) {
      const ruleToUse = availableRules.find((rule) =>
        isEqual(rule.matchIndex, currFieldsCountByType)
      );
      if (ruleToUse) {
        const visualizationType = visualizationRegistry.getVisualizationConfig(
          currChartTypeOption?.value!
        );
        dispatch(setStyleOptions(visualizationType.ui.style.defaults));
        dispatch(setChartType(visualizationType.type));

        setVisualizationData({
          ...originalVisualizationData.current,
          numericalColumns: fieldsSelection.numerical,
          categoricalColumns: fieldsSelection.categorical,
          dateColumns: fieldsSelection.date,
          ruleId: ruleToUse.id,
          visualizationType,
          toExpression: ruleToUse.toExpression,
        });
      }
    }
  }, [
    setVisualizationData,
    availableRules,
    currFieldsCountByType,
    fieldsSelection,
    visualizationRegistry,
    currChartTypeOption,
    dispatch,
  ]);

  useEffect(() => {
    if (
      currChartTypeOption &&
      shouldManuallyGenerate.current &&
      !isEqual(fieldsSelection, [0, 0, 0])
    ) {
      handleGeneration();
    }
  }, [currChartTypeOption, fieldsSelection, shouldManuallyGenerate, handleGeneration]);

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

  // Max number of the remainig possible selection for each field types base on current fields selection
  const matchIndexDifference = useMemo(() => {
    const [maxNum, maxCat, maxDate] = maxMatchIndex;
    const [currNum, currCat, currDate] = currFieldsCountByType;

    return [
      Math.max(0, maxNum - currNum),
      Math.max(0, maxCat - currCat),
      Math.max(0, maxDate - currDate),
    ];
  }, [maxMatchIndex, currFieldsCountByType]);

  const updateChartTypeSelection = (chartTypeId: string) => {
    shouldManuallyGenerate.current = true;

    setCurrChartTypeId(chartTypeId);
  };

  useEffect(() => {
    // Listern to the change of chart type, which will triggers maxMatchIndex chagnes
    maxMatchIndex.forEach((max, index) => {
      if (max < currFieldsCountByType[index]) {
        // Reset the fields selection when current selected fields are not suport with the
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
        [fieldTypeString]: [...prev[fieldTypeString], columnOption.column],
      }));
    },
    [allColumnOptions]
  );

  const removeFieldSelection = useCallback(
    (fieldTypeString: VisFieldTypeString, columnName: string) => {
      setFieldsSelection((prev) => ({
        ...prev,
        [fieldTypeString]: prev[fieldTypeString].filter((col) => col.name !== columnName),
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
        [fieldTypeString]: prev[fieldTypeString].map((col) =>
          col.name === oldColumnName ? newColumnOption.column : col
        ),
      }));
    },
    [allColumnOptions]
  );

  if (!visualizationData || !Boolean(Object.keys(chartTypeMappedOptions).length)) return null;

  return (
    <EuiFlexGroup direction="column" gutterSize="none">
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
          <EuiSelect
            id="chartType"
            hasNoInitialSelection
            value={currChartTypeId}
            options={Object.values(chartTypeMappedOptions)}
            onChange={(e) => {
              updateChartTypeSelection(e.target.value);
            }}
          />
        </EuiFormRow>
      </StyleAccordion>
      {currChartTypeId && (
        <StyleAccordion
          id="axisAndScalesSection"
          accordionLabel={i18n.translate('explore.stylePanel.tabs.axisAndScales', {
            defaultMessage: 'Axis & scales',
          })}
          initialIsOpen={true}
        >
          <>
            {Object.entries(fieldsSelection).map(([fieldTypeString, selectedColumns], index) => {
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
                            <React.Fragment key={selectedColumn.id}>
                              <EuiPanel grow={false} paddingSize="s">
                                <EuiFlexGroup
                                  gutterSize="none"
                                  alignItems="center"
                                  style={{ gap: 4 }}
                                >
                                  <EuiSelect
                                    value={selectedColumn.name}
                                    options={allColumnOptions[index].filter(
                                      // Filter out the fields already selected but keet the current one
                                      (col) => {
                                        const isCurrentColumn =
                                          col.column.name === selectedColumn.name;
                                        const isAlreadySelected = selectedColumns.some(
                                          (selected) => selected.name === col.column.name
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
                                    onChange={(e) => {
                                      replaceFieldSelection(
                                        fieldTypeString as VisFieldTypeString,
                                        index,
                                        selectedColumn.name,
                                        e.target.value
                                      );
                                    }}
                                  />
                                  <EuiButtonIcon
                                    onClick={() =>
                                      removeFieldSelection(
                                        fieldTypeString as VisFieldTypeString,
                                        selectedColumn.name
                                      )
                                    }
                                    iconType="trash"
                                    aria-label={`delete selected field ${selectedColumn.name}`}
                                  />
                                </EuiFlexGroup>
                              </EuiPanel>
                              <EuiSpacer size="xs" />
                            </React.Fragment>
                          );
                        })}
                      </>
                    </EuiFormRow>
                  )}
                  {canSelectMoreFields && (
                    <>
                      <EuiSelect
                        id={`${fieldTypeString}_field`}
                        hasNoInitialSelection
                        options={allColumnOptions[index].filter(
                          (col) =>
                            !selectedColumns.some((selected) => selected.name === col.column.name)
                        )}
                        onChange={(e) =>
                          updateFieldSelection(
                            fieldTypeString as VisFieldTypeString,
                            index,
                            e.target.value
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
      )}
    </EuiFlexGroup>
  );
};

// TODO make this a shared component
interface StyleAccordionProps {
  id: string;
  accordionLabel: React.ReactNode;
  initialIsOpen: boolean;
}

const StyleAccordion: React.FC<StyleAccordionProps> = ({
  id,
  accordionLabel,
  initialIsOpen,
  children,
}) => {
  return (
    <EuiPanel paddingSize="s" borderRadius="none" hasBorder={false} hasShadow={false}>
      <EuiAccordion
        id={id}
        buttonContent={
          <EuiText size="s" style={{ fontWeight: 600 }}>
            {accordionLabel}
          </EuiText>
        }
        initialIsOpen={initialIsOpen}
      >
        <EuiSpacer size="xs" />
        <EuiPanel paddingSize="s" hasBorder={false} color="subdued">
          {children}
        </EuiPanel>
      </EuiAccordion>
      <EuiHorizontalRule margin="xs" />{' '}
    </EuiPanel>
  );
};
