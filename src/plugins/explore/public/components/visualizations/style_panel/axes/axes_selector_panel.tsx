/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { EuiFormRow, EuiComboBoxOptionOption, EuiSwitch } from '@elastic/eui';
import { isEmpty, isEqual } from 'lodash';
import { i18n } from '@osd/i18n';
import { AxisColumnMappings, AxisRole, VisColumn, VisFieldType } from '../../types';
import { ChartType, useVisualizationRegistry } from '../../utils/use_visualization_types';
import { StyleAccordion } from '../style_accordion';
import { getColumnMatchFromMapping } from '../../visualization_builder_utils';
import { AxisSelector } from './axes_selector';

interface VisColumnOption {
  column: VisColumn;
  label: string;
}

interface AxesSelectPanelProps {
  chartType: ChartType;
  numericalColumns: VisColumn[];
  categoricalColumns: VisColumn[];
  dateColumns: VisColumn[];
  currentMapping?: Record<string, string>;
  updateVisualization: (data: { mappings: Record<string, string> }) => void;
  onSwitchAxes?: (v: boolean) => void;
  switchAxes?: boolean;
}

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

  // All axis mappings of the selected chart type
  const allMappings = useMemo(
    () => visualizationRegistry.getVisualizationConfig(chartType)?.ui.availableMappings,
    [chartType, visualizationRegistry]
  );

  // Filter available chart mappings based on the data's column types
  // This ensures we only show mappings that are compatible with the current dataset structure
  const availableMappings = useMemo(() => {
    if (!allMappings) {
      return [];
    }

    return allMappings.filter((mapping) => {
      const [ruleNum, ruleCat, ruleDate] = getColumnMatchFromMapping(mapping);
      const currNum = numericalColumns.length;
      const currCat = categoricalColumns.length;
      const currDate = dateColumns.length;
      return ruleNum <= currNum && ruleCat <= currCat && ruleDate <= currDate;
    });
  }, [numericalColumns.length, categoricalColumns.length, dateColumns.length, allMappings]);

  const [currentSelections, setCurrentSelections] = useState<AxisColumnMappings>({});

  useEffect(() => {
    const currentAxisColumnMapping: AxisColumnMappings = {};
    Object.entries(currentMapping ?? {}).forEach(([key, value]) => {
      const visColumn = [...numericalColumns, ...categoricalColumns, ...dateColumns].find(
        (c) => c.name === value
      );
      currentAxisColumnMapping[key as AxisRole] = visColumn;
    });
    // This is an intentional design since we want to modify the mapping object from outside
    // to intermediately synchronize the internal state, but we don't want the internal state
    // change to also trigger changes in the state, resulting in an infinite loop.
    setCurrentSelections((prevCurrentSelections) =>
      isEqual(prevCurrentSelections, currentAxisColumnMapping)
        ? prevCurrentSelections
        : currentAxisColumnMapping
    );
  }, [categoricalColumns, currentMapping, dateColumns, numericalColumns]);

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

  const onAxesMappingChange = useCallback(
    (role: AxisRole, v: string | undefined) => {
      const allColumns = [...numericalColumns, ...categoricalColumns, ...dateColumns];
      const selectedCol = allColumns.find((col) => col.name === v);
      const updatedSelections = { ...currentSelections, [role]: selectedCol };
      setCurrentSelections(updatedSelections);

      // Current selected axis mapping excludes empty value
      const finalAxisColumnMappings: AxisColumnMappings = {};
      const updatedAxesMapping: Record<string, string> = {};
      Object.entries(updatedSelections).forEach(([key, value]) => {
        if (value) {
          finalAxisColumnMappings[key as AxisRole] = value;
          updatedAxesMapping[key] = value.name;
        }
      });

      // Find the mapping based on current selected axis mapping, if found, then current selection is valid
      const found = availableMappings.find((m) => {
        if (Object.keys(m).length === Object.keys(finalAxisColumnMappings).length) {
          return Object.keys(m).every(
            (key) => m[key as AxisRole]?.type === finalAxisColumnMappings[key as AxisRole]?.schema
          );
        }
        return false;
      });

      if (found) {
        // Find a vis rule for the current mapping
        const ruleToUse = visualizationRegistry.findRuleByAxesMapping(
          Object.fromEntries(
            Object.entries(updatedSelections)
              .filter(([, value]) => !!value)
              .map(([key, value]) => [key, value.name])
          ),
          [...numericalColumns, ...categoricalColumns, ...dateColumns]
        );
        // If rule can be found, update visualization with the new axes mapping
        // Limitation: the current implementation will only call updateVisualization() when the select
        // mapping is valid and has rule mapped, which means partial selections won't trigger visualization
        // updates until they form a complete valid mapping configuration.
        // From the user's perspective, this means no visual feedback is provided during the selection
        // process until a complete valid configuration is achieved, potentially leading to confusion
        // about whether their partial selections are having any effect.
        if (ruleToUse && !isEqual(updatedAxesMapping, currentMapping)) {
          updateVisualization({ mappings: updatedAxesMapping });
        }
      }
    },
    [
      numericalColumns,
      categoricalColumns,
      dateColumns,
      currentSelections,
      availableMappings,
      visualizationRegistry,
      currentMapping,
      updateVisualization,
    ]
  );

  const findColumns = (type: VisFieldType) => {
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
  };

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
              onRemove={(role) => onAxesMappingChange(role, undefined)}
              onChange={onAxesMappingChange}
            />
          );
        })}
      </>
    </StyleAccordion>
  );
};
