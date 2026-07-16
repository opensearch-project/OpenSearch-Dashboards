/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiComboBox,
  EuiComboBoxOptionOption,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiForm,
  EuiFormRow,
  EuiPopover,
  EuiPopoverTitle,
  EuiSpacer,
  EuiSuperSelect,
} from '@elastic/eui';
import { WhereFilter, WhereOperator } from './types';

/**
 * The builder's structured filter operators, with the Discover labels. Each maps
 * 1:1 onto a PPL `where` predicate shape (see `compileWhereFilter`). `arity`
 * drives which value input the form renders: `none` (exists), `one` (is/is_not),
 * `many` (one_of), or `range` (between).
 */
type OperatorArity = 'none' | 'one' | 'many' | 'range';

interface OperatorDef {
  value: WhereOperator;
  label: string;
  arity: OperatorArity;
}

const OPERATOR_DEFS: OperatorDef[] = [
  {
    value: 'is',
    label: i18n.translate('explore.pplBuilder.filterOperator.is', { defaultMessage: 'is' }),
    arity: 'one',
  },
  {
    value: 'is_not',
    label: i18n.translate('explore.pplBuilder.filterOperator.isNot', { defaultMessage: 'is not' }),
    arity: 'one',
  },
  {
    value: 'is_one_of',
    label: i18n.translate('explore.pplBuilder.filterOperator.isOneOf', {
      defaultMessage: 'is one of',
    }),
    arity: 'many',
  },
  {
    value: 'is_not_one_of',
    label: i18n.translate('explore.pplBuilder.filterOperator.isNotOneOf', {
      defaultMessage: 'is not one of',
    }),
    arity: 'many',
  },
  {
    value: 'is_between',
    label: i18n.translate('explore.pplBuilder.filterOperator.isBetween', {
      defaultMessage: 'is between',
    }),
    arity: 'range',
  },
  {
    value: 'is_not_between',
    label: i18n.translate('explore.pplBuilder.filterOperator.isNotBetween', {
      defaultMessage: 'is not between',
    }),
    arity: 'range',
  },
  {
    value: 'exists',
    label: i18n.translate('explore.pplBuilder.filterOperator.exists', { defaultMessage: 'exists' }),
    arity: 'none',
  },
  {
    value: 'not_exists',
    label: i18n.translate('explore.pplBuilder.filterOperator.notExists', {
      defaultMessage: 'does not exist',
    }),
    arity: 'none',
  },
];

const OPERATOR_ARITY: Record<WhereOperator, OperatorArity> = OPERATOR_DEFS.reduce(
  (acc, def) => {
    acc[def.value] = def.arity;
    return acc;
  },
  {} as Record<WhereOperator, OperatorArity>
);

/** The filter payload emitted on save — the identity (`id`) is owned by state. */
export type FilterDraft = Pick<WhereFilter, 'field' | 'operator' | 'values'>;

interface FilterEditorPopoverProps {
  /** The trigger element the popover anchors to (the "Add filter" button or a chip). */
  button: React.ReactElement;
  isOpen: boolean;
  onClose: () => void;
  /** Existing filter when editing; undefined when adding a new one. */
  initialFilter?: WhereFilter;
  /** Field names offered in the field combobox. */
  fieldNames: string[];
  /** Async value suggestions for a field (best-effort; may resolve empty). */
  getValues: (field: string) => Promise<string[]>;
  onSave: (draft: FilterDraft) => void;
}

const toOption = (value: string): EuiComboBoxOptionOption<string> => ({ label: value, value });

/**
 * A Discover-style filter editor rendered in a popover: Field, Operator, and a
 * Value/Values input that adapts to the operator. Explore-owned and built from
 * EUI primitives (no dependency on the data plugin's internal FilterEditor), and
 * deliberately omits the "Edit as Query DSL" link and the "Create custom label?"
 * toggle. On submit it emits a {@link FilterDraft} the caller dispatches into
 * builder state.
 */
export const FilterEditorPopover: React.FC<FilterEditorPopoverProps> = ({
  button,
  isOpen,
  onClose,
  initialFilter,
  fieldNames,
  getValues,
  onSave,
}) => {
  const [field, setField] = useState<string>(initialFilter?.field ?? '');
  const [operator, setOperator] = useState<WhereOperator>(initialFilter?.operator ?? 'is');
  const [values, setValues] = useState<string[]>(initialFilter?.values ?? []);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Re-seed the form each time the popover opens so it reflects the filter being
  // edited (or resets for a fresh add) rather than stale local state.
  useEffect(() => {
    if (!isOpen) return;
    setField(initialFilter?.field ?? '');
    setOperator(initialFilter?.operator ?? 'is');
    setValues(initialFilter?.values ?? []);
  }, [isOpen, initialFilter]);

  // Load value suggestions for the chosen field (best-effort). Cancel-safe so a
  // fast field switch doesn't apply a stale response.
  useEffect(() => {
    if (!isOpen || !field) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    getValues(field).then((vals) => {
      if (!cancelled) setSuggestions(vals);
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen, field, getValues]);

  const arity = OPERATOR_ARITY[operator];

  const fieldOptions = useMemo(() => fieldNames.map(toOption), [fieldNames]);
  const valueOptions = useMemo(() => suggestions.map(toOption), [suggestions]);

  const isValid = useMemo(() => {
    if (!field) return false;
    switch (arity) {
      case 'none':
        return true;
      case 'one':
        return !!values[0]?.trim();
      case 'many':
        return values.filter((v) => v.trim()).length > 0;
      case 'range':
        return !!(values[0]?.trim() || values[1]?.trim());
      default:
        return false;
    }
  }, [field, arity, values]);

  const submit = useCallback(() => {
    if (!isValid) return;
    onSave({ field, operator, values });
    onClose();
  }, [isValid, onSave, onClose, field, operator, values]);

  const renderValueInput = () => {
    if (arity === 'none') return null;

    if (arity === 'range') {
      return (
        <EuiFormRow
          label={i18n.translate('explore.pplBuilder.filterRangeLabel', { defaultMessage: 'Range' })}
          fullWidth
        >
          <EuiFlexGroup gutterSize="s" responsive={false} alignItems="center">
            <EuiFlexItem>
              <EuiFieldText
                compressed
                fullWidth
                placeholder={i18n.translate('explore.pplBuilder.filterFrom', {
                  defaultMessage: 'From',
                })}
                value={values[0] ?? ''}
                onChange={(e) => setValues([e.target.value, values[1] ?? ''])}
                data-test-subj="pplBuilderFilterRangeFrom"
              />
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiFieldText
                compressed
                fullWidth
                placeholder={i18n.translate('explore.pplBuilder.filterTo', {
                  defaultMessage: 'To',
                })}
                value={values[1] ?? ''}
                onChange={(e) => setValues([values[0] ?? '', e.target.value])}
                data-test-subj="pplBuilderFilterRangeTo"
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFormRow>
      );
    }

    // one | many — a combobox seeded with value suggestions that also accepts
    // typed values. Single-selection for is/is_not, multi for the one-of forms.
    const singleSelection = arity === 'one';
    const selected = values.filter(Boolean).map(toOption);
    return (
      <EuiFormRow
        label={
          singleSelection
            ? i18n.translate('explore.pplBuilder.filterValueLabel', { defaultMessage: 'Value' })
            : i18n.translate('explore.pplBuilder.filterValuesLabel', { defaultMessage: 'Values' })
        }
        fullWidth
      >
        <EuiComboBox
          compressed
          fullWidth
          singleSelection={singleSelection ? { asPlainText: true } : false}
          options={valueOptions}
          selectedOptions={selected}
          onChange={(opts) => setValues(opts.map((o) => o.value ?? o.label))}
          onCreateOption={(searchValue) => {
            const v = searchValue.trim();
            if (!v) return;
            setValues(singleSelection ? [v] : [...values.filter(Boolean), v]);
          }}
          placeholder={i18n.translate('explore.pplBuilder.filterValuePlaceholder', {
            defaultMessage: 'Select or enter a value',
          })}
          isClearable
          data-test-subj="pplBuilderFilterValues"
        />
      </EuiFormRow>
    );
  };

  return (
    <EuiPopover
      button={button}
      isOpen={isOpen}
      closePopover={onClose}
      anchorPosition="downLeft"
      panelPaddingSize="m"
      data-test-subj="pplBuilderFilterEditor"
    >
      <div style={{ width: 420 }}>
        <EuiPopoverTitle>
          {initialFilter
            ? i18n.translate('explore.pplBuilder.editFilter', { defaultMessage: 'Edit filter' })
            : i18n.translate('explore.pplBuilder.addFilterTitle', {
                defaultMessage: 'Add filter',
              })}
        </EuiPopoverTitle>
        <EuiForm
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <EuiFlexGroup gutterSize="s" responsive={false}>
            <EuiFlexItem>
              <EuiFormRow
                label={i18n.translate('explore.pplBuilder.filterFieldLabel', {
                  defaultMessage: 'Field',
                })}
                fullWidth
              >
                <EuiComboBox
                  compressed
                  fullWidth
                  singleSelection={{ asPlainText: true }}
                  options={fieldOptions}
                  selectedOptions={field ? [toOption(field)] : []}
                  onChange={(opts) => setField(opts.length ? (opts[0].value ?? opts[0].label) : '')}
                  onCreateOption={(searchValue) => setField(searchValue.trim())}
                  placeholder={i18n.translate('explore.pplBuilder.filterFieldPlaceholder', {
                    defaultMessage: 'Select a field',
                  })}
                  isClearable={false}
                  data-test-subj="pplBuilderFilterField"
                />
              </EuiFormRow>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiFormRow
                label={i18n.translate('explore.pplBuilder.filterOperatorLabel', {
                  defaultMessage: 'Operator',
                })}
                fullWidth
              >
                <EuiSuperSelect
                  compressed
                  fullWidth
                  options={OPERATOR_DEFS.map((def) => ({
                    value: def.value,
                    inputDisplay: def.label,
                  }))}
                  valueOfSelected={operator}
                  onChange={(value) => setOperator(value as WhereOperator)}
                  data-test-subj="pplBuilderFilterOperator"
                />
              </EuiFormRow>
            </EuiFlexItem>
          </EuiFlexGroup>

          {renderValueInput()}

          <EuiSpacer size="m" />

          <EuiFlexGroup gutterSize="s" responsive={false} justifyContent="flexEnd">
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty size="s" onClick={onClose} data-test-subj="pplBuilderFilterCancel">
                {i18n.translate('explore.pplBuilder.filterCancel', { defaultMessage: 'Cancel' })}
              </EuiButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton
                size="s"
                type="submit"
                fill
                isDisabled={!isValid}
                data-test-subj="pplBuilderFilterSave"
              >
                {initialFilter
                  ? i18n.translate('explore.pplBuilder.updateFilter', {
                      defaultMessage: 'Update filter',
                    })
                  : i18n.translate('explore.pplBuilder.addFilterSave', {
                      defaultMessage: 'Add filter',
                    })}
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiForm>
      </div>
    </EuiPopover>
  );
};

/** Human-readable chip label for a filter, e.g. `status is one of 200, 404`. */
export function filterChipLabel(filter: WhereFilter): string {
  const def = OPERATOR_DEFS.find((d) => d.value === filter.operator);
  const opLabel = def?.label ?? filter.operator;
  const arity = OPERATOR_ARITY[filter.operator];
  if (arity === 'none') return `${filter.field} ${opLabel}`;
  if (arity === 'range') {
    const [gte, lt] = filter.values;
    return `${filter.field} ${opLabel} ${gte ?? ''} – ${lt ?? ''}`.trim();
  }
  return `${filter.field} ${opLabel} ${filter.values.filter(Boolean).join(', ')}`.trim();
}
