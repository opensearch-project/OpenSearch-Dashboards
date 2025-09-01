/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { i18n } from '@osd/i18n';
import { EuiFieldNumber, EuiFormRow, EuiSelect, EuiSwitch } from '@elastic/eui';
import { StyleControlsProps } from '../utils/use_visualization_types';
import { TableChartStyleControls } from './table_vis_config';
import { useDebouncedNumericValue } from '../utils/use_debounced_value';
import { StyleAccordion } from '../style_panel/style_accordion';

export type TableVisStyleControlsProps = StyleControlsProps<TableChartStyleControls>;

export const TableVisStyleControls: React.FC<TableVisStyleControlsProps> = ({
  styleOptions,
  onStyleChange,
  numericalColumns = [],
  categoricalColumns = [],
  dateColumns = [],
  axisColumnMappings,
  updateVisualization,
}) => {
  const updateStyleOption = useCallback(
    <K extends keyof TableChartStyleControls>(key: K, value: TableChartStyleControls[K]) => {
      onStyleChange({ [key]: value });
    },
    [onStyleChange]
  );

  const onPageSizeChange = useCallback(
    (value: number) => {
      updateStyleOption('pageSize', value);
    },
    [updateStyleOption]
  );

  const onGlobalAlignmentChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateStyleOption('globalAlignment', e.target.value as 'auto' | 'left' | 'center' | 'right');
    },
    [updateStyleOption]
  );

  const onShowColumnFilterChange = useCallback(
    (checked: boolean) => {
      updateStyleOption('showColumnFilter', checked);
    },
    [updateStyleOption]
  );

  const [localPageSize, handlePageSizeChange] = useDebouncedNumericValue(
    styleOptions.pageSize,
    onPageSizeChange
  );

  const alignmentOptions = [
    { value: 'auto', text: 'Auto' },
    { value: 'left', text: 'Left' },
    { value: 'center', text: 'Center' },
    { value: 'right', text: 'Right' },
  ];

  return (
    <StyleAccordion
      id="tableSection"
      accordionLabel={i18n.translate('explore.stylePanel.table.tableSection', {
        defaultMessage: 'Table',
      })}
      initialIsOpen={true}
      data-test-subj="visTable"
    >
      <EuiFormRow
        label={i18n.translate('explore.stylePanel.table.pageSize', {
          defaultMessage: 'Max rows per page',
        })}
      >
        <EuiFieldNumber
          compressed
          value={localPageSize}
          onChange={(e) => handlePageSizeChange(e.target.value)}
          data-test-subj="visTablePageSizeInput"
          min={1}
        />
      </EuiFormRow>
      <EuiFormRow
        label={i18n.translate('explore.stylePanel.table.globalAlignment', {
          defaultMessage: 'Cell alignment',
        })}
      >
        <EuiSelect
          compressed
          options={alignmentOptions}
          value={styleOptions.globalAlignment || 'auto'}
          onChange={onGlobalAlignmentChange}
          onMouseUp={(e) => e.stopPropagation()}
          data-test-subj="visTableGlobalAlignment"
        />
      </EuiFormRow>
      <EuiFormRow>
        <EuiSwitch
          compressed
          label={i18n.translate('explore.stylePanel.table.columnFilter', {
            defaultMessage: 'Column filters',
          })}
          checked={styleOptions.showColumnFilter || false}
          onChange={(e) => onShowColumnFilterChange(e.target.checked)}
          data-test-subj="visTableColumnFilter"
        />
      </EuiFormRow>
    </StyleAccordion>
  );
};
