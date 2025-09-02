/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiButton,
  EuiComboBox,
  EuiComboBoxOptionOption,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormLabel,
  EuiFormRow,
  EuiSelect,
  EuiSpacer,
  EuiSwitch,
} from '@elastic/eui';
import { StyleControlsProps } from '../utils/use_visualization_types';
import { TableChartStyleControls } from './table_vis_config';
import { StyleAccordion } from '../style_panel/style_accordion';
import { VisColumn } from '../types';

export type TableFooterStyleControlsProps = StyleControlsProps<TableChartStyleControls> & {
  numericalColumns?: VisColumn[];
};

export const TableFooterStyleControls: React.FC<TableFooterStyleControlsProps> = ({
  styleOptions,
  onStyleChange,
  numericalColumns = [],
}) => {
  const toNew = (c: any) =>
    'fields' in c
      ? {
          fields: (c.fields || []).filter((f: any) => typeof f === 'string'),
          calculation: c.calculation,
        }
      : { fields: c.field ? [String(c.field)] : [], calculation: c.calculation };

  const [localCalculations, setLocalCalculations] = useState<
    Array<{ fields: string[]; calculation: 'total' | 'last' | 'average' | 'min' | 'max' }>
  >((styleOptions.footerCalculations || []).map(toNew));

  const updateStyleOption = useCallback(
    <K extends keyof TableChartStyleControls>(key: K, value: TableChartStyleControls[K]) => {
      onStyleChange({ [key]: value });
    },
    [onStyleChange]
  );

  const onShowFooterChange = useCallback(
    (checked: boolean) => {
      updateStyleOption('showFooter', checked);
      if (!checked) {
        setLocalCalculations([]);
        updateStyleOption('footerCalculations', []);
      }
    },
    [updateStyleOption]
  );

  const syncToParent = useCallback(
    (
      next: Array<{ fields: string[]; calculation: 'total' | 'last' | 'average' | 'min' | 'max' }>
    ) => {
      setLocalCalculations(next);
      updateStyleOption('footerCalculations', next);
    },
    [updateStyleOption]
  );

  const onCalculationChange = useCallback(
    (index: number, value: 'total' | 'last' | 'average' | 'min' | 'max') => {
      const next = [...localCalculations];
      next[index] = { ...next[index], calculation: value };
      syncToParent(next);
    },
    [localCalculations, syncToParent]
  );

  const onFieldChange = useCallback(
    (index: number, selectedOptions: Array<EuiComboBoxOptionOption<string>>) => {
      const fields = selectedOptions
        .map((o) => o.value)
        .filter((v): v is string => typeof v === 'string');
      const next = [...localCalculations];
      next[index] = { ...next[index], fields };
      syncToParent(next);
    },
    [localCalculations, syncToParent]
  );

  const onAddCalculation = useCallback(() => {
    const selected = new Set(localCalculations.flatMap((c) => c.fields));
    const available = numericalColumns.map((c) => c.column).filter((c) => !selected.has(c));
    if (available.length === 0) return;

    const next = [...localCalculations, { fields: [available[0]], calculation: 'total' as const }];
    syncToParent(next);
  }, [localCalculations, numericalColumns, syncToParent]);

  const calculationOptions = [
    { value: 'total', text: 'Total' },
    { value: 'last', text: 'Last' },
    { value: 'average', text: 'Average' },
    { value: 'min', text: 'Min' },
    { value: 'max', text: 'Max' },
  ];

  const getFieldOptionsForIndex = (index: number) => {
    const selectedFields = localCalculations
      .flatMap((calc, i) => (i !== index ? calc.fields : []))
      .filter((field): field is string => field !== null);
    return numericalColumns
      .filter((col) => !selectedFields.includes(col.column))
      .map((col) => ({
        value: col.column,
        label: col.name || col.column,
      }));
  };

  const canAddCalculation =
    numericalColumns.length > localCalculations.flatMap((calc) => calc.fields).length;

  return (
    <StyleAccordion
      id="tableFooterSection"
      accordionLabel={i18n.translate('explore.stylePanel.table.footerSection', {
        defaultMessage: 'Table Footer',
      })}
      initialIsOpen={true}
      data-test-subj="visTableFooter"
    >
      <EuiFormRow
        label={i18n.translate('explore.stylePanel.table.showFooter', {
          defaultMessage: 'Show Footer',
        })}
      >
        <EuiSwitch
          compressed
          label=""
          checked={styleOptions.showFooter || false}
          onChange={(e) => onShowFooterChange(e.target.checked)}
          data-test-subj="visTableShowFooter"
        />
      </EuiFormRow>
      {styleOptions.showFooter && (
        <>
          <EuiFormLabel>
            {i18n.translate('explore.stylePanel.table.calculation', {
              defaultMessage: 'Calculation',
            })}
          </EuiFormLabel>
          <EuiSpacer size="s" />
          {localCalculations.map((calc, index) => (
            <>
              <EuiFlexGroup key={index} alignItems="center" gutterSize="s">
                <EuiFlexItem grow={3}>
                  <EuiComboBox
                    compressed
                    options={getFieldOptionsForIndex(index)}
                    selectedOptions={calc.fields
                      .map((field) => ({
                        value: field,
                        label: numericalColumns.find((col) => col.column === field)?.name || field,
                      }))
                      .filter((option) => option.value !== undefined)}
                    onChange={(selectedOptions) => onFieldChange(index, selectedOptions)}
                    data-test-subj={`visTableFooterField-${index}`}
                    isClearable={true}
                  />
                </EuiFlexItem>
                <EuiFlexItem grow={3}>
                  <EuiSelect
                    compressed
                    options={calculationOptions}
                    value={calc.calculation}
                    onChange={(e) =>
                      onCalculationChange(
                        index,
                        e.target.value as 'total' | 'last' | 'average' | 'min' | 'max'
                      )
                    }
                    data-test-subj={`visTableFooterCalculation-${index}`}
                  />
                </EuiFlexItem>
              </EuiFlexGroup>
            </>
          ))}
          {canAddCalculation && (
            <EuiFormRow>
              <EuiButton
                size="s"
                onClick={onAddCalculation}
                data-test-subj="visTableAddCalculation"
              >
                {i18n.translate('explore.stylePanel.table.addCalculation', {
                  defaultMessage: 'Add Calculation',
                })}
              </EuiButton>
            </EuiFormRow>
          )}
        </>
      )}
    </StyleAccordion>
  );
};
