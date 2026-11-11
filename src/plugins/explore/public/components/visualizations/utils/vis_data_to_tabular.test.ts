/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { visDataToTabular } from './vis_data_to_tabular';
import { VisFieldType } from '../types';

describe('visDataToTabular', () => {
  const visData = {
    transformedData: [{ host: 'a', 'count()': 3, bytes: null }],
    numericalColumns: [
      { id: 1, name: 'count()', column: 'count()', schema: VisFieldType.Numerical },
    ],
    categoricalColumns: [{ id: 0, name: 'host', column: 'host', schema: VisFieldType.Categorical }],
    dateColumns: [],
    unknownColumns: [{ id: 2, name: 'bytes', column: 'bytes', schema: VisFieldType.Unknown }],
  } as any;

  const createIndexPattern = (fields: Record<string, string>) =>
    ({
      fields: {
        getByName: (name: string) => (fields[name] ? { name, type: fields[name] } : undefined),
      },
      getFormatterForField: () => ({ convert: (value: unknown) => `<${value}>` }),
    }) as any;

  it('lists the columns in result order, not grouped by type', () => {
    const { columns } = visDataToTabular(visData);
    expect(columns).toEqual([
      { name: 'host', field: 'host' },
      { name: 'count()', field: 'count()' },
      { name: 'bytes', field: 'bytes' },
    ]);
  });

  it('formats values with the field formatter when the field exists', () => {
    const { rows } = visDataToTabular(visData, createIndexPattern({ host: 'string' }));

    expect(rows[0].host.raw).toBe('a');
    expect(rows[0].host.formatted).toBe('<a>');
    // No field in the index pattern: plain string
    expect(rows[0]['count()'].formatted).toBe('3');
  });

  it('formats a missing value as an empty string', () => {
    const { rows } = visDataToTabular(visData);
    expect(rows[0].bytes.formatted).toBe('');
  });

  it('serializes object and array values instead of "[object Object]"', () => {
    const data = {
      transformedData: [{ obj: { a: 1 }, arr: [1, 2] }],
      unknownColumns: [
        { id: 0, name: 'obj', column: 'obj', schema: VisFieldType.Unknown },
        { id: 1, name: 'arr', column: 'arr', schema: VisFieldType.Unknown },
      ],
    } as any;

    const { rows } = visDataToTabular(data);

    expect(rows[0].obj.formatted).toBe('{"a":1}');
    expect(rows[0].arr.formatted).toBe('[1,2]');
  });

  it('skips the field formatter when a transformation changed the column type', () => {
    // A numeric field converted to boolean keeps its name but becomes categorical
    const data = {
      transformedData: [{ bytes: true }],
      categoricalColumns: [
        { id: 0, name: 'bytes', column: 'bytes', schema: VisFieldType.Categorical },
      ],
    } as any;

    const { rows } = visDataToTabular(data, createIndexPattern({ bytes: 'number' }));

    expect(rows[0].bytes.raw).toBe(true);
    expect(rows[0].bytes.formatted).toBe('true');
  });
});
