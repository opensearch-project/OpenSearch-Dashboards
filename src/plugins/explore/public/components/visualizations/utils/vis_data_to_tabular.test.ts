/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { visDataToTabular } from './vis_data_to_tabular';

describe('visDataToTabular', () => {
  const visData = {
    transformedData: [{ host: 'a', 'count()': 3, bytes: null }],
    numericalColumns: [{ id: 1, name: 'count()', column: 'count()' }],
    categoricalColumns: [{ id: 0, name: 'host', column: 'host' }],
    dateColumns: [],
    unknownColumns: [{ id: 2, name: 'bytes', column: 'bytes' }],
  } as any;

  it('lists the columns in result order, not grouped by type', () => {
    const { columns } = visDataToTabular(visData);
    expect(columns).toEqual([
      { name: 'host', field: 'host' },
      { name: 'count()', field: 'count()' },
      { name: 'bytes', field: 'bytes' },
    ]);
  });

  it('formats values with the field formatter when the field exists', () => {
    const indexPattern = {
      fields: { getByName: (name: string) => (name === 'host' ? { name } : undefined) },
      getFormatterForField: () => ({ convert: (value: unknown) => `<${value}>` }),
    } as any;

    const { rows } = visDataToTabular(visData, indexPattern);

    expect(rows[0].host.raw).toBe('a');
    expect(rows[0].host.formatted).toBe('<a>');
    // No field in the index pattern: plain string
    expect(rows[0]['count()'].formatted).toBe('3');
  });

  it('formats a missing value as an empty string', () => {
    const { rows } = visDataToTabular(visData);
    expect(rows[0].bytes.formatted).toBe('');
  });
});
