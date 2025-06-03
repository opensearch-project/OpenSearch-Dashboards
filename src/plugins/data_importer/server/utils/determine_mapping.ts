/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MappingProperty, MappingTypeMapping } from '@opensearch-project/opensearch/api/types';
import _ from 'lodash';
import { DYNAMIC_MAPPING_TYPES } from '../../common';
import { isBooleanType, isNumericType, isValidDate } from './util';

export const determineMapping = (
  document: Record<string, any>,
  nestedObjectsLimit: number
): MappingTypeMapping => {
  return {
    dynamic: true,
    date_detection: true,
    ...determineType(document, 1, nestedObjectsLimit),
  };
};

const determineType = (
  value: any,
  currentNestedCount: number,
  nestedObjectsLimit: number
): Record<string, MappingProperty> | MappingProperty => {
  if (currentNestedCount >= nestedObjectsLimit) {
    throw Error(`Current document exceeds nested object limit of ${nestedObjectsLimit}`);
  }

  const defaultType = {
    type: DYNAMIC_MAPPING_TYPES.TEXT,
    fields: {
      keyword: {
        type: 'keyword',
        ignore_above: 256,
      },
    },
  };

  switch (true) {
    case Array.isArray(value) && value.length < 1:
    case value == null:
      return { type: DYNAMIC_MAPPING_TYPES.NULL };
    case typeof value === 'string' && value.length === 0:
      return defaultType;
    case isBooleanType(value):
      return { type: DYNAMIC_MAPPING_TYPES.BOOLEAN };
    case isNumericType(value):
      return { type: determineExactNumberType(Number(value)) };
    case isValidDate(_.toString(value)):
      // TODO Dates need further parsing since OpenSearch expects a certain timestamp format
      return defaultType;
    case Array.isArray(value) && value.length > 0:
      return determineType(value[0], currentNestedCount, nestedObjectsLimit);
    case value && typeof value === 'object' && !Array.isArray(value):
      const properties: Record<string, MappingProperty> = {};
      Object.keys(value).forEach((key) => {
        properties[key] = determineType(value[key], currentNestedCount + 1, nestedObjectsLimit);
      });
      return { properties };
    default:
      return defaultType;
  }
};

const determineExactNumberType = (value: number) => {
  if (Number.isSafeInteger(value)) {
    return DYNAMIC_MAPPING_TYPES.INTEGER;
  } else if (!Number.isInteger(value)) {
    return DYNAMIC_MAPPING_TYPES.FLOAT;
  } else {
    return DYNAMIC_MAPPING_TYPES.DOUBLE;
  }
};
