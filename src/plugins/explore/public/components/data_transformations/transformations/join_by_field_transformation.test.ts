/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { joinByFieldMethod } from './join_by_field_transformation';

const a = {
  refId: 'A',
  rows: [
    { Time: '2019-11-01', value1: 20 },
    { Time: '2020-01-01', value1: 10 },
  ],
  fieldSchema: [
    { name: 'Time', type: 'date' },
    { name: 'value1', type: 'integer' },
  ],
};
const b = {
  refId: 'B',
  rows: [{ Time: '2020-01-01', value2: 100 }],
  fieldSchema: [
    { name: 'Time', type: 'date' },
    { name: 'value2', type: 'integer' },
  ],
};

describe('joinByFieldMethod', () => {
  it('inner join keeps only shared values (design doc example)', () => {
    const result = joinByFieldMethod([a, b], { mode: 'inner', field: 'Time' });
    expect(result.status).toBe('applied');
    expect(result.series[0].rows).toEqual([{ Time: '2020-01-01', value1: 10, value2: 100 }]);
  });

  it('outer join keeps every value, null where a series has no row (design doc example)', () => {
    const result = joinByFieldMethod([a, b], { mode: 'outer', field: 'Time' });
    expect(result.series[0].rows).toEqual([
      { Time: '2019-11-01', value1: 20, value2: null },
      { Time: '2020-01-01', value1: 10, value2: 100 },
    ]);
    expect(result.series[0].fieldSchema.map(({ name }) => name)).toEqual([
      'Time',
      'value1',
      'value2',
    ]);
  });

  it('renames a clashing non-key field with its refId', () => {
    const b2 = {
      ...b,
      rows: [{ Time: '2020-01-01', value1: 5 }],
      fieldSchema: [b.fieldSchema[0], { name: 'value1', type: 'integer' }],
    };
    const result = joinByFieldMethod([a, b2], { mode: 'inner', field: 'Time' });
    expect(result.series[0].rows).toEqual([{ Time: '2020-01-01', value1: 10, 'value1 (B)': 5 }]);
  });

  it('passes through a series without the field', () => {
    const c = { refId: 'C', rows: [{ x: 1 }], fieldSchema: [{ name: 'x', type: 'integer' }] };
    const result = joinByFieldMethod([a, b, c], { mode: 'outer', field: 'Time' });
    expect(result.status).toBe('partially_applied');
    expect(result.series.map(({ refId }) => refId)).toEqual(['A,B', 'C']);
    expect(result.issues[0].code).toBe('missing_fields');
  });

  it('is invalid without a field', () => {
    expect(joinByFieldMethod([a, b], { mode: 'inner', field: undefined }).issues[0].code).toBe(
      'invalid_config'
    );
  });
});
