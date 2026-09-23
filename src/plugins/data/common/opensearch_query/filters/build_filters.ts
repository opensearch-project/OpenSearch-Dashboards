/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import dateMath from '@elastic/datemath';
import { IIndexPattern, IFieldType } from '../..';
import {
  Filter,
  FILTERS,
  FilterStateStore,
  FilterMeta,
  buildPhraseFilter,
  buildPhrasesFilter,
  buildRangeFilter,
  buildExistsFilter,
  RangeFilterParams,
} from '.';

const DATE_PICKER_QUERY_FORMAT = 'strict_date_optional_time';

// Manual date input remains a string; only picker selections are emitted as epoch milliseconds.
const isPickerDateValue = (field: IFieldType, value: unknown): value is number =>
  field.type === 'date' &&
  typeof value === 'number' &&
  Number.isFinite(value) &&
  !Number.isNaN(new Date(value).getTime());

const toISOString = (value: number) => new Date(value).toISOString();

const normalizeDateRangeValue = (value?: string | number) => {
  if (typeof value === 'number') {
    return toISOString(value);
  }

  if (typeof value === 'string' && !value.startsWith('now')) {
    const parsedValue = dateMath.parse(value);
    return parsedValue?.isValid() ? parsedValue.toISOString() : value;
  }

  return value;
};

export function buildFilter(
  indexPattern: IIndexPattern,
  field: IFieldType,
  type: FILTERS,
  negate: boolean,
  disabled: boolean,
  params: any,
  alias: string | null,
  store: FilterStateStore
): Filter {
  const filter = buildBaseFilter(indexPattern, field, type, params);
  filter.meta.alias = alias;
  filter.meta.negate = negate;
  filter.meta.disabled = disabled;
  filter.$state = { store };
  return filter;
}

export function buildCustomFilter(
  indexPatternString: string,
  queryDsl: any,
  disabled: boolean,
  negate: boolean,
  alias: string | null,
  store: FilterStateStore
): Filter {
  const meta: FilterMeta = {
    index: indexPatternString,
    type: FILTERS.CUSTOM,
    disabled,
    negate,
    alias,
  };
  const filter: Filter = { ...queryDsl, meta };
  filter.$state = { store };
  return filter;
}

function buildBaseFilter(
  indexPattern: IIndexPattern,
  field: IFieldType,
  type: FILTERS,
  params: any
): Filter {
  switch (type) {
    case 'phrase': {
      if (isPickerDateValue(field, params)) {
        const value = toISOString(params);
        const filter = buildRangeFilter(
          field,
          {
            gte: value,
            lte: value,
            format: DATE_PICKER_QUERY_FORMAT,
          },
          indexPattern
        );
        filter.meta.type = FILTERS.PHRASE;
        filter.meta.params = { query: params };
        return filter;
      }
      return buildPhraseFilter(field, params, indexPattern);
    }
    case 'phrases':
      return buildPhrasesFilter(field, params, indexPattern);
    case 'range': {
      const containsPickerDateValue =
        isPickerDateValue(field, params.from) || isPickerDateValue(field, params.to);
      const newParams: RangeFilterParams = containsPickerDateValue
        ? {
            gte: normalizeDateRangeValue(params.from),
            lt: normalizeDateRangeValue(params.to),
            format: DATE_PICKER_QUERY_FORMAT,
          }
        : { gte: params.from, lt: params.to };
      return buildRangeFilter(field, newParams, indexPattern);
    }
    case 'exists':
      return buildExistsFilter(field, indexPattern);
    default:
      throw new Error(`Unknown filter type: ${type}`);
  }
}
