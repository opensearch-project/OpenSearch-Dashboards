/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  FieldTypes,
  IndexPatternField,
  isNestedField,
  propFilter,
} from '../../../../../../data/common';

const filterByType = propFilter('type');

export const getAvailableFields = (
  fields: IndexPatternField[],
  filterFieldTypes: FieldTypes = '*'
) => {
  const filteredFields = fields.filter((field: IndexPatternField) => {
    if (!field.aggregatable || isNestedField(field) || field.scripted) {
      return false;
    }

    return filterByType([field], filterFieldTypes).length !== 0;
  });

  return filteredFields;
};
