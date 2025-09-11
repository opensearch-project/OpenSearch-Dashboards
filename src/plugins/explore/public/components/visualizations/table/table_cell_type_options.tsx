/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo } from 'react';
import {
  EuiButton,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiSelect,
} from '@elastic/eui';
import { CellTypeConfig, TableChartStyleControls } from './table_vis_config';
import { StyleControlsProps } from '../utils/use_visualization_types';
import { ColorMode, VisColumn } from '../types';

export interface TableCellTypeOptionsProps {
  styleOptions: TableChartStyleControls;
  onStyleChange: (newStyle: Partial<TableChartStyleControls>) => void;
  numericalColumns?: VisColumn[];
  axisColumnMappings?: StyleControlsProps<TableChartStyleControls>['axisColumnMappings'];
  updateVisualization?: StyleControlsProps<TableChartStyleControls>['updateVisualization'];
}

const cellTypeOptions = [
  { value: 'auto', text: 'Default' },
  { value: 'colored_text', text: 'Colored Text' },
  { value: 'colored_background', text: 'Colored Background' },
];

export const TableCellTypeOptions: React.FC<TableCellTypeOptionsProps> = ({
  styleOptions,
  onStyleChange,
  numericalColumns = [],
}) => {
  const currentCellTypes: CellTypeConfig[] = useMemo(() => styleOptions.cellTypes || [], [
    styleOptions.cellTypes,
  ]);

  const handleCellTypeFieldChange = useCallback(
    (index: number, value: string) => {
      const newCellTypes = [...currentCellTypes];
      const isValidField = numericalColumns.some((col) => col.column === value);
      newCellTypes[index] = {
        ...newCellTypes[index],
        field: isValidField ? value : '',
      };
      onStyleChange({ cellTypes: newCellTypes });
    },
    [currentCellTypes, onStyleChange, numericalColumns]
  );

  const handleCellTypeModeChange = useCallback(
    (index: number, value: string) => {
      const newCellTypes = [...currentCellTypes];
      newCellTypes[index] = {
        ...newCellTypes[index],
        type: value as ColorMode,
      };
      onStyleChange({ cellTypes: newCellTypes });
    },
    [currentCellTypes, onStyleChange]
  );

  const handleRemoveCellType = useCallback(
    (index: number) => {
      const newCellTypes = currentCellTypes.filter((_, i) => i !== index);
      onStyleChange({ cellTypes: newCellTypes });
    },
    [currentCellTypes, onStyleChange]
  );

  const handleAddCellType = useCallback(() => {
    const newCellTypes: CellTypeConfig[] = [
      ...currentCellTypes,
      { field: '', type: 'auto' } as CellTypeConfig,
    ];
    onStyleChange({ cellTypes: newCellTypes });
  }, [currentCellTypes, onStyleChange]);

  const selectedFields = currentCellTypes.map((ct) => ct.field).filter((field) => field !== '');

  const getFieldOptions = (cellType: CellTypeConfig, index: number) => {
    const otherSelectedFields = currentCellTypes
      .filter((_, i) => i !== index)
      .map((ct) => ct.field)
      .filter((field) => field !== '');

    const availableFields = numericalColumns.filter(
      (col) => !otherSelectedFields.includes(col.column)
    );

    return [
      { value: '', text: 'Select a field' },
      ...availableFields.map((col) => ({
        value: col.column,
        text: col.name || col.column,
      })),
    ];
  };

  return (
    <>
      {currentCellTypes.map((ct, index) => (
        <EuiFormRow key={index}>
          <EuiFlexGroup gutterSize="s" alignItems="center">
            <EuiFlexItem>
              <EuiSelect
                compressed
                options={getFieldOptions(ct, index)}
                value={ct.field}
                onChange={(e) => handleCellTypeFieldChange(index, e.target.value)}
                data-test-subj={`visTableCellTypeField${index}`}
              />
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiSelect
                compressed
                options={cellTypeOptions}
                value={ct.type}
                onChange={(e) => handleCellTypeModeChange(index, e.target.value)}
                onMouseUp={(e) => e.stopPropagation()}
                data-test-subj={`visTableCellTypeMode${index}`}
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonIcon
                iconType="trash"
                color="danger"
                onClick={() => handleRemoveCellType(index)}
                aria-label="Remove cell type"
                data-test-subj={`visTableRemoveCellType${index}`}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFormRow>
      ))}
      {numericalColumns.length > selectedFields.length && (
        <EuiFormRow>
          <EuiButton size="s" onClick={handleAddCellType} data-test-subj="visTableAddCellType">
            Add new cell type
          </EuiButton>
        </EuiFormRow>
      )}
    </>
  );
};
