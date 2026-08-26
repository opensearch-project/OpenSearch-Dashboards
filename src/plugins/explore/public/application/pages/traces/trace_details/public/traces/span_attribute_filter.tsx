/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiButtonGroup,
  EuiComboBox,
  EuiComboBoxOptionOption,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiPopover,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { DatasetField } from '../../trace_view';

export interface SpanAttributeFilterProps {
  /** Filterable fields surfaced from the dataset field list (restricted set). */
  fields: DatasetField[];
  /** Spans used to suggest distinct values for the selected field. */
  spans: Array<Record<string, any>>;
  onAddFilter: (field: string, value: string | number | boolean, operator: '=' | '!=') => void;
  /** Prefill the editor (edit an existing chip). Omit for the "+ Add filter" flow. */
  initial?: { field: string; value: string; operator: '=' | '!=' };
  /** Custom popover trigger. Given a toggle fn + open state; defaults to the "+ Add filter" button. */
  renderTrigger?: (toggle: () => void, isOpen: boolean) => React.ReactNode;
  /** Apply-button label (e.g. "Update" when editing). Defaults to "Add". */
  applyLabel?: string;
}

const readFieldValue = (span: Record<string, any>, field: string): any =>
  field.includes('.') ? field.split('.').reduce((obj, key) => obj?.[key], span) : span[field];

// Coerce the (string) combo value to the field's type so client-side comparison
// and the server-side PPL query both match (e.g. numeric status codes).
export const coerceFilterValue = (value: string, type?: string): string | number | boolean => {
  if (type === 'number') {
    const n = Number(value);
    return isNaN(n) ? value : n;
  }
  if (type === 'boolean') return value === 'true';
  return value;
};

/** Distinct, sorted, stringified values of a field across the given spans (capped). */
export const distinctFieldValues = (
  spans: Array<Record<string, any>>,
  field: string,
  cap = 50
): string[] => {
  const seen = new Set<string>();
  for (const span of spans) {
    const raw = readFieldValue(span, field);
    if (raw === undefined || raw === null || typeof raw === 'object') continue;
    seen.add(String(raw));
    if (seen.size >= cap) break;
  }
  return Array.from(seen).sort();
};

/**
 * Grafana-style "+ Add filter" control. The field list comes only from the
 * dataset (no free-text field names → no injectable paths); operator supports
 * equality and inequality (P0); the value can be picked from suggested distinct
 * values or typed. Adding delegates to the shared span-filter handler.
 */
export const SpanAttributeFilter: React.FC<SpanAttributeFilterProps> = ({
  fields,
  spans,
  onAddFilter,
  initial,
  renderTrigger,
  applyLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<Array<EuiComboBoxOptionOption<string>>>([]);
  const [operator, setOperator] = useState<'=' | '!='>('=');
  const [selectedValue, setSelectedValue] = useState<Array<EuiComboBoxOptionOption<string>>>([]);

  // Seed the editor from `initial` (edit mode) each time it opens, so a chip's
  // popover reflects its current field/operator/value.
  const toggle = () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    if (initial) {
      setSelectedField(initial.field ? [{ label: initial.field, value: initial.field }] : []);
      setOperator(initial.operator ?? '=');
      setSelectedValue(
        initial.value !== undefined && initial.value !== ''
          ? [{ label: String(initial.value), value: String(initial.value) }]
          : []
      );
    }
    setIsOpen(true);
  };

  const fieldOptions = useMemo(
    () => fields.map((f) => ({ label: f.name, value: f.name })),
    [fields]
  );

  const fieldName = selectedField[0]?.value;
  const fieldType = useMemo(
    () => fields.find((f) => f.name === fieldName)?.type,
    [fields, fieldName]
  );

  // Distinct values for the chosen field, from the loaded spans (sample).
  const valueOptions = useMemo(
    () =>
      fieldName ? distinctFieldValues(spans, fieldName).map((v) => ({ label: v, value: v })) : [],
    [fieldName, spans]
  );

  const reset = () => {
    setSelectedField([]);
    setSelectedValue([]);
    setOperator('=');
  };

  const value = selectedValue[0]?.value;
  const canApply = !!fieldName && value !== undefined && value !== '';

  const apply = () => {
    if (!canApply || !fieldName || value === undefined) return;
    onAddFilter(fieldName, coerceFilterValue(value, fieldType), operator);
    reset();
    setIsOpen(false);
  };

  const button = renderTrigger ? (
    renderTrigger(toggle, isOpen)
  ) : (
    <EuiButtonEmpty
      size="xs"
      className="plqGhostAdd"
      iconType="plusInCircle"
      onClick={toggle}
      isSelected={isOpen}
      data-test-subj="span-attribute-filter-button"
    >
      {i18n.translate('explore.traceView.button.addFilter', { defaultMessage: 'Add filter' })}
    </EuiButtonEmpty>
  );

  return (
    <EuiPopover
      button={button}
      isOpen={isOpen}
      closePopover={() => setIsOpen(false)}
      panelPaddingSize="m"
      data-test-subj="span-attribute-filter-popover"
    >
      <div style={{ width: 320 }}>
        <EuiFormRow
          label={i18n.translate('explore.traceView.attributeFilter.fieldLabel', {
            defaultMessage: 'Field',
          })}
          helpText={i18n.translate('explore.traceView.attributeFilter.fieldHelp', {
            defaultMessage: 'Fields are loaded from the dataset field list.',
          })}
          fullWidth
        >
          <EuiComboBox
            singleSelection={{ asPlainText: true }}
            options={fieldOptions}
            selectedOptions={selectedField}
            onChange={(opts) => {
              setSelectedField(opts as Array<EuiComboBoxOptionOption<string>>);
              setSelectedValue([]);
            }}
            placeholder={i18n.translate('explore.traceView.attributeFilter.fieldPlaceholder', {
              defaultMessage: 'Select a field',
            })}
            isClearable
            fullWidth
            data-test-subj="span-attribute-filter-field"
          />
        </EuiFormRow>

        <EuiSpacer size="s" />
        <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiButtonGroup
              legend={i18n.translate('explore.traceView.attributeFilter.operatorLegend', {
                defaultMessage: 'Operator',
              })}
              buttonSize="compressed"
              idSelected={operator}
              onChange={(id) => setOperator(id as '=' | '!=')}
              options={[
                {
                  id: '=',
                  label: i18n.translate('explore.traceView.attributeFilter.is', {
                    defaultMessage: 'is',
                  }),
                },
                {
                  id: '!=',
                  label: i18n.translate('explore.traceView.attributeFilter.isNot', {
                    defaultMessage: 'is not',
                  }),
                },
              ]}
              data-test-subj="span-attribute-filter-operator"
            />
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiSpacer size="s" />
        <EuiFormRow
          label={i18n.translate('explore.traceView.attributeFilter.valueLabel', {
            defaultMessage: 'Value',
          })}
          fullWidth
        >
          <EuiComboBox
            singleSelection={{ asPlainText: true }}
            options={valueOptions}
            selectedOptions={selectedValue}
            onChange={(opts) => setSelectedValue(opts as Array<EuiComboBoxOptionOption<string>>)}
            onCreateOption={(searchValue) =>
              setSelectedValue([{ label: searchValue, value: searchValue }])
            }
            isDisabled={!fieldName}
            placeholder={i18n.translate('explore.traceView.attributeFilter.valuePlaceholder', {
              defaultMessage: 'Select or type a value',
            })}
            isClearable
            fullWidth
            data-test-subj="span-attribute-filter-value"
          />
        </EuiFormRow>

        {valueOptions.length === 0 && fieldName && (
          <>
            <EuiSpacer size="xs" />
            <EuiText size="xs" color="subdued">
              {i18n.translate('explore.traceView.attributeFilter.noValues', {
                defaultMessage: 'No values in the loaded spans — type a value to filter.',
              })}
            </EuiText>
          </>
        )}

        <EuiSpacer size="m" />
        <EuiFlexGroup gutterSize="s" justifyContent="flexEnd" responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty size="xs" onClick={() => setIsOpen(false)}>
              {i18n.translate('explore.traceView.attributeFilter.cancel', {
                defaultMessage: 'Cancel',
              })}
            </EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton
              size="s"
              fill
              onClick={apply}
              isDisabled={!canApply}
              data-test-subj="span-attribute-filter-apply"
            >
              {applyLabel ??
                i18n.translate('explore.traceView.attributeFilter.add', { defaultMessage: 'Add' })}
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
    </EuiPopover>
  );
};
