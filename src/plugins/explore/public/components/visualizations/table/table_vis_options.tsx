/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { i18n } from '@osd/i18n';
import { EuiFieldNumber, EuiFlexGroup, EuiFlexItem, EuiFormRow } from '@elastic/eui';
import { StyleControlsProps } from '../utils/use_visualization_types';
import { TableChartStyleControls } from './table_vis_config';
import { useDebouncedNumericValue } from '../utils/use_debounced_value';

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

  const [localPageSize, handlePageSizeChange] = useDebouncedNumericValue(
    styleOptions.pageSize,
    onPageSizeChange
  );

  return (
    <EuiFlexGroup direction="column" gutterSize="none">
      <EuiFlexItem grow={false}>
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
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
