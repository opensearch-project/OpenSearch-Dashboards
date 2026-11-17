/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { organizeFieldsMethod, orderFields } from './organize_fields_transformation';

const series = {
  refId: 'A',
  rows: [{ a: 1, b: 'x', c: '2020-01-01' }],
  fieldSchema: [
    { name: 'a', type: 'integer' },
    { name: 'b', type: 'string' },
    { name: 'c', type: 'date' },
  ],
};

describe('organizeFieldsMethod', () => {
  it('hides, renames (keeping the type) and reorders', () => {
    const result = organizeFieldsMethod([series], {
      excludeByName: { b: true },
      renameByName: { c: 'when' },
      indexByName: { c: 0, a: 1, b: 2 },
    });
    expect(result.status).toBe('applied');
    expect(result.series[0].rows).toEqual([{ when: '2020-01-01', a: 1 }]);
    expect(Object.keys(result.series[0].rows[0])).toEqual(['when', 'a']);
    expect(result.series[0].fieldSchema).toEqual([
      { name: 'when', type: 'date' },
      { name: 'a', type: 'integer' },
    ]);
  });

  it('skips a rename onto a field that is kept, keeping both values', () => {
    const result = organizeFieldsMethod([series], {
      excludeByName: {},
      renameByName: { b: 'a' },
      indexByName: {},
    });
    expect(result.status).toBe('partially_applied');
    expect(result.issues[0].code).toBe('duplicate_keys');
    expect(result.series[0].rows).toEqual([{ a: 1, b: 'x', c: '2020-01-01' }]);
    expect(result.series[0].fieldSchema.map(({ name }) => name)).toEqual(['a', 'b', 'c']);
  });

  it('allows swapping two names, and renaming onto a hidden field', () => {
    const swapped = organizeFieldsMethod([series], {
      excludeByName: {},
      renameByName: { a: 'b', b: 'a' },
      indexByName: {},
    });
    expect(swapped.status).toBe('applied');
    expect(swapped.series[0].rows).toEqual([{ b: 1, a: 'x', c: '2020-01-01' }]);

    const ontoHidden = organizeFieldsMethod([series], {
      excludeByName: { a: true },
      renameByName: { b: 'a' },
      indexByName: {},
    });
    expect(ontoHidden.status).toBe('applied');
    expect(ontoHidden.series[0].rows).toEqual([{ a: 'x', c: '2020-01-01' }]);
  });

  it('leaves out row keys outside the schema', () => {
    const result = organizeFieldsMethod(
      [{ ...series, rows: [{ a: 1, b: 'x', c: '2020-01-01', extra: true }] }],
      { excludeByName: { c: true }, renameByName: {}, indexByName: {} }
    );
    expect(result.series[0].rows).toEqual([{ a: 1, b: 'x' }]);
  });

  it('skips with nothing configured', () => {
    expect(
      organizeFieldsMethod([series], { excludeByName: {}, renameByName: {}, indexByName: {} })
        .status
    ).toBe('skipped');
  });

  it('orders placed fields first, the rest after in order', () => {
    expect(
      orderFields([{ name: 'a' }, { name: 'b' }, { name: 'c' }], { c: 0 }).map((f) => f.name)
    ).toEqual(['c', 'a', 'b']);
  });
});
