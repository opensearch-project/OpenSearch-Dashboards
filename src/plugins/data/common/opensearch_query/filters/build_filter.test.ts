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

import { buildFilter, FilterStateStore, FILTERS } from '.';
import { stubIndexPattern, stubFields } from '../../../common/stubs';

describe('buildFilter', () => {
  it('should build phrase filters', () => {
    const params = 'foo';
    const alias = 'bar';
    const state = FilterStateStore.APP_STATE;
    const filter = buildFilter(
      stubIndexPattern,
      stubFields[0],
      FILTERS.PHRASE,
      false,
      false,
      params,
      alias,
      state
    );
    expect(filter.meta.negate).toBe(false);
    expect(filter.meta.alias).toBe(alias);

    expect(filter.$state).toBeDefined();
    if (filter.$state) {
      expect(filter.$state.store).toBe(state);
    }
  });

  it('should build an exact formatted range for picker-generated date values', () => {
    const field = stubFields.find(({ type }) => type === 'date')!;
    const epochMillis = Date.parse('2026-09-16T10:15:30.000Z');
    const filter = buildFilter(
      stubIndexPattern,
      field,
      FILTERS.PHRASE,
      false,
      false,
      epochMillis,
      null,
      FilterStateStore.APP_STATE
    );

    expect(filter).toMatchObject({
      meta: {
        params: { query: epochMillis },
        type: FILTERS.PHRASE,
      },
      range: {
        [field.name]: {
          gte: '2026-09-16T10:15:30.000Z',
          lte: '2026-09-16T10:15:30.000Z',
          format: 'strict_date_optional_time',
        },
      },
    });
  });

  it('should preserve mapping-driven phrase queries for manually entered dates', () => {
    const field = stubFields.find(({ type }) => type === 'date')!;
    const filter = buildFilter(
      stubIndexPattern,
      field,
      FILTERS.PHRASE,
      false,
      false,
      'now-15m',
      null,
      FilterStateStore.APP_STATE
    );

    expect(filter).toMatchObject({
      query: {
        match_phrase: {
          [field.name]: 'now-15m',
        },
      },
    });
  });

  it('should build phrases filters', () => {
    const params = ['foo', 'bar'];
    const alias = 'bar';
    const state = FilterStateStore.APP_STATE;
    const filter = buildFilter(
      stubIndexPattern,
      stubFields[0],
      FILTERS.PHRASES,
      false,
      false,
      params,
      alias,
      state
    );
    expect(filter.meta.type).toBe(FILTERS.PHRASES);
    expect(filter.meta.negate).toBe(false);
    expect(filter.meta.alias).toBe(alias);
    expect(filter.$state).toBeDefined();
    if (filter.$state) {
      expect(filter.$state.store).toBe(state);
    }
  });

  it('should build range filters', () => {
    const params = { from: 'foo', to: 'qux' };
    const alias = 'bar';
    const state = FilterStateStore.APP_STATE;
    const filter = buildFilter(
      stubIndexPattern,
      stubFields[0],
      FILTERS.RANGE,
      false,
      false,
      params,
      alias,
      state
    );
    expect(filter.meta.negate).toBe(false);
    expect(filter.meta.alias).toBe(alias);
    expect(filter.$state).toBeDefined();
    if (filter.$state) {
      expect(filter.$state.store).toBe(state);
    }
  });

  it('should build formatted ISO ranges for picker-generated date endpoints', () => {
    const field = stubFields.find(({ type }) => type === 'date')!;
    const filter = buildFilter(
      stubIndexPattern,
      field,
      FILTERS.RANGE,
      false,
      false,
      {
        from: Date.parse('2026-09-16T10:15:30.000Z'),
        to: '2026-09-17T10:15:30.000Z',
      },
      null,
      FilterStateStore.APP_STATE
    );

    expect(filter).toMatchObject({
      range: {
        [field.name]: {
          gte: '2026-09-16T10:15:30.000Z',
          lt: '2026-09-17T10:15:30.000Z',
          format: 'strict_date_optional_time',
        },
      },
    });
  });

  it('should preserve mapping-driven ranges for manually entered date math', () => {
    const field = stubFields.find(({ type }) => type === 'date')!;
    const filter = buildFilter(
      stubIndexPattern,
      field,
      FILTERS.RANGE,
      false,
      false,
      { from: 'now-1d', to: 'now' },
      null,
      FilterStateStore.APP_STATE
    );

    expect(filter).toMatchObject({
      range: {
        [field.name]: {
          gte: 'now-1d',
          lt: 'now',
        },
      },
    });
    expect((filter as any).range[field.name]).not.toHaveProperty('format');
  });

  it('should build exists filters', () => {
    const params = undefined;
    const alias = 'bar';
    const state = FilterStateStore.APP_STATE;
    const filter = buildFilter(
      stubIndexPattern,
      stubFields[0],
      FILTERS.EXISTS,
      false,
      false,
      params,
      alias,
      state
    );
    expect(filter.meta.negate).toBe(false);
    expect(filter.meta.alias).toBe(alias);
    expect(filter.$state).toBeDefined();
    if (filter.$state) {
      expect(filter.$state.store).toBe(state);
    }
  });

  it('should include disabled state', () => {
    const params = undefined;
    const alias = 'bar';
    const state = FilterStateStore.APP_STATE;
    const filter = buildFilter(
      stubIndexPattern,
      stubFields[0],
      FILTERS.EXISTS,
      true,
      true,
      params,
      alias,
      state
    );
    expect(filter.meta.disabled).toBe(true);
    expect(filter.meta.negate).toBe(true);
  });
});
