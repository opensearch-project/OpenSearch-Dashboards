/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import { i18n } from '@osd/i18n';
import { EuiButtonIcon, EuiIcon, EuiToolTip } from '@elastic/eui';
import { BuilderAction, compileWhereFilter } from './build_ppl';
import { WhereFilter, WhereOperator } from './types';
import { OPERATOR_DEFS, OPERATOR_DEF_MAP, operatorArity } from './where_operators';
import { SearchPopoverMenu, SearchMenuOption } from './search_popover_menu';
import {
  ControlGroup,
  GhostAddButton,
  RemoveButton,
  inputWidth,
} from '../../../components/query_builder';

interface WhereRowProps {
  filters: WhereFilter[];
  /** Field names offered in the "add filter" field picker. */
  fieldNames: string[];
  /** Async value suggestions for a field (best-effort; empty on failure). */
  getValues: (field: string) => Promise<string[]>;
  dispatch: React.Dispatch<BuilderAction>;
}

/**
 * The field-picker popover shared by the empty-state ghost "＋ Where" and the
 * inline "＋" add-condition button — the same {@link SearchPopoverMenu} shell used
 * by the aggregation / group-by / sort pickers ("one popover, three uses"). It
 * lists fields grouped nowhere (flat, searchable); picking one appends a fresh
 * `field is …` filter the user then completes inline.
 */
const AddFilterMenu: React.FC<{
  fieldNames: string[];
  onPick: (field: string) => void;
  anchor: (toggle: () => void) => React.ReactElement;
}> = ({ fieldNames, onPick, anchor }) => {
  const options: SearchMenuOption[] = fieldNames.map((field) => ({
    key: field,
    label: field,
    onSelect: () => onPick(field),
    dataTestSubj: `pplBuilderFilterFieldOption-${field}`,
  }));
  return (
    <SearchPopoverMenu
      options={options}
      allowCreate={{ onCreate: onPick, dataTestSubj: 'pplBuilderFilterFieldOptionCreate' }}
      searchPlaceholder={i18n.translate('explore.pplBuilder.filterFieldSearch', {
        defaultMessage: 'Filter on field…',
      })}
      emptyMessage={i18n.translate('explore.pplBuilder.noMatchingField', {
        defaultMessage: 'No matching field',
      })}
      searchDataTestSubj="pplBuilderFilterField-search"
      trigger={(toggle) => ({ anchor: anchor(toggle) })}
    />
  );
};

/**
 * The operator picker: a bare inline trigger (the terse symbol, e.g. `=`, `in`,
 * `between`) that opens the shared search popover listing all operators by their
 * full label. Reusing {@link SearchPopoverMenu} keeps it consistent with the
 * builder's other pickers, and the text trigger sizes to the current operator so
 * `=` stays tight while `not between` gets the room it needs.
 */
const OperatorPopover: React.FC<{
  filter: WhereFilter;
  index: number;
  onChange: (operator: WhereOperator) => void;
}> = ({ filter, index, onChange }) => {
  const current = OPERATOR_DEF_MAP[filter.operator];
  const options: SearchMenuOption[] = OPERATOR_DEFS.map((def) => ({
    key: def.value,
    label: def.label,
    filterText: `${def.label} ${def.shortLabel}`,
    selected: def.value === filter.operator,
    onSelect: () => onChange(def.value),
    dataTestSubj: `pplBuilderFilterOperatorOption-${def.value}-${index}`,
  }));
  return (
    <SearchPopoverMenu
      options={options}
      checkable
      searchPlaceholder={i18n.translate('explore.pplBuilder.filterOperatorSearch', {
        defaultMessage: 'Operator…',
      })}
      emptyMessage={i18n.translate('explore.pplBuilder.noMatchingOperator', {
        defaultMessage: 'No matching operator',
      })}
      searchDataTestSubj={`pplBuilderFilterOperator-${index}-search`}
      trigger={(toggle) => ({
        anchor: (
          <button
            type="button"
            className="plqWhereChip__op"
            onClick={toggle}
            aria-label={i18n.translate('explore.pplBuilder.filterOperatorFor', {
              defaultMessage: 'Operator for {field}',
              values: { field: filter.field },
            })}
            data-test-subj={`pplBuilderFilterOperator-${index}`}
          >
            <span>{current.shortLabel}</span>
            <EuiIcon type="arrowDown" size="s" className="plqWhereChip__caret" />
          </button>
        ),
      })}
    />
  );
};

/**
 * A value editor for the one/many arities: a bare inline trigger showing the
 * current value(s) that opens the shared search popover of value suggestions
 * (fetched lazily via {@link WhereRowProps.getValues}), with `allowCreate` so a
 * value not in the list can still be typed in. Single-value operators replace the
 * value on select; the one-of forms keep the popover open and toggle each value.
 */
const ChipValuePopover: React.FC<{
  field: string;
  values: string[];
  multi: boolean;
  index: number;
  getValues: (field: string) => Promise<string[]>;
  onChange: (values: string[]) => void;
}> = ({ field, values, multi, index, getValues, onChange }) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    let live = true;
    getValues(field).then(
      (vals) => {
        if (live) setSuggestions(vals);
      },
      () => {
        if (live) setSuggestions([]);
      }
    );
    return () => {
      live = false;
    };
  }, [field, getValues]);

  const toggleValue = (value: string) => {
    if (!multi) {
      onChange([value]);
      return;
    }
    onChange(values.includes(value) ? values.filter((v) => v !== value) : [...values, value]);
  };

  const options: SearchMenuOption[] = suggestions.map((value) => ({
    key: value,
    label: value,
    selected: values.includes(value),
    onSelect: () => toggleValue(value),
    dataTestSubj: `pplBuilderFilterValueOption-${index}-${value}`,
  }));

  const placeholder = multi
    ? i18n.translate('explore.pplBuilder.filterValuesPlaceholder', {
        defaultMessage: 'value, value…',
      })
    : i18n.translate('explore.pplBuilder.filterValuePlaceholder', { defaultMessage: 'value' });
  const display = values.length > 0 ? values.join(', ') : placeholder;
  const triggerSubj = multi ? `pplBuilderFilterValues-${index}` : `pplBuilderFilterValue-${index}`;

  return (
    <SearchPopoverMenu
      options={options}
      checkable={multi}
      keepOpenOnSelect={multi}
      allowCreate={{
        onCreate: (value) => {
          if (!multi) {
            onChange([value]);
          } else if (!values.includes(value)) {
            onChange([...values, value]);
          }
        },
        dataTestSubj: `pplBuilderFilterValueCreate-${index}`,
      }}
      searchPlaceholder={i18n.translate('explore.pplBuilder.filterValueSearch', {
        defaultMessage: 'Value…',
      })}
      emptyMessage={i18n.translate('explore.pplBuilder.filterNoValues', {
        defaultMessage: 'Type a value',
      })}
      searchDataTestSubj={`${triggerSubj}-search`}
      trigger={(toggle) => ({
        anchor: (
          <button
            type="button"
            className={classNames('plqWhereChip__val', {
              'plqWhereChip__val--empty': values.length === 0,
            })}
            onClick={toggle}
            aria-label={i18n.translate('explore.pplBuilder.filterValueFor', {
              defaultMessage: 'Value for {field}',
              values: { field },
            })}
            data-test-subj={triggerSubj}
          >
            <span className="plqWhereChip__valText">{display}</span>
            <EuiIcon type="arrowDown" size="s" className="plqWhereChip__caret" />
          </button>
        ),
      })}
    />
  );
};

/** A bare inline numeric `<input>` for a range bound, sized to its content. */
const RangeInput: React.FC<{
  value: string;
  placeholder: string;
  ariaLabel: string;
  onChange: (value: string) => void;
  dataTestSubj: string;
}> = ({ value, placeholder, ariaLabel, onChange, dataTestSubj }) => (
  <input
    className="plqWhereChip__range"
    value={value}
    placeholder={placeholder}
    onChange={(e) => onChange(e.target.value)}
    style={{ width: inputWidth(value || placeholder, 12, 32, 120) }}
    aria-label={ariaLabel}
    data-test-subj={dataTestSubj}
  />
);

/**
 * The adaptive value editor inside a chip: nothing for exists/not_exists, a
 * suggestion popover for is/is_not and the one-of forms, and a from/to pair of
 * numeric inputs for the between forms. Each shape maps 1:1 onto the operator's
 * arity (see {@link operatorArity}) and writes straight back into `values`.
 */
const ChipValues: React.FC<{
  filter: WhereFilter;
  index: number;
  getValues: (field: string) => Promise<string[]>;
  onChange: (values: string[]) => void;
}> = ({ filter, index, getValues, onChange }) => {
  const arity = operatorArity(filter.operator);

  if (arity === 'none') return null;

  if (arity === 'range') {
    return (
      <>
        <RangeInput
          value={filter.values[0] ?? ''}
          placeholder={i18n.translate('explore.pplBuilder.filterFrom', { defaultMessage: 'from' })}
          ariaLabel={i18n.translate('explore.pplBuilder.filterFromValue', {
            defaultMessage: 'From value',
          })}
          onChange={(v) => onChange([v, filter.values[1] ?? ''])}
          dataTestSubj={`pplBuilderFilterRangeFrom-${index}`}
        />
        <span className="plqWhereChip__nat">
          {i18n.translate('explore.pplBuilder.filterAnd', { defaultMessage: 'and' })}
        </span>
        <RangeInput
          value={filter.values[1] ?? ''}
          placeholder={i18n.translate('explore.pplBuilder.filterTo', { defaultMessage: 'to' })}
          ariaLabel={i18n.translate('explore.pplBuilder.filterToValue', {
            defaultMessage: 'To value',
          })}
          onChange={(v) => onChange([filter.values[0] ?? '', v])}
          dataTestSubj={`pplBuilderFilterRangeTo-${index}`}
        />
      </>
    );
  }

  return (
    <ChipValuePopover
      field={filter.field}
      values={filter.values}
      multi={arity === 'many'}
      index={index}
      getValues={getValues}
      onChange={onChange}
    />
  );
};

/**
 * One structured filter as an inline-editable chip: the field name (monospace),
 * an operator picker, the adaptive value editor, and its own ✕. Editing any part
 * dispatches `SET_FILTER` so the PPL regenerates live — no editor popover, matching
 * the v5 builder mock where a chip *is* the editor. Changing the operator across
 * arities (e.g. `is` → `is between`) clears the values so a stale single value
 * can't leak into a range/none input, mirroring the Discover filter editor.
 */
const WhereChip: React.FC<{
  filter: WhereFilter;
  index: number;
  getValues: (field: string) => Promise<string[]>;
  dispatch: React.Dispatch<BuilderAction>;
}> = ({ filter, index, getValues, dispatch }) => {
  const predicate = compileWhereFilter(filter);
  const tooltip = predicate
    ? i18n.translate('explore.pplBuilder.filterChipTooltip', {
        defaultMessage: 'where {predicate}',
        values: { predicate },
      })
    : i18n.translate('explore.pplBuilder.filterChipIncomplete', {
        defaultMessage: 'Finish this condition',
      });

  const setOperator = (operator: WhereOperator) => {
    const values = operatorArity(operator) === operatorArity(filter.operator) ? filter.values : [];
    dispatch({ type: 'SET_FILTER', index, filter: { operator, values } });
  };
  const setValues = (values: string[]) =>
    dispatch({ type: 'SET_FILTER', index, filter: { values } });

  return (
    <span className="plqWhereChip" data-test-subj={`pplBuilderFilterChip-${index}`}>
      <EuiToolTip content={tooltip} position="top">
        <span className="plqWhereChip__field">{filter.field}</span>
      </EuiToolTip>
      <OperatorPopover filter={filter} index={index} onChange={setOperator} />
      <ChipValues filter={filter} index={index} getValues={getValues} onChange={setValues} />
      <RemoveButton
        variant="chip"
        ariaLabel={i18n.translate('explore.pplBuilder.removeFilter', {
          defaultMessage: 'Remove filter on {field}',
          values: { field: filter.field },
        })}
        onClick={() => dispatch({ type: 'REMOVE_FILTER', index })}
        dataTestSubj={`pplBuilderRemoveFilter-${index}`}
      />
    </span>
  );
};

/**
 * The builder's "Where" section, matching the v5 mock: when there are no filters
 * it is a single ghost "＋ Where" affordance (opening the field picker); once a
 * filter exists it becomes a `Where`-labeled control box holding one inline-
 * editable {@link WhereChip} per condition (AND'd), with an inline dashed "＋" to
 * add more. Removing the last chip collapses back to the ghost — like Sort,
 * unlike the group-by box which keeps an "everything" default. Filters compile to
 * `| where` pipe stages (see `buildPPL`) and round-trip via `parsePPL`.
 */
export const WhereRow: React.FC<WhereRowProps> = ({ filters, fieldNames, getValues, dispatch }) => {
  const addFilter = (field: string) =>
    dispatch({ type: 'ADD_FILTER', filter: { field, operator: 'is', values: [] } });

  if (filters.length === 0) {
    return (
      <span className="plqWhere" data-test-subj="pplBuilderWhere">
        <AddFilterMenu
          fieldNames={fieldNames}
          onPick={addFilter}
          anchor={(toggle) => (
            <GhostAddButton
              label={i18n.translate('explore.pplBuilder.where', { defaultMessage: 'Where' })}
              onClick={toggle}
              dataTestSubj="pplBuilderAddFilter"
            />
          )}
        />
      </span>
    );
  }

  return (
    <ControlGroup
      label={i18n.translate('explore.pplBuilder.where', { defaultMessage: 'Where' })}
      dataTestSubj="pplBuilderWhere"
    >
      {filters.map((filter, index) => (
        <WhereChip
          key={filter.id}
          filter={filter}
          index={index}
          getValues={getValues}
          dispatch={dispatch}
        />
      ))}
      <AddFilterMenu
        fieldNames={fieldNames}
        onPick={addFilter}
        anchor={(toggle) => (
          <EuiButtonIcon
            className="plqIconBtn plqIconBtn--ghost plqWhere__add"
            iconType="plus"
            color="text"
            size="s"
            aria-label={i18n.translate('explore.pplBuilder.addFilterCondition', {
              defaultMessage: 'Add filter condition',
            })}
            onClick={toggle}
            data-test-subj="pplBuilderAddFilterCondition"
          />
        )}
      />
    </ControlGroup>
  );
};
