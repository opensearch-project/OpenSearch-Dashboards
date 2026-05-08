/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { EuiSpacer, EuiFormRow, EuiSelectableOption } from '@elastic/eui';
import { isEqual } from 'lodash';
import { i18n } from '@osd/i18n';
import { AxisColumnMappings, AxisRole, VisColumn, VisFieldType } from '../../types';
import { UpdateVisualizationProps } from '../../visualization_container';
import {
  AxisTypeMapping,
  ChartType,
  useVisualizationRegistry,
} from '../../utils/use_visualization_types';
import { StyleAccordion } from '../style_accordion';
import { convertMappingsToStrings } from '../../visualization_builder_utils';
import { AxisSelector } from './axis_selector';

interface AxesSelectPanelProps {
  chartType: ChartType;
  numericalColumns: VisColumn[];
  categoricalColumns: VisColumn[];
  dateColumns: VisColumn[];
  currentMapping: AxisColumnMappings;
  updateVisualization: (data: UpdateVisualizationProps) => void;
}

const AXIS_SELECT_LABEL = {
  [AxisRole.X]: i18n.translate('explore.visualize.axisSelectLabelX', {
    defaultMessage: 'X-Axis',
  }),
  [AxisRole.Y]: i18n.translate('explore.visualize.axisSelectLabelY', {
    defaultMessage: 'Y-Axis',
  }),
  [AxisRole.COLOR]: i18n.translate('explore.visualize.axisSelectLabelColor', {
    defaultMessage: 'Color',
  }),
  [AxisRole.FACET]: i18n.translate('explore.visualize.axisSelectLabelFacet', {
    defaultMessage: 'Split chart by',
  }),
  [AxisRole.SIZE]: i18n.translate('explore.visualize.axisSelectLabelSize', {
    defaultMessage: 'Size',
  }),
  [AxisRole.Y_SECOND]: i18n.translate('explore.visualize.axisSelectLabelY2nd', {
    defaultMessage: 'Y-Axis (2nd)',
  }),
  [AxisRole.Value]: i18n.translate('explore.visualize.axisSelectLabelValue', {
    defaultMessage: 'Value',
  }),
  [AxisRole.Time]: i18n.translate('explore.visualize.axisSelectLabelTime', {
    defaultMessage: 'Time',
  }),
};

const getAxisLabel = (axisRole: AxisRole): string => {
  return AXIS_SELECT_LABEL[axisRole];
};

const isMultiAxis = (axisRole: AxisRole, mappings: AxisTypeMapping[]): boolean =>
  mappings.some((mapping) => mapping[axisRole]?.multi === true);

export const AxesSelectPanel: React.FC<AxesSelectPanelProps> = ({
  chartType,
  numericalColumns,
  categoricalColumns,
  dateColumns,
  currentMapping,
  updateVisualization,
}) => {
  const visualizationRegistry = useVisualizationRegistry();
  const [currentSelections, setCurrentSelections] = useState<AxisColumnMappings>({});

  // Filter available chart mappings based on the data's column types
  // This ensures we only show mappings that are compatible with the current dataset structure
  const availableMappings = useMemo(() => {
    const mappings: AxisTypeMapping[] = [];
    const ruleMatch = visualizationRegistry.findRulesByColumns(
      numericalColumns,
      categoricalColumns,
      dateColumns,
      chartType
    );

    ruleMatch.all.forEach((match) => {
      match.rules.forEach((rule) => {
        mappings.push(...rule.mappings);
      });
    });
    return mappings;
  }, [categoricalColumns, chartType, dateColumns, numericalColumns, visualizationRegistry]);

  useEffect(() => {
    // This is an intentional design since we want to modify the mapping object from outside
    // to intermediately synchronize the internal state, but we don't want the internal state
    // change to also trigger changes in the state, resulting in an infinite loop.
    setCurrentSelections((prevCurrentSelections) =>
      isEqual(prevCurrentSelections, currentMapping) ? prevCurrentSelections : currentMapping
    );
  }, [currentMapping]);

  // Further filter mappings to only include those that are compatible with the user's current axis selections
  // This ensures that as users make axis choices, we only show mappings that would work with those choices
  const remainingMappings = useMemo(
    () =>
      availableMappings.filter((mapping) => {
        return Object.entries(currentSelections).every(([role, selectedCol]) => {
          if (!selectedCol || selectedCol.length === 0) return true;
          const mappingRole = mapping[role as AxisRole];
          if (!mappingRole) return false;
          if (mappingRole.type !== selectedCol[0]?.schema) return false;
          // If multiple columns are selected, the mapping must support multi
          if (selectedCol.length > 1 && !mappingRole.multi) return false;
          return true;
        });
      }),
    [availableMappings, currentSelections]
  );

  // Only displays axis select component base on current selection
  const allAxisRolesFromSelection = new Set<AxisRole>();
  remainingMappings.forEach((mapping) => {
    Object.keys(mapping).forEach((role) => allAxisRolesFromSelection.add(role as AxisRole));
  });

  useEffect(() => {
    // Current selected axis mapping
    const normalizedAxesSelections: AxisColumnMappings = {};
    Object.entries(currentSelections).forEach(([key, value]) => {
      if (value && value.length > 0) {
        normalizedAxesSelections[key as AxisRole] = value;
      }
    });
    const ruleToUse = visualizationRegistry.findRuleByAxesMapping(
      chartType,
      convertMappingsToStrings(normalizedAxesSelections),
      [...numericalColumns, ...categoricalColumns, ...dateColumns]
    );

    // If rule can be found, update visualization with the new axes mapping
    // Limitation: the current implementation will only call updateVisualization() when the select
    // mapping is valid and has rule mapped, which means partial selections won't trigger visualization
    // updates until they form a complete valid mapping configuration.
    // From the user's perspective, this means no visual feedback is provided during the selection
    // process until a complete valid configuration is achieved, potentially leading to confusion
    // about whether their partial selections are having any effect.
    if (ruleToUse) {
      updateVisualization({ mappings: convertMappingsToStrings(normalizedAxesSelections) });
    }
  }, [
    updateVisualization,
    currentSelections,
    remainingMappings,
    visualizationRegistry,
    numericalColumns,
    categoricalColumns,
    dateColumns,
    chartType,
  ]);

  const findColumns = useMemo(
    () => (type: VisFieldType) => {
      switch (type) {
        case VisFieldType.Numerical:
          return numericalColumns;
        case VisFieldType.Categorical:
          return categoricalColumns;
        case VisFieldType.Date:
          return dateColumns;
        default:
          return [];
      }
    },
    [numericalColumns, categoricalColumns, dateColumns]
  );

  if (availableMappings.length === 0) {
    return null;
  }

  const getAxisOptions = (axisRole: AxisRole) => {
    const availableTypes = new Set<VisFieldType>();

    // Get types from current valid mappings
    remainingMappings.forEach((mapping) => {
      const roleColumn = mapping[axisRole];
      if (roleColumn) {
        availableTypes.add(roleColumn.type);
      }
    });

    // Get types from mappings that would become available if we change this axis
    availableMappings.forEach((mapping) => {
      const otherSelections = Object.entries(currentSelections).filter(
        ([role]) => role !== axisRole
      );
      const isCompatible = otherSelections.every(([role, selectedCol]) => {
        if (!selectedCol || selectedCol.length === 0) return true;
        const mappingRole = mapping[role as AxisRole];
        if (!mappingRole) return false;
        if (mappingRole.type !== selectedCol[0]?.schema) return false;
        // If multiple columns are selected, the mapping must support multi
        if (selectedCol.length > 1 && !mappingRole.multi) return false;
        return true;
      });

      const roleColumn = mapping[axisRole];
      if (isCompatible && roleColumn) {
        availableTypes.add(roleColumn.type);
      }
    });

    const selectedNames = new Set((currentSelections[axisRole] ?? []).map((col) => col.name));
    const allOptions: Array<EuiSelectableOption & { schema?: VisFieldType }> = [];
    availableTypes.forEach((type) => {
      findColumns(type).forEach((col) => {
        if (!selectedNames.has(col.name)) {
          allOptions.push({ label: col.name, schema: col.schema });
        }
      });
    });

    return allOptions;
  };

  return (
    <StyleAccordion
      id="axesSelector"
      accordionLabel={i18n.translate('explore.stylePanel.tabs.fields', {
        defaultMessage: 'Fields',
      })}
      initialIsOpen={true}
    >
      <>
        {Array.from(allAxisRolesFromSelection).map((axisRole) => {
          const currentSelection = currentSelections[axisRole] ?? [];
          const label = getAxisLabel(axisRole);
          const multi = isMultiAxis(axisRole, remainingMappings);

          if (multi) {
            return (
              <React.Fragment key={axisRole}>
                {currentSelection.map((col, index) => (
                  <React.Fragment key={`${axisRole}-${index}`}>
                    <EuiFormRow
                      label={index === 0 ? label : ''}
                      data-test-subj={`field-${axisRole}`}
                    >
                      <AxisSelector
                        axisRole={axisRole}
                        value={col.name}
                        options={getAxisOptions(axisRole)}
                        onRemove={() => {
                          setCurrentSelections((prev) => {
                            const updated = [...(prev[axisRole] ?? [])];
                            updated.splice(index, 1);
                            return {
                              ...prev,
                              [axisRole]: updated.length > 0 ? updated : undefined,
                            };
                          });
                        }}
                        onChange={(_role, v) => {
                          const allColumns = [
                            ...numericalColumns,
                            ...categoricalColumns,
                            ...dateColumns,
                          ];
                          const selectedCol = allColumns.find((c) => c.name === v);
                          if (selectedCol) {
                            setCurrentSelections((prev) => {
                              const updated = [...(prev[axisRole] ?? [])];
                              updated[index] = selectedCol;
                              return { ...prev, [axisRole]: updated };
                            });
                          }
                        }}
                      />
                    </EuiFormRow>
                    <EuiSpacer size="xs" />
                  </React.Fragment>
                ))}
                <EuiFormRow
                  label={currentSelection.length === 0 ? label : ''}
                  data-test-subj={`field-${axisRole}`}
                >
                  <AxisSelector
                    axisRole={axisRole}
                    value=""
                    options={getAxisOptions(axisRole)}
                    onRemove={() => {}}
                    onChange={(_role, v) => {
                      const allColumns = [
                        ...numericalColumns,
                        ...categoricalColumns,
                        ...dateColumns,
                      ];
                      const selectedCol = allColumns.find((c) => c.name === v);
                      if (selectedCol) {
                        setCurrentSelections((prev) => ({
                          ...prev,
                          [axisRole]: [...(prev[axisRole] ?? []), selectedCol],
                        }));
                      }
                    }}
                  />
                </EuiFormRow>
                <EuiSpacer size="xs" />
              </React.Fragment>
            );
          }

          return (
            <React.Fragment key={axisRole}>
              <EuiFormRow label={label} data-test-subj={`field-${axisRole}`}>
                <AxisSelector
                  axisRole={axisRole}
                  value={currentSelection[0]?.name || ''}
                  options={getAxisOptions(axisRole)}
                  onRemove={(role) => {
                    setCurrentSelections((prev) => ({
                      ...prev,
                      [role]: undefined,
                    }));
                  }}
                  onChange={(role, v) => {
                    const allColumns = [...numericalColumns, ...categoricalColumns, ...dateColumns];
                    const selectedCol = allColumns.find((col) => col.name === v);
                    setCurrentSelections((prev) => ({
                      ...prev,
                      [role]: selectedCol ? [selectedCol] : undefined,
                    }));
                  }}
                />
              </EuiFormRow>
              <EuiSpacer size="xs" />
            </React.Fragment>
          );
        })}
      </>
    </StyleAccordion>
  );
};
