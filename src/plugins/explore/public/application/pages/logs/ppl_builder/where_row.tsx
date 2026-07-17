/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { i18n } from '@osd/i18n';
import { EuiButtonIcon, EuiIcon, EuiToolTip } from '@elastic/eui';
import { BuilderAction, compileWhereFilter } from './build_ppl';
import { WhereFilter, WhereOperator } from './types';
import { OPERATOR_DEF_MAP, operatorArity, operatorsForFieldType } from './where_operators';
import { SearchPopoverMenu, SearchMenuOption } from './search_popover_menu';
import {
  ControlGroup,
  GhostAddButton,
  RemoveButton,
  inputWidth,
} from '../../../components/query_builder';

interface WhereRowProps {
  filters: WhereFilter[];
  fieldNames: string[];
  getFieldType: (field: string) => string | undefined;
  getValues: (field: string) => Promise<string[]>;
  dispatch: React.Dispatch<BuilderAction>;
}

const fieldSuggestsValues = (fieldType?: string): boolean => !fieldType || fieldType === 'string';

const CHIP_MONO_FONT = '11.5px "Source Code Pro", Consolas, Menlo, Courier, monospace';

const emptyValueLabel = () =>
  i18n.translate('explore.pplBuilder.filterEmptyValue', { defaultMessage: '(empty)' });

// Render a value that may be the empty string as a muted "(empty)" marker.
const renderValue = (value: string): React.ReactNode =>
  value === '' ? <span className="plqWhereChip__emptyVal">{emptyValueLabel()}</span> : value;

// "Value for {field}" aria-label, shared by the popover trigger and the plain
// single-value text input.
const valueForLabel = (field: string) =>
  i18n.translate('explore.pplBuilder.filterValueFor', {
    defaultMessage: 'Value for {field}',
    values: { field },
  });

const ChipCaretButton: React.FC<{
  className: string;
  labelClassName?: string;
  label: React.ReactNode;
  ariaLabel: string;
  dataTestSubj: string;
  onClick: () => void;
}> = ({ className, labelClassName, label, ariaLabel, dataTestSubj, onClick }) => (
  <button
    type="button"
    className={className}
    onClick={onClick}
    aria-label={ariaLabel}
    data-test-subj={dataTestSubj}
  >
    <span className={labelClassName}>{label}</span>
    <EuiIcon type="arrowDown" size="s" className="plqWhereChip__caret" />
  </button>
);

const AddFilterMenu: React.FC<{
  fieldNames: string[];
  onPick: (field: string) => void;
  anchor: (toggle: () => void) => React.ReactElement;
}> = ({ fieldNames, onPick, anchor }) => {
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;
  const options: SearchMenuOption[] = useMemo(
    () =>
      fieldNames.map((field) => ({
        key: field,
        label: field,
        onSelect: () => onPickRef.current(field),
        dataTestSubj: `pplBuilderFilterFieldOption-${field}`,
      })),
    [fieldNames]
  );
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

const OperatorPopover: React.FC<{
  filter: WhereFilter;
  index: number;
  fieldType?: string;
  onChange: (operator: WhereOperator) => void;
}> = ({ filter, index, fieldType, onChange }) => {
  const current = OPERATOR_DEF_MAP[filter.operator];
  const options: SearchMenuOption[] = operatorsForFieldType(fieldType).map((def) => ({
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
          <ChipCaretButton
            className="plqWhereChip__op"
            label={current.shortLabel}
            ariaLabel={i18n.translate('explore.pplBuilder.filterOperatorFor', {
              defaultMessage: 'Operator for {field}',
              values: { field: filter.field },
            })}
            dataTestSubj={`pplBuilderFilterOperator-${index}`}
            onClick={toggle}
          />
        ),
      })}
    />
  );
};

const ChipValuePopover: React.FC<{
  field: string;
  values: string[];
  multi: boolean;
  index: number;
  suggest: boolean;
  getValues: (field: string) => Promise<string[]>;
  onChange: (values: string[]) => void;
}> = ({ field, values, multi, index, suggest, getValues, onChange }) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const liveRef = useRef(true);
  useEffect(() => {
    setSuggestions([]);
  }, [field]);
  useEffect(() => {
    liveRef.current = true;
    return () => {
      liveRef.current = false;
    };
  }, []);

  const loadSuggestions = () => {
    if (!suggest) return;
    getValues(field).then(
      (vals) => {
        if (liveRef.current) setSuggestions(vals);
      },
      () => {
        if (liveRef.current) setSuggestions([]);
      }
    );
  };

  const toggleValue = (value: string) => {
    if (!multi) {
      onChange([value]);
      return;
    }
    onChange(values.includes(value) ? values.filter((v) => v !== value) : [...values, value]);
  };

  // Include any selected values that aren't in the fetched suggestions (custom
  // typed-in values, or every value when the field doesn't suggest) so they
  // still render as checked rows and can be toggled back off.
  const optionValues = [...suggestions, ...values.filter((v) => !suggestions.includes(v))];
  const options: SearchMenuOption[] = optionValues.map((value) => ({
    key: value,
    label: renderValue(value),
    filterText: value === '' ? emptyValueLabel() : value,
    selected: values.includes(value),
    onSelect: () => toggleValue(value),
    dataTestSubj: `pplBuilderFilterValueOption-${index}-${value}`,
  }));

  const placeholder = multi
    ? i18n.translate('explore.pplBuilder.filterValuesPlaceholder', {
        defaultMessage: 'values',
      })
    : i18n.translate('explore.pplBuilder.filterValuePlaceholder', { defaultMessage: 'value' });
  const display =
    values.length > 0
      ? values.map((value, i) => (
          <React.Fragment key={i}>
            {i > 0 && ', '}
            {renderValue(value)}
          </React.Fragment>
        ))
      : placeholder;
  const triggerSubj = multi ? `pplBuilderFilterValues-${index}` : `pplBuilderFilterValue-${index}`;

  return (
    <SearchPopoverMenu
      options={options}
      checkable={multi}
      keepOpenOnSelect={multi}
      onOpen={loadSuggestions}
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
          <ChipCaretButton
            className={classNames('plqWhereChip__val', {
              'plqWhereChip__val--empty': values.length === 0,
            })}
            labelClassName="plqWhereChip__valText"
            label={display}
            ariaLabel={valueForLabel(field)}
            dataTestSubj={triggerSubj}
            onClick={toggle}
          />
        ),
      })}
    />
  );
};

const ChipTextInput: React.FC<{
  value: string;
  placeholder: string;
  ariaLabel: string;
  inputMode?: 'numeric' | 'text';
  onChange: (value: string) => void;
  dataTestSubj: string;
}> = ({ value, placeholder, ariaLabel, inputMode = 'text', onChange, dataTestSubj }) => (
  <input
    className="plqWhereChip__range"
    value={value}
    placeholder={placeholder}
    inputMode={inputMode}
    onChange={(e) => onChange(e.target.value)}
    style={{ width: inputWidth(value || placeholder, 12, 32, 4000, CHIP_MONO_FONT) }}
    aria-label={ariaLabel}
    data-test-subj={dataTestSubj}
  />
);

const ChipValues: React.FC<{
  filter: WhereFilter;
  index: number;
  fieldType?: string;
  getValues: (field: string) => Promise<string[]>;
  onChange: (values: string[]) => void;
}> = ({ filter, index, fieldType, getValues, onChange }) => {
  const arity = operatorArity(filter.operator);

  if (arity === 'none') return null;

  const numeric = fieldType === 'number';

  const inputMode = numeric ? 'numeric' : 'text';

  if (arity === 'range') {
    return (
      <>
        <ChipTextInput
          value={filter.values[0] ?? ''}
          placeholder={i18n.translate('explore.pplBuilder.filterFrom', { defaultMessage: 'from' })}
          ariaLabel={i18n.translate('explore.pplBuilder.filterFromValue', {
            defaultMessage: 'From value',
          })}
          inputMode={inputMode}
          onChange={(v) => onChange([v, filter.values[1] ?? ''])}
          dataTestSubj={`pplBuilderFilterRangeFrom-${index}`}
        />
        <span className="plqWhereChip__nat">
          {i18n.translate('explore.pplBuilder.filterAnd', { defaultMessage: 'and' })}
        </span>
        <ChipTextInput
          value={filter.values[1] ?? ''}
          placeholder={i18n.translate('explore.pplBuilder.filterTo', { defaultMessage: 'to' })}
          ariaLabel={i18n.translate('explore.pplBuilder.filterToValue', {
            defaultMessage: 'To value',
          })}
          inputMode={inputMode}
          onChange={(v) => onChange([filter.values[0] ?? '', v])}
          dataTestSubj={`pplBuilderFilterRangeTo-${index}`}
        />
      </>
    );
  }

  if (arity === 'one' && !fieldSuggestsValues(fieldType)) {
    return (
      <ChipTextInput
        value={filter.values[0] ?? ''}
        placeholder={i18n.translate('explore.pplBuilder.filterValuePlaceholder', {
          defaultMessage: 'value',
        })}
        ariaLabel={valueForLabel(filter.field)}
        inputMode={inputMode}
        onChange={(v) => onChange([v])}
        dataTestSubj={`pplBuilderFilterValue-${index}`}
      />
    );
  }

  return (
    <ChipValuePopover
      field={filter.field}
      values={filter.values}
      multi={arity === 'many'}
      index={index}
      suggest={fieldSuggestsValues(fieldType)}
      getValues={getValues}
      onChange={onChange}
    />
  );
};

const WhereChip: React.FC<{
  filter: WhereFilter;
  index: number;
  fieldType?: string;
  fieldNames: string[];
  getValues: (field: string) => Promise<string[]>;
  dispatch: React.Dispatch<BuilderAction>;
}> = ({ filter, index, fieldType, fieldNames, getValues, dispatch }) => {
  // Resolve to this chip's known field type so the tooltip preview quotes
  // values the same way buildPPL does when it emits the query.
  const predicate = compileWhereFilter(filter, () => fieldType);
  const tooltip = predicate
    ? i18n.translate('explore.pplBuilder.filterChipTooltip', {
        defaultMessage: 'where {predicate}',
        values: { predicate },
      })
    : i18n.translate('explore.pplBuilder.filterChipIncomplete', {
        defaultMessage: 'Finish this condition',
      });

  const setField = (field: string) => {
    if (field === filter.field) return;
    dispatch({ type: 'SET_FILTER', index, filter: { field, operator: 'is', values: [] } });
  };
  const setOperator = (operator: WhereOperator) => {
    const values = operatorArity(operator) === operatorArity(filter.operator) ? filter.values : [];
    dispatch({ type: 'SET_FILTER', index, filter: { operator, values } });
  };
  const setValues = (values: string[]) =>
    dispatch({ type: 'SET_FILTER', index, filter: { values } });

  return (
    <span className="plqWhereChip" data-test-subj={`pplBuilderFilterChip-${index}`}>
      <AddFilterMenu
        fieldNames={fieldNames}
        onPick={setField}
        anchor={(toggle) => (
          <EuiToolTip content={tooltip} position="top">
            <ChipCaretButton
              className="plqWhereChip__field"
              label={filter.field}
              ariaLabel={i18n.translate('explore.pplBuilder.filterFieldFor', {
                defaultMessage: 'Field for filter {index}',
                values: { index: index + 1 },
              })}
              dataTestSubj={`pplBuilderFilterField-${index}`}
              onClick={toggle}
            />
          </EuiToolTip>
        )}
      />
      <OperatorPopover filter={filter} index={index} fieldType={fieldType} onChange={setOperator} />
      <ChipValues
        filter={filter}
        index={index}
        fieldType={fieldType}
        getValues={getValues}
        onChange={setValues}
      />
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

export const WhereRow: React.FC<WhereRowProps> = ({
  filters,
  fieldNames,
  getFieldType,
  getValues,
  dispatch,
}) => {
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
      className="plqGroup--wrap"
      label={i18n.translate('explore.pplBuilder.where', { defaultMessage: 'Where' })}
      dataTestSubj="pplBuilderWhere"
    >
      {filters.map((filter, index) => (
        <WhereChip
          key={filter.id}
          filter={filter}
          index={index}
          fieldType={getFieldType(filter.field)}
          fieldNames={fieldNames}
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
