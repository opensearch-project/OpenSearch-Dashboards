/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { FieldSpec } from '../../../../../../data/common';
import { IndexPatternField, OSD_FIELD_TYPES } from '../../../../../../data/public';
import { getAvailableFields } from './get_available_fields';

describe('getAvailableFields', () => {
  const createIndexFields = (fields: Array<Partial<FieldSpec>>) =>
    fields.map(
      (field) =>
        new IndexPatternField(
          {
            aggregatable: true,
            name: 'field 1',
            searchable: false,
            type: OSD_FIELD_TYPES.STRING,
            ...field,
          },
          field.name || 'field'
        )
    );

  test('should return only aggregateable fields by default', () => {
    const fields = createIndexFields([
      {
        name: 'field 1',
      },
      {
        aggregatable: false,
        name: 'field 2',
      },
      {
        scripted: true,
        name: 'field 3',
      },
      {
        name: 'field 4',
        subType: {
          nested: { path: 'something' },
        },
      },
    ]);

    expect(getAvailableFields(fields).length).toBe(1);
  });

  test('should return all fields if filterFieldTypes was not specified', () => {
    const fields = createIndexFields([
      {
        name: 'field 1',
      },
      {
        name: 'field 2',
      },
    ]);

    expect(getAvailableFields(fields).length).toBe(2);
  });

  test('should filterFieldTypes', () => {
    const fields = createIndexFields([
      {
        name: 'field 1',
      },
      {
        name: 'field 2',
        type: OSD_FIELD_TYPES.BOOLEAN,
      },
      {
        name: 'field 3',
        type: OSD_FIELD_TYPES.BOOLEAN,
      },
    ]);

    expect(getAvailableFields(fields, OSD_FIELD_TYPES.BOOLEAN).length).toBe(2);
  });
});
