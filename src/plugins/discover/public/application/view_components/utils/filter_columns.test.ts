/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { filterColumns } from './filter_columns';
import { IndexPattern } from '../../../opensearch_dashboards_services';

describe('filterColumns', () => {
  const indexPatternMock = {
    fields: {
      getAll: () => [{ name: 'a' }, { name: 'c' }, { name: 'd' }],
    },
  } as IndexPattern;
  const defaultColumns = ['_defaultColumn'];

  it('should return columns that exist in the index pattern fields', () => {
    const columns = ['a', 'b'];
    const result = filterColumns(columns, indexPatternMock, defaultColumns);
    expect(result).toEqual(['a']);
  });

  it('should return defaultColumns if no columns exist in the index pattern fields', () => {
    const columns = ['b', 'e'];
    const result = filterColumns(columns, indexPatternMock, defaultColumns);
    expect(result).toEqual(defaultColumns);
  });

  it('should return defaultColumns if no columns and indexPattern is null', () => {
    const columns = ['b', 'e'];
    const result = filterColumns(columns, null, defaultColumns);
    expect(result).toEqual(defaultColumns);
  });
});
