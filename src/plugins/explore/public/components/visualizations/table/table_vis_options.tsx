/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { i18n } from '@osd/i18n';
import { EuiFlexGroup, EuiFlexItem, EuiFormRow, EuiSelect, EuiSwitch } from '@elastic/eui';
import { StyleControlsProps } from '../utils/use_visualization_types';
import { StyleAccordion } from '../style_panel/style_accordion';
import { TableFooterOptions } from './table_vis_footer_options';
import { CellAlignment, Threshold } from '../types';
import { ThresholdCustomValues } from '../style_panel/threshold/threshold_custom_values';
import { TableCellTypeOptions } from './table_cell_type_options';
import { defaultTableChartStyles, TableChartStyleControls } from './table_vis_config';
import { DebouncedFieldNumber } from '../style_panel/utils';

export type TableVisStyleControlsProps = StyleControlsProps<TableChartStyleControls>;

const alignmentOptions = [
  { value: 'auto', text: 'Auto' },
  { value: 'left', text: 'Left' },
  { value: 'center', text: 'Center' },
  { value: 'right', text: 'Right' },
];

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
    (value?: number) => {
      updateStyleOption('pageSize', value);
    },
    [updateStyleOption]
  );

  const onGlobalAlignmentChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateStyleOption('globalAlignment', e.target.value as CellAlignment);
    },
    [updateStyleOption]
  );

  const onShowColumnFilterChange = useCallback(
    (checked: boolean) => {
      updateStyleOption('showColumnFilter', checked);
    },
    [updateStyleOption]
  );

  const onThresholdsChange = useCallback(
    (thresholds: Threshold[]) => {
      updateStyleOption('thresholds', thresholds);
    },
    [updateStyleOption]
  );

  const onBaseColorChange = useCallback(
    (color: string) => {
      updateStyleOption('baseColor', color);
    },
    [updateStyleOption]
  );

  return (
    <EuiFlexGroup direction="column" gutterSize="none">
      <EuiFlexItem>
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
            <DebouncedFieldNumber
              compressed
              placeholder={i18n.translate('explore.stylePanel.table.pageSize.placeholder', {
                defaultMessage: 'Default {value}',
                values: { value: defaultTableChartStyles.pageSize },
              })}
              value={styleOptions.pageSize}
              onChange={(val) => onPageSizeChange(val)}
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
          <EuiFormRow
            label={i18n.translate('explore.stylePanel.table.cellTypes', {
              defaultMessage: 'Cell types',
            })}
          >
            <TableCellTypeOptions
              styleOptions={styleOptions}
              onStyleChange={onStyleChange}
              numericalColumns={numericalColumns}
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
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <StyleAccordion
          id="thresholdSection"
          accordionLabel={i18n.translate('explore.stylePanel.table.threshold', {
            defaultMessage: 'Threshold',
          })}
          initialIsOpen={true}
        >
          <ThresholdCustomValues
            thresholds={styleOptions.thresholds || []}
            onThresholdValuesChange={onThresholdsChange}
            baseColor={styleOptions.baseColor || '#000000'}
            onBaseColorChange={onBaseColorChange}
          />
        </StyleAccordion>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <TableFooterOptions
          styleOptions={styleOptions}
          onStyleChange={onStyleChange}
          numericalColumns={numericalColumns}
          categoricalColumns={categoricalColumns}
          dateColumns={dateColumns}
          axisColumnMappings={axisColumnMappings}
          updateVisualization={updateVisualization}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
