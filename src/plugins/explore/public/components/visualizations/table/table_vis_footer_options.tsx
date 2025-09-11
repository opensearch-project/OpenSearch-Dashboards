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

interface FooterCalculation {
  fields: string[];
  calculation: CalculationMethod;
}

const baseOptions = CALCULATIONS.map((method) => ({
  value: method,
  text: method.charAt(0).toUpperCase() + method.slice(1),
}));

export const TableFooterOptions: React.FC<TableFooterStyleControlsProps> = ({
  styleOptions,
  onStyleChange,
  numericalColumns = [],
}) => {
  const localCalculations = useMemo(() => styleOptions.footerCalculations || [], [
    styleOptions.footerCalculations,
  ]);
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
    },
    [updateStyleOption]
  );

  const onCalculationChange = useCallback(
    (index: number, value: CalculationMethod) => {
      const next = [...localCalculations];
      next[index] = { ...next[index], calculation: value };
      updateStyleOption('footerCalculations', next);
    },
    [localCalculations, updateStyleOption]
  );

  const onRemoveField = useCallback(
    (index: number, field: string) => {
      const next = [...localCalculations];
      next[index] = {
        ...next[index],
        fields: next[index].fields.filter((f: string) => f !== field),
      };
      updateStyleOption('footerCalculations', next);
    },
    [localCalculations, updateStyleOption]
  );

  const onAddField = useCallback(
    (index: number, field: string) => {
      const next = [...localCalculations];
      next[index] = { ...next[index], fields: [...next[index].fields, field] };
      updateStyleOption('footerCalculations', next);
      setPopoverIndex(null);
    },
    [localCalculations, updateStyleOption]
  );

  const onRemoveCalculation = useCallback(
    (index: number) => {
      const next = [...localCalculations];
      next.splice(index, 1);
      updateStyleOption('footerCalculations', next);
    },
    [localCalculations, updateStyleOption]
  );

  const onAddCalculation = useCallback(() => {
    const selected = new Set(localCalculations.flatMap((c) => c.fields));
    const available = numericalColumns.map((c) => c.column).filter((c) => !selected.has(c));
    if (available.length === 0) return;

    const usedCalculations = new Set<CalculationMethod>(
      localCalculations.map((c) => c.calculation)
    );

    const availableCalculation = CALCULATIONS.find((calc) => !usedCalculations.has(calc));

    if (!availableCalculation) return;

    const next = [
      ...localCalculations,
      { fields: [available[0]], calculation: availableCalculation },
    ];
    updateStyleOption('footerCalculations', next);
  }, [localCalculations, numericalColumns, updateStyleOption]);

  const getCalculationOptions = (
    calc: { fields: string[]; calculation: CalculationMethod },
    localCalc: FooterCalculation[]
  ) => {
    const currentValue = calc.calculation;
    const usedByOthers = new Set<CalculationMethod>(
      localCalc.filter((c) => c !== calc).map((c) => c.calculation)
    );
    return baseOptions.filter((opt) => opt.value === currentValue || !usedByOthers.has(opt.value));
  };

  const fieldOptions = useMemo(() => {
    const selectedFields = localCalculations.flatMap((c) => c.fields);

    return localCalculations.map((_, index) =>
      numericalColumns
        .filter((col) => !selectedFields.includes(col.column))
        .map((col) => ({
          name: col.name || col.column,
          onClick: () => onAddField(index, col.column),
        }))
    );
  }, [localCalculations, numericalColumns, onAddField]);

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
      updateStyleOption('footerCalculations', next);
    }
  }, [numericalColumns, localCalculations, updateStyleOption]);

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
                          options={getCalculationOptions(calc, localCalculations)}
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
                                  items: fieldOptions[index],
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
