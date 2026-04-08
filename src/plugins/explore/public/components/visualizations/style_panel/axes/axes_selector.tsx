/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  EuiSpacer,
  EuiFormRow,
  EuiFlexItem,
  EuiComboBox,
  EuiComboBoxOptionOption,
  EuiSwitch,
} from '@elastic/eui';
import { isEmpty, isEqual } from 'lodash';
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

interface VisColumnOption {
  column: VisColumn;
  label: string;
}

interface AxesSelectPanelProps {
  chartType: ChartType;
  numericalColumns: VisColumn[];
  categoricalColumns: VisColumn[];
  dateColumns: VisColumn[];
  currentMapping: AxisColumnMappings;
  updateVisualization: (data: UpdateVisualizationProps) => void;
  onSwitchAxes?: (v: boolean) => void;
  switchAxes?: boolean;
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

export const AxesSelectPanel: React.FC<AxesSelectPanelProps> = ({
  chartType,
  numericalColumns,
  categoricalColumns,
  dateColumns,
  currentMapping,
  updateVisualization,
  onSwitchAxes,
  switchAxes,
}) => {
  const visualizationRegistry = useVisualizationRegistry();
  const firstSelectorInput = useRef<HTMLInputElement | undefined>(undefined);
  const [currentSelections, setCurrentSelections] = useState<AxisColumnMappings>({});

  // switchAxes only support heatmap scatter and bar
  const showSwitch = chartType === 'heatmap' || chartType === 'bar' || chartType === 'scatter';

  const swapAxes = () => {
    if (showSwitch && onSwitchAxes) {
      onSwitchAxes(!switchAxes);
    }
  };

  useEffect(() => {
    // Make sure to initially focus on first axis field selector if current field selection is empty
    if (isEmpty(currentMapping)) {
      setTimeout(() => {
        if (firstSelectorInput.current) {
          firstSelectorInput.current.focus();
        }
      }, 500);
    }
  }, [currentMapping]);

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
          if (!selectedCol) return true;
          const mappingRole = mapping[role as AxisRole];
          return mappingRole && mappingRole.type === selectedCol.schema;
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
      if (value) {
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
      updateVisualization({ mappings: normalizedAxesSelections });
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

  const getFieldTypeLabel = (type: VisFieldType) => {
    switch (type) {
      case VisFieldType.Categorical:
        return i18n.translate('explore.stylePanel.fieldType.categorical', {
          defaultMessage: 'Categorical fields',
        });
      case VisFieldType.Date:
        return i18n.translate('explore.stylePanel.fieldType.date', {
          defaultMessage: 'Date fields',
        });
      default:
        return i18n.translate('explore.stylePanel.fieldType.numerical', {
          defaultMessage: 'Numerical fields',
        });
    }
  };

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
        if (!selectedCol) return true;
        const mappingRole = mapping[role as AxisRole];
        return mappingRole && mappingRole.type === selectedCol.schema;
      });

      const roleColumn = mapping[axisRole];
      if (isCompatible && roleColumn) {
        availableTypes.add(roleColumn.type);
      }
    });

    const allColumns: Array<EuiComboBoxOptionOption<VisColumnOption>> = [];
    availableTypes.forEach((type) => {
      allColumns.push({
        isGroupLabelOption: true,
        label: getFieldTypeLabel(type),
        options: findColumns(type).map((col) => ({
          column: col,
          label: col.name,
        })),
      });
    });

    return allColumns;
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
        {showSwitch && (
          <EuiFormRow>
            <EuiSwitch
              label={i18n.translate('explore.vis.axesSwitch.switchAxes', {
                defaultMessage: 'Switch axes',
              })}
              compressed
              checked={!!switchAxes}
              onChange={swapAxes}
              disabled={!currentSelections[AxisRole.X] || !currentSelections[AxisRole.Y]}
            />
          </EuiFormRow>
        )}

        {Array.from(allAxisRolesFromSelection).map((axisRole, i) => {
          const currentSelection = currentSelections[axisRole];
          return (
            <AxisSelector
              key={axisRole}
              axisRole={axisRole}
              selectedColumn={currentSelection?.name || ''}
              allColumnOptions={getAxisOptions(axisRole)}
              switchAxes={switchAxes}
              inputRef={(input) => (i === 0 ? (firstSelectorInput.current = input) : undefined)}
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
                  [role]: selectedCol,
                }));
              }}
            />
          );
        })}
      </>
    </StyleAccordion>
  );
};

interface AxesSelectorOptions {
  axisRole: AxisRole;
  selectedColumn: string;
  allColumnOptions: Array<EuiComboBoxOptionOption<VisColumnOption>>;
  onRemove: (axisRole: AxisRole) => void;
  onChange: (axisRole: AxisRole, value: string) => void;
  switchAxes?: boolean;
  autoFocus?: boolean;
  inputRef?: (instance: HTMLInputElement) => void;
}

export const AxisSelector: React.FC<AxesSelectorOptions> = ({
  axisRole,
  selectedColumn,
  allColumnOptions,
  onRemove,
  onChange,
  switchAxes,
  inputRef,
}) => {
  const getLabel = () => {
    if (switchAxes && (axisRole === AxisRole.X || axisRole === AxisRole.Y)) {
      const swappedRole = axisRole === AxisRole.X ? AxisRole.Y : AxisRole.X;
      return AXIS_SELECT_LABEL[swappedRole];
    }

    return AXIS_SELECT_LABEL[axisRole];
  };

  return (
    <React.Fragment key={`${axisRole}Selector`}>
      <EuiFormRow label={getLabel()}>
        <EuiFlexItem>
          <EuiComboBox
            data-test-subj={`field-${axisRole}`}
            compressed
            inputRef={inputRef}
            selectedOptions={[{ label: selectedColumn }]}
            singleSelection={{ asPlainText: true }}
            options={allColumnOptions}
            onChange={(value) => {
              if (Boolean(value.length)) {
                onChange(axisRole, value[0].label);
              } else {
                onRemove(axisRole);
              }
            }}
          />
        </EuiFlexItem>
      </EuiFormRow>
      <EuiSpacer size="xs" />
    </React.Fragment>
  );
};
