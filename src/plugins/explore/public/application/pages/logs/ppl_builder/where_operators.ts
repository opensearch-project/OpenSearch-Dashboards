/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { WhereOperator, indexBy } from './types';

export type OperatorArity = 'none' | 'one' | 'many' | 'range';

export interface OperatorDef {
  value: WhereOperator;
  label: string;
  shortLabel: string;
  arity: OperatorArity;
  fieldTypes?: string[];
}

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

export const OPERATOR_DEF_MAP: Record<WhereOperator, OperatorDef> = indexBy(
  OPERATOR_DEFS,
  (def) => def.value
);

export const operatorArity = (operator: WhereOperator): OperatorArity =>
  OPERATOR_DEF_MAP[operator].arity;

export function operatorsForFieldType(fieldType?: string): OperatorDef[] {
  const type = fieldType || 'string';
  return OPERATOR_DEFS.filter((def) => !def.fieldTypes || def.fieldTypes.includes(type));
}
