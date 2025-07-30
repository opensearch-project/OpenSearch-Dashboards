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
import { ALL_VISUALIZATION_RULES } from '../../rule_repository';
import { ChartType, useVisualizationRegistry } from '../../utils/use_visualization_types';
import { StyleAccordion } from '../style_accordion';
import { getColumnMatchFromMapping } from '../../visualization_container_utils';

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
    defaultMessage: 'Split Chart By',
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

  const possibleMapping = useMemo(
    () => visualizationRegistry.getVisualizationConfig(chartType)?.ui.availableMappings!,
    [chartType, visualizationRegistry]
  );

  const columnsCount = useMemo(
    () => [numericalColumns.length, categoricalColumns.length, dateColumns.length],
    [numericalColumns.length, categoricalColumns.length, dateColumns.length]
  );

  // Filter out those mapping (combination of axes selection) that cannot be satisify
  // by the combination of fields from the query
  const availableMappingsFromQuery = useMemo(
    () =>
      possibleMapping
        .filter((obj) => {
          const [ruleNum, ruleCat, ruleDate] = getColumnMatchFromMapping(obj.mapping);
          const [currNum, currCat, currDate] = columnsCount;
          return ruleNum <= currNum && ruleCat <= currCat && ruleDate <= currDate;
        })
        .flatMap((selection) => selection.mapping),
    [columnsCount, possibleMapping]
  );

  // All available axes to be selected are base on current query
  const allAxisRolesFromQuery = new Set<AxisRole>();
  availableMappingsFromQuery.forEach((mapping) => {
    Object.keys(mapping).forEach((role) => allAxisRolesFromQuery.add(role as AxisRole));
  });

  const [currentSelections, setCurrentSelections] = useState<AxisColumnMappings>({});

  useEffect(() => {
    // This is an intentional design since we want to modify the mapping object from outside
    // to intermediately synchronize the internal state, but we don't want the internal state
    // change to also trigger changes in the state, resulting in an infinite loop.
    setCurrentSelections((prevCurrentSelections) =>
      isEqual(prevCurrentSelections, currentMapping) ? prevCurrentSelections : currentMapping
    );
  }, [currentMapping]);

  // Filter out those mapping (combination of axes selection) that no longer be satisify
  // by the current combination of axes selection
  const availableMappingsFromSelection = useMemo(
    () =>
      availableMappingsFromQuery.filter((mapping) => {
        return Object.entries(currentSelections).every(([role, selectedCol]) => {
          if (!selectedCol) return true;
          const mappingRole = (mapping as any)[role];
          return mappingRole && mappingRole.type === selectedCol.schema;
        });
      }),
    [availableMappingsFromQuery, currentSelections]
  );

  // Only displays axis select component base on current selection
  const allAxisRolesFromSelection = new Set<AxisRole>();
  availableMappingsFromSelection.forEach((mapping) => {
    Object.keys(mapping).forEach((role) => allAxisRolesFromSelection.add(role as AxisRole));
  });

  // The one and only one valid mapping base on current selection, will be undefined if current
  // selection is invalid
  const currentValidSelection = useMemo(() => {
    const selectedCount = Object.values(currentSelections).filter(Boolean).length;
    const mapping = availableMappingsFromSelection.find(
      (m) => Object.keys(m).length === selectedCount
    );
    if (!mapping) return undefined;
    const possibleSelection = possibleMapping.find((selection) =>
      selection.mapping.includes(mapping as any)
    );
    return possibleSelection
      ? { mapping, columnMatch: getColumnMatchFromMapping(possibleSelection.mapping) }
      : undefined;
  }, [availableMappingsFromSelection, currentSelections, possibleMapping]);

  useEffect(() => {
    if (currentValidSelection) {
      const ruleToUse = ALL_VISUALIZATION_RULES.find((rule) =>
        isEqual(rule.matchIndex, currentValidSelection.columnMatch)
      );

      if (ruleToUse) {
        const updatedAxes: AxisColumnMappings = {};
        Object.entries(currentSelections).forEach(([key, value]) => {
          if (value) {
            updatedAxes[key as AxisRole] = value;
          }
        });

        updateVisualization({ rule: ruleToUse, mappings: updatedAxes });
      }
    }
  }, [currentValidSelection, updateVisualization, currentSelections]);

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

  if (availableMappingsFromQuery.length === 0) {
    return null;
  }

  const getAvailableColumnsForAxis = (axisRole: AxisRole) => {
    const availableTypes = new Set<VisFieldType>();

    // Get types from current valid mappings
    availableMappingsFromSelection.forEach((mapping) => {
      if ((mapping as any)[axisRole]) {
        availableTypes.add((mapping as any)[axisRole].type);
      }
    });

    // Get types from mappings that would become available if we change this axis
    availableMappingsFromQuery.forEach((mapping) => {
      const otherSelections = Object.entries(currentSelections).filter(
        ([role]) => role !== axisRole
      );
      const isCompatible = otherSelections.every(([role, selectedCol]) => {
        if (!selectedCol) return true;
        const mappingRole = (mapping as any)[role];
        return mappingRole && mappingRole.type === selectedCol.schema;
      });

      if (isCompatible && (mapping as any)[axisRole]) {
        availableTypes.add((mapping as any)[axisRole].type);
      }
    });

    const allColumns: Array<EuiComboBoxOptionOption<VisColumnOption>> = [];
    availableTypes.forEach((type) => {
      allColumns.push({
        isGroupLabelOption: true,
        label: `${type.charAt(0).toUpperCase() + type.slice(1)} Fields`, // FIXME
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
              allColumnOptions={getAvailableColumnsForAxis(axisRole)}
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
