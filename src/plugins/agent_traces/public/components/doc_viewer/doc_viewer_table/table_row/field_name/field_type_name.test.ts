/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getFieldTypeName } from './field_type_name';

describe('getFieldTypeName', () => {
  it('returns correct labels for known field types', () => {
    expect(getFieldTypeName('boolean')).toBe('Boolean field');
    expect(getFieldTypeName('date')).toBe('Date field');
    expect(getFieldTypeName('string')).toBe('String field');
    expect(getFieldTypeName('number')).toBe('Number field');
    expect(getFieldTypeName('ip')).toBe('IP address field');
    expect(getFieldTypeName('geo_point')).toBe('Geo point field');
  });

  it('returns unknown field label for unrecognized types', () => {
    expect(getFieldTypeName('custom_type')).toBe('Unknown field');
    expect(getFieldTypeName('')).toBe('Unknown field');
    expect(getFieldTypeName(undefined as any)).toBe('Unknown field');
    expect(getFieldTypeName('STRING')).toBe('Unknown field'); // case sensitive
  });
});
