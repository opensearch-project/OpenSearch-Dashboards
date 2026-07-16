/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiButtonIcon, EuiToolTip } from '@elastic/eui';
import { BuilderAction, compileWhereFilter } from './build_ppl';
import { WhereFilter, WhereOperator } from './types';
import { OPERATOR_DEFS, operatorArity } from './where_operators';
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
  /** Async value suggestions for a field (best-effort; unused for now). */
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

/** A bare inline `<input>` inside a where chip, sized to its content. */
const ChipValueInput: React.FC<{
  value: string;
  placeholder: string;
  ariaLabel: string;
  onChange: (value: string) => void;
  dataTestSubj: string;
}> = ({ value, placeholder, ariaLabel, onChange, dataTestSubj }) => (
  <input
    className="plqWhereChip__val"
    value={value}
    placeholder={placeholder}
    onChange={(e) => onChange(e.target.value)}
    style={{ width: inputWidth(value || placeholder, 12, 40, 200) }}
    aria-label={ariaLabel}
    data-test-subj={dataTestSubj}
  />
);

/**
 * The adaptive value editor inside a chip: nothing for exists/not_exists, one
 * input for is/is_not, a comma-separated input for the one-of forms, and a
 * from/to pair for the between forms. Each shape maps 1:1 onto the operator's
 * arity (see {@link operatorArity}) and writes straight back into `values`.
 */
const ChipValues: React.FC<{
  filter: WhereFilter;
  index: number;
  onChange: (values: string[]) => void;
}> = ({ filter, index, onChange }) => {
  const arity = operatorArity(filter.operator);

  if (arity === 'none') return null;

  if (arity === 'range') {
    return (
      <>
        <ChipValueInput
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
        <ChipValueInput
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

  if (arity === 'many') {
    // A single inline input holding the comma-separated list; splitting on save
    // keeps the chip dense while still accepting several values.
    return (
      <ChipValueInput
        value={filter.values.join(', ')}
        placeholder={i18n.translate('explore.pplBuilder.filterValuesPlaceholder', {
          defaultMessage: 'value, value…',
        })}
        ariaLabel={i18n.translate('explore.pplBuilder.filterValues', { defaultMessage: 'Values' })}
        onChange={(v) =>
          onChange(
            v
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          )
        }
        dataTestSubj={`pplBuilderFilterValues-${index}`}
      />
    );
  }

  // one
  return (
    <ChipValueInput
      value={filter.values[0] ?? ''}
      placeholder={i18n.translate('explore.pplBuilder.filterValuePlaceholder', {
        defaultMessage: 'value',
      })}
      ariaLabel={i18n.translate('explore.pplBuilder.filterValue', { defaultMessage: 'Value' })}
      onChange={(v) => onChange([v])}
      dataTestSubj={`pplBuilderFilterValue-${index}`}
    />
  );
};

/**
 * One structured filter as an inline-editable chip: the field name (monospace),
 * an operator `<select>`, the adaptive value input(s), and its own ✕. Editing any
 * part dispatches `SET_FILTER` so the PPL regenerates live — no popover, matching
 * the v5 builder mock where a chip *is* the editor. Changing the operator across
 * arities (e.g. `is` → `is between`) clears the values so a stale single value
 * can't leak into a range/none input, mirroring the Discover filter editor.
 */
const WhereChip: React.FC<{
  filter: WhereFilter;
  index: number;
  dispatch: React.Dispatch<BuilderAction>;
}> = ({ filter, index, dispatch }) => {
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
      {/*
        A bare native <select> keeps the operator picker dense inside the chip
        (matching the v5 builder mock). onChange is the correct, accessible
        handler for a <select> — the value commits on keyboard or mouse select
        alike; onBlur (what the deprecated jsx-a11y/no-onchange rule prefers)
        would instead break single-click mouse selection.
      */}
      {/* eslint-disable-next-line jsx-a11y/no-onchange */}
      <select
        className="plqWhereChip__op"
        value={filter.operator}
        onChange={(e) => setOperator(e.target.value as WhereOperator)}
        aria-label={i18n.translate('explore.pplBuilder.filterOperatorFor', {
          defaultMessage: 'Operator for {field}',
          values: { field: filter.field },
        })}
        data-test-subj={`pplBuilderFilterOperator-${index}`}
      >
        {OPERATOR_DEFS.map((def) => (
          <option key={def.value} value={def.value}>
            {def.shortLabel}
          </option>
        ))}
      </select>
      <ChipValues filter={filter} index={index} onChange={setValues} />
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
export const WhereRow: React.FC<WhereRowProps> = ({ filters, fieldNames, dispatch }) => {
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
        <WhereChip key={filter.id} filter={filter} index={index} dispatch={dispatch} />
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
