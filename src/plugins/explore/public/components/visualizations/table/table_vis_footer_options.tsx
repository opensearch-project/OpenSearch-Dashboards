/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiButton,
  EuiButtonIcon,
  EuiSelect,
  EuiBadge,
  EuiPopover,
  EuiContextMenu,
  EuiFormRow,
  EuiSwitch,
  EuiFlexItem,
  EuiFlexGroup,
  EuiSpacer,
} from '@elastic/eui';
import { StyleControlsProps } from '../utils/use_visualization_types';
import { TableChartStyleControls } from './table_vis_config';
import { StyleAccordion } from '../style_panel/style_accordion';
import { VisColumn } from '../types';
import { CalculationMethod } from '../utils/calculation';

export type TableFooterStyleControlsProps = StyleControlsProps<TableChartStyleControls> & {
  numericalColumns?: VisColumn[];
};

const CALCULATIONS: CalculationMethod[] = ['total', 'last', 'mean', 'min', 'max'];

interface FooterCalculationInput {
  field?: unknown;
  fields?: unknown[];
  calculation: CalculationMethod;
}

export const TableFooterOptions: React.FC<TableFooterStyleControlsProps> = ({
  styleOptions,
  onStyleChange,
  numericalColumns = [],
}) => {
  const normalizeCalculation = (c: FooterCalculationInput) => {
    if (c.fields) {
      return {
        fields: c.fields.filter((f): f is string => typeof f === 'string'),
        calculation: c.calculation,
      };
    }
    return {
      fields: c.field ? [String(c.field)] : [],
      calculation: c.calculation,
    };
  };

  const localCalculations = useMemo(
    () => (styleOptions.footerCalculations || []).map(normalizeCalculation),
    [styleOptions.footerCalculations]
  );
  const [popoverIndex, setPopoverIndex] = useState<number | null>(null);

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
        updateStyleOption('footerCalculations', []);
      }
    },
    [updateStyleOption]
  );

  const syncToParent = useCallback(
    (next: Array<{ fields: string[]; calculation: CalculationMethod }>) => {
      updateStyleOption('footerCalculations', next);
    },
    [updateStyleOption]
  );

  const onCalculationChange = useCallback(
    (index: number, value: CalculationMethod) => {
      const next = [...localCalculations];
      next[index] = { ...next[index], calculation: value };
      syncToParent(next);
    },
    [localCalculations, syncToParent]
  );

  const onRemoveField = useCallback(
    (index: number, field: string) => {
      const next = [...localCalculations];
      next[index] = {
        ...next[index],
        fields: next[index].fields.filter((f: string) => f !== field),
      };
      syncToParent(next);
    },
    [localCalculations, syncToParent]
  );

  const onAddField = useCallback(
    (index: number, field: string) => {
      const next = [...localCalculations];
      next[index] = { ...next[index], fields: [...next[index].fields, field] };
      syncToParent(next);
      setPopoverIndex(null);
    },
    [localCalculations, syncToParent]
  );

  const onRemoveCalculation = useCallback(
    (index: number) => {
      const next = [...localCalculations];
      next.splice(index, 1);
      syncToParent(next);
    },
    [localCalculations, syncToParent]
  );

  const onAddCalculation = useCallback(() => {
    const selected = new Set(localCalculations.flatMap((c) => c.fields));
    const available = numericalColumns.map((c) => c.column).filter((c) => !selected.has(c));
    if (available.length === 0) return;

    const usedCalculations = new Set<CalculationMethod>(
      localCalculations.map((c) => c.calculation)
    );

    const availableCalculation = CALCULATIONS.find((calc) => !usedCalculations.has(calc)) as
      | CalculationMethod
      | undefined;

    if (!availableCalculation) return;

    const next = [
      ...localCalculations,
      { fields: [available[0]], calculation: availableCalculation },
    ];
    syncToParent(next);
  }, [localCalculations, numericalColumns, syncToParent]);

  const getCalculationOptions = useCallback(
    (calc: { fields: string[]; calculation: CalculationMethod }) => {
      const currentValue = calc.calculation;
      const usedByOthers = new Set<CalculationMethod>(
        localCalculations.filter((c) => c !== calc).map((c) => c.calculation)
      );
      const baseOptions: Array<{ value: CalculationMethod; text: string }> = [
        { value: 'total', text: 'Total' },
        { value: 'last', text: 'Last' },
        { value: 'mean', text: 'Mean' },
        { value: 'min', text: 'Min' },
        { value: 'max', text: 'Max' },
      ];
      return baseOptions.filter(
        (opt) => opt.value === currentValue || !usedByOthers.has(opt.value)
      );
    },
    [localCalculations]
  );

  const getFieldOptionsForIndex = (index: number) => {
    const selectedFields = localCalculations
      .flatMap((calc) => calc.fields)
      .filter((field): field is string => field !== null);

    return numericalColumns
      .filter((col) => !selectedFields.includes(col.column))
      .map((col) => ({
        id: col.column,
        label: col.name || col.column,
      }));
  };

  const canAddCalculation = useMemo(() => {
    const hasFreeField =
      numericalColumns.length > localCalculations.flatMap((calc) => calc.fields).length;
    const used = new Set(localCalculations.map((c) => c.calculation));
    const hasFreeCalc = CALCULATIONS.some((c) => !used.has(c));
    return hasFreeField && hasFreeCalc;
  }, [numericalColumns, localCalculations]);

  useEffect(() => {
    const allowed = new Set(numericalColumns.map((c) => c.column));
    const next = localCalculations
      .map((c) => ({ ...c, fields: c.fields.filter((f: string) => allowed.has(f)) }))
      .filter((c) => c.fields.length > 0);

    const changed = JSON.stringify(next) !== JSON.stringify(localCalculations);
    if (changed) {
      syncToParent(next);
    }
  }, [numericalColumns, localCalculations, syncToParent]);

  return (
    <StyleAccordion
      id="tableFooterSection"
      accordionLabel={i18n.translate('explore.stylePanel.table.footerSection', {
        defaultMessage: 'Table Footer',
      })}
      initialIsOpen={true}
      data-test-subj="visTableFooter"
    >
      <EuiFormRow>
        <EuiSwitch
          compressed
          label={i18n.translate('explore.stylePanel.table.showFooter', {
            defaultMessage: 'Show Footer',
          })}
          checked={styleOptions.showFooter || false}
          onChange={(e) => onShowFooterChange(e.target.checked)}
          data-test-subj="visTableShowFooter"
        />
      </EuiFormRow>
      {styleOptions.showFooter && (
        <>
          <EuiFormRow
            label={i18n.translate('explore.stylePanel.table.calculation', {
              defaultMessage: 'Calculation',
            })}
          >
            <>
              {localCalculations.map((calc, index) => (
                <div key={index}>
                  <EuiFormRow>
                    <EuiFlexGroup gutterSize="s" alignItems="center">
                      <EuiFlexItem>
                        <EuiSelect
                          compressed
                          options={getCalculationOptions(calc)}
                          value={calc.calculation}
                          onChange={(e) =>
                            onCalculationChange(index, e.target.value as CalculationMethod)
                          }
                          data-test-subj={`visTableFooterCalculation-${index}`}
                        />
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiButtonIcon
                          iconType="trash"
                          color="danger"
                          aria-label="Delete Calculation"
                          onClick={() => onRemoveCalculation(index)}
                          data-test-subj={`visTableFooterDelete-${index}`}
                        />
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiFormRow>
                  <EuiFormRow>
                    <EuiFlexGroup gutterSize="s" alignItems="center">
                      <EuiFlexItem grow={false}>
                        <EuiFlexGroup wrap responsive={false} gutterSize="s">
                          {calc.fields.map((field: string) => (
                            <EuiFlexItem key={field}>
                              <EuiBadge
                                color="hollow"
                                iconType="cross"
                                iconSide="right"
                                onClick={() => onRemoveField(index, field)}
                                onClickAriaLabel={`Remove ${field}`}
                                data-test-subj={`visTableFooterFieldBadge-${index}-${field}`}
                              >
                                {numericalColumns.find((col) => col.column === field)?.name ||
                                  field}
                              </EuiBadge>
                            </EuiFlexItem>
                          ))}
                        </EuiFlexGroup>
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        {canAddCalculation && (
                          <EuiPopover
                            button={
                              <EuiButtonIcon
                                iconType="plusInCircle"
                                aria-label="Add Field"
                                onClick={() => setPopoverIndex(index)}
                                data-test-subj={`visTableFooterAddField-${index}`}
                              />
                            }
                            isOpen={popoverIndex === index}
                            closePopover={() => setPopoverIndex(null)}
                            panelPaddingSize="s"
                          >
                            <EuiContextMenu
                              initialPanelId={0}
                              panels={[
                                {
                                  id: 0,
                                  items: getFieldOptionsForIndex(index).map((option) => ({
                                    name: option.label,
                                    onClick: () => onAddField(index, option.id),
                                  })),
                                },
                              ]}
                            />
                          </EuiPopover>
                        )}
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiFormRow>
                  {index < localCalculations.length - 1 && <EuiSpacer size="m" />}
                </div>
              ))}
            </>
          </EuiFormRow>

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
