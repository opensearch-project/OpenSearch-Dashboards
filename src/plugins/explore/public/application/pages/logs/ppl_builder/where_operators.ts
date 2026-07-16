/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { WhereFilter, WhereOperator } from './types';

/**
 * How many value inputs an operator's chip renders:
 * - `none`  — no value (exists / does not exist)
 * - `one`   — a single value (is / is not)
 * - `many`  — a comma-joined list of values (is one of / is not one of)
 * - `range` — two bounds, from/to (is between / is not between)
 */
export type OperatorArity = 'none' | 'one' | 'many' | 'range';

export interface OperatorDef {
  value: WhereOperator;
  /** Full label shown in the operator menu (e.g. "is one of"). */
  label: string;
  /**
   * Terse label shown inside the compact inline chip select. Kept short so the
   * chip stays dense (matching the mock's `= != > <` operator width); the full
   * label lives in the dropdown options and the chip tooltip.
   */
  shortLabel: string;
  arity: OperatorArity;
  /**
   * The (OSD-normalized) field types this operator applies to; `undefined` means
   * every type. Mirrors the `fieldTypes` gating on the data plugin's
   * `FILTER_OPERATORS` (see `getOperatorOptions`) so the builder's operator menu
   * offers the same operators Discover's filter editor does for a given field —
   * e.g. `is between` only for number/date/ip, `is one of` not for boolean.
   */
  fieldTypes?: string[];
}

// Field types that accept the list / range operators, matching the data plugin's
// filter editor. `is one of` / `is not one of` exclude boolean; the between forms
// are numeric/temporal/ip only.
const LIST_FIELD_TYPES = ['string', 'number', 'date', 'ip', 'geo_point', 'geo_shape'];
const RANGE_FIELD_TYPES = ['number', 'date', 'ip'];

export const OPERATOR_DEFS: OperatorDef[] = [
  {
    value: 'is',
    label: i18n.translate('explore.pplBuilder.filterOperator.is', { defaultMessage: 'is' }),
    shortLabel: '=',
    arity: 'one',
  },
  {
    value: 'is_not',
    label: i18n.translate('explore.pplBuilder.filterOperator.isNot', { defaultMessage: 'is not' }),
    shortLabel: '≠',
    arity: 'one',
  },
  {
    value: 'is_one_of',
    label: i18n.translate('explore.pplBuilder.filterOperator.isOneOf', {
      defaultMessage: 'is one of',
    }),
    shortLabel: 'in',
    arity: 'many',
    fieldTypes: LIST_FIELD_TYPES,
  },
  {
    value: 'is_not_one_of',
    label: i18n.translate('explore.pplBuilder.filterOperator.isNotOneOf', {
      defaultMessage: 'is not one of',
    }),
    shortLabel: 'not in',
    arity: 'many',
    fieldTypes: LIST_FIELD_TYPES,
  },
  {
    value: 'is_between',
    label: i18n.translate('explore.pplBuilder.filterOperator.isBetween', {
      defaultMessage: 'is between',
    }),
    shortLabel: 'between',
    arity: 'range',
    fieldTypes: RANGE_FIELD_TYPES,
  },
  {
    value: 'is_not_between',
    label: i18n.translate('explore.pplBuilder.filterOperator.isNotBetween', {
      defaultMessage: 'is not between',
    }),
    shortLabel: 'not between',
    arity: 'range',
    fieldTypes: RANGE_FIELD_TYPES,
  },
  {
    value: 'exists',
    label: i18n.translate('explore.pplBuilder.filterOperator.exists', { defaultMessage: 'exists' }),
    shortLabel: 'exists',
    arity: 'none',
  },
  {
    value: 'not_exists',
    label: i18n.translate('explore.pplBuilder.filterOperator.notExists', {
      defaultMessage: 'does not exist',
    }),
    shortLabel: 'not exists',
    arity: 'none',
  },
];

export const OPERATOR_DEF_MAP: Record<WhereOperator, OperatorDef> = OPERATOR_DEFS.reduce(
  (acc, def) => {
    acc[def.value] = def;
    return acc;
  },
  {} as Record<WhereOperator, OperatorDef>
);

export const operatorArity = (operator: WhereOperator): OperatorArity =>
  OPERATOR_DEF_MAP[operator].arity;

/**
 * The operators offered for a field of the given (OSD-normalized) type, mirroring
 * the data plugin's `getOperatorOptions`: an operator applies when it has no
 * `fieldTypes` restriction or the field's type is in it. An unknown/absent type
 * (the field isn't in the dataset's mapping) falls back to `string`, the most
 * permissive filterable type, so every operator stays available.
 */
export function operatorsForFieldType(fieldType?: string): OperatorDef[] {
  const type = fieldType || 'string';
  return OPERATOR_DEFS.filter((def) => !def.fieldTypes || def.fieldTypes.includes(type));
}

/**
 * Human-readable one-line label for a filter, e.g. `status is one of 200, 404`
 * or `service exists`. Used for tooltips/aria and any text summary of a chip.
 */
export function filterChipLabel(filter: WhereFilter): string {
  const def = OPERATOR_DEF_MAP[filter.operator];
  const opLabel = def?.label ?? filter.operator;
  const arity = def?.arity;
  if (arity === 'none') return `${filter.field} ${opLabel}`;
  if (arity === 'range') {
    const [gte, lt] = filter.values;
    return `${filter.field} ${opLabel} ${gte ?? ''} – ${lt ?? ''}`.trim();
  }
  return `${filter.field} ${opLabel} ${filter.values.filter(Boolean).join(', ')}`.trim();
}
