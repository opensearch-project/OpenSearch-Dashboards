/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiFieldNumber,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiSelect,
  EuiSwitch,
} from '@elastic/eui';
import { StyleControlsProps } from '../utils/use_visualization_types';
import { TableChartStyleControls } from './table_vis_config';
import { useDebouncedNumericValue } from '../utils/use_debounced_value';
import { StyleAccordion } from '../style_panel/style_accordion';
import { TableFooterStyleControls } from './table_vis_footer';
import { Threshold } from '../types';
import { ThresholdCustomValues } from '../style_panel/threshold/threshold_custom_values';

export type TableVisStyleControlsProps = StyleControlsProps<TableChartStyleControls>;

const alignmentOptions = [
  { value: 'auto', text: 'Auto' },
  { value: 'left', text: 'Left' },
  { value: 'center', text: 'Center' },
  { value: 'right', text: 'Right' },
];

const cellTypeOptions = [
  { value: 'auto', text: 'Default (Black Text)' },
  { value: 'colored_text', text: 'Colored Text' },
  { value: 'colored_background', text: 'Colored Background' },
];

const CustomThresholdPanel: React.FC<{
  thresholds: Threshold[];
  onThresholdValuesChange: (thresholds: Threshold[]) => void;
  baseColor: string;
  onBaseColorChange: (color: string) => void;
}> = ({ thresholds, onThresholdValuesChange, baseColor, onBaseColorChange }) => {
  return (
    <StyleAccordion
      id="thresholdSection"
      accordionLabel={i18n.translate('explore.stylePanel.table.threshold', {
        defaultMessage: 'Threshold',
      })}
      initialIsOpen={true}
    >
      <ThresholdCustomValues
        thresholds={thresholds}
        onThresholdValuesChange={onThresholdValuesChange}
        baseColor={baseColor}
        onBaseColorChange={onBaseColorChange}
      />
    </StyleAccordion>
  );
};

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

  const onCellTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateStyleOption('cellType', e.target.value as 'colored_text' | 'colored_background');
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

  const [localPageSize, handlePageSizeChange] = useDebouncedNumericValue(
    styleOptions.pageSize,
    onPageSizeChange
  );

  return (
    <>
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
            <EuiFormRow
              label={i18n.translate('explore.stylePanel.table.cellType', {
                defaultMessage: 'Cell type',
              })}
            >
              <EuiSelect
                compressed
                options={cellTypeOptions}
                value={styleOptions.cellType || 'auto'}
                onChange={onCellTypeChange}
                onMouseUp={(e) => e.stopPropagation()}
                data-test-subj="visTableCellType"
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
          <CustomThresholdPanel
            thresholds={styleOptions.thresholds || []}
            onThresholdValuesChange={onThresholdsChange}
            baseColor={styleOptions.baseColor || '#000000'}
            onBaseColorChange={onBaseColorChange}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <TableFooterStyleControls
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
    </>
  );
};
