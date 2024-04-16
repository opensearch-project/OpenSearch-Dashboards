/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isSavedObjectWithDataSource } from './validate_object_id';

describe('isObjectWithDataSource', () => {
  test('should return false for valid object with data source ID but in wrong format', () => {
    // Valid ID with two parts separated by underscore, and both parts being UUIDs
    const inValidId = 'invalid_uuid_1234-invalid_uuid_5678';
    expect(isSavedObjectWithDataSource(inValidId)).toBe(false);
  });

  test('should return false for invalid IDs', () => {
    // Missing underscore
    const invalidId1 = 'missingunderscore';
    expect(isSavedObjectWithDataSource(invalidId1)).toBe(false);

    // Invalid UUID in the second part
    const invalidId2 = 'valid_uuid_1234-invalid_uuid';
    expect(isSavedObjectWithDataSource(invalidId2)).toBe(false);

    // Missing second part
    const invalidId3 = 'valid_uuid_1234';
    expect(isSavedObjectWithDataSource(invalidId3)).toBe(false);

    // More than two parts
    const invalidId4 = 'valid_uuid_1234-valid_uuid_5678-extra_part';
    expect(isSavedObjectWithDataSource(invalidId4)).toBe(false);
  });

  test('should return false for non-UUID parts', () => {
    // First part is not a UUID
    const invalidId1 = 'not_a_uuid_valid_uuid_1234';
    expect(isSavedObjectWithDataSource(invalidId1)).toBe(false);

    // Second part is not a UUID
    const invalidId2 = 'valid_uuid_1234_not_a_uuid';
    expect(isSavedObjectWithDataSource(invalidId2)).toBe(false);

    // Both parts are not UUIDs
    const invalidId3 = 'not_a_uuid_not_a_uuid';
    expect(isSavedObjectWithDataSource(invalidId3)).toBe(false);
  });

  test('should return false for string with underscore but not with UUID', () => {
    // First part is not a UUID
    const invalidId = 'saved_object_with_index_pattern_conflict';
    expect(isSavedObjectWithDataSource(invalidId)).toBe(false);
  });

  test('should return false for string with underscore but with three UUIDs', () => {
    // First part is not a UUID
    const invalidId =
      '7cbd2350-2223-11e8-b802-5bcf64c2cfb4_7cbd2350-2223-11e8-b802-5bcf64c2cfb4_7cbd2350-2223-11e8-b802-5bcf64c2cfb4';
    expect(isSavedObjectWithDataSource(invalidId)).toBe(false);
  });
});
