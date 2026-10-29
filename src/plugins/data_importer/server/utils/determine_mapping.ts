/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MappingProperty, MappingTypeMapping } from '@opensearch-project/opensearch/api/types';
import _ from 'lodash';
import { DYNAMIC_MAPPING_TYPES } from '../../common';
import { isBooleanType, isNumericType, isValidDate } from './util';

/**
 * Plain decimal notation only. Used instead of `isNumericType` for *string* values during mapping
 * inference so that identifier-like strings (`'007'`, `'0x1F'`, `'1e3'`, `' '`, `'Infinity'`) are
 * inferred as text/keyword rather than a numeric type that would drop leading zeros or reject rows.
 */
const DECIMAL_STRING_REGEX = /^-?(0|[1-9]\d*)(\.\d+)?$/;

const isInferableNumber = (value: unknown) =>
  typeof value === 'string' ? DECIMAL_STRING_REGEX.test(value) : isNumericType(value);

const NUMERIC_TYPES: string[] = [
  DYNAMIC_MAPPING_TYPES.INTEGER,
  DYNAMIC_MAPPING_TYPES.FLOAT,
  DYNAMIC_MAPPING_TYPES.DOUBLE,
];

const defaultType = (): MappingProperty => ({
  type: DYNAMIC_MAPPING_TYPES.TEXT,
  fields: {
    keyword: {
      type: 'keyword',
      ignore_above: 256,
    },
  },
});

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

/**
 * Infer a mapping from every sampled document (e.g. all preview rows), merging per-document types
 * with a widening rule so that a column whose type differs between rows does not get the type of
 * whichever row came first:
 * - same type: kept
 * - integer + float: float; any numeric + double: double
 * - null + X: X
 * - any other conflict (number vs text, boolean vs number, ...): text with a keyword subfield
 * - objects: merged field by field
 */
export const determineMappingFromDocuments = (
  documents: Array<Record<string, any>>,
  nestedObjectsLimit: number
): MappingTypeMapping => {
  const merged = documents
    .map((document) => determineType(document, 1, nestedObjectsLimit) as MappingProperty)
    .reduce<MappingProperty>((acc, current) => mergeTypes(acc, current), { properties: {} });

  return {
    dynamic: true,
    date_detection: true,
    ...(merged as MappingTypeMapping),
  };
};

const mergeTypes = (a: MappingProperty, b: MappingProperty): MappingProperty => {
  const aProps = (a as { properties?: Record<string, MappingProperty> }).properties;
  const bProps = (b as { properties?: Record<string, MappingProperty> }).properties;
  if (aProps && bProps) {
    const properties: Record<string, MappingProperty> = { ...aProps };
    Object.keys(bProps).forEach((key) => {
      properties[key] = key in aProps ? mergeTypes(aProps[key], bProps[key]) : bProps[key];
    });
    return { properties };
  }

  const aType = a.type as string | undefined;
  const bType = b.type as string | undefined;
  if (aType === DYNAMIC_MAPPING_TYPES.NULL) {
    return b;
  }
  if (bType === DYNAMIC_MAPPING_TYPES.NULL) {
    return a;
  }
  if (aType !== undefined && aType === bType) {
    return a;
  }
  if (aType && bType && NUMERIC_TYPES.includes(aType) && NUMERIC_TYPES.includes(bType)) {
    return {
      type:
        aType === DYNAMIC_MAPPING_TYPES.DOUBLE || bType === DYNAMIC_MAPPING_TYPES.DOUBLE
          ? DYNAMIC_MAPPING_TYPES.DOUBLE
          : DYNAMIC_MAPPING_TYPES.FLOAT,
    } as MappingProperty;
  }
  // Conflicting scalar types (or object vs scalar): fall back to the type that accepts anything
  return defaultType();
};

const determineType = (
  value: any,
  currentNestedCount: number,
  nestedObjectsLimit: number
): Record<string, MappingProperty> | MappingProperty => {
  if (currentNestedCount >= nestedObjectsLimit) {
    throw Error(`Current document exceeds nested object limit of ${nestedObjectsLimit}`);
  }

  switch (true) {
    case Array.isArray(value) && value.length < 1:
    case value == null:
      return { type: DYNAMIC_MAPPING_TYPES.NULL };
    case typeof value === 'string' && value.length === 0:
      return defaultType();
    case isBooleanType(value):
      return { type: DYNAMIC_MAPPING_TYPES.BOOLEAN };
    case isInferableNumber(value):
      return { type: determineExactNumberType(Number(value)) };
    case isValidDate(_.toString(value)):
      // TODO Dates need further parsing since OpenSearch expects a certain timestamp format.
      // Not trivially fixable (U3b, see u3_findings.md): moment's ISO_8601/RFC_2822 accept formats
      // that OpenSearch's default date format rejects
      return defaultType();
    case Array.isArray(value) && value.length > 0:
      return determineType(value[0], currentNestedCount, nestedObjectsLimit);
    case value && typeof value === 'object' && !Array.isArray(value):
      const properties: Record<string, MappingProperty> = {};
      Object.keys(value).forEach((key) => {
        properties[key] = determineType(value[key], currentNestedCount + 1, nestedObjectsLimit);
      });
      return { properties };
    default:
      return defaultType();
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
