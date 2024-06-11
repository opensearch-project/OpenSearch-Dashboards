/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { indexPatterns } from '../../../data/public';
import { IndexPattern } from '../opensearch_dashboards_services';
import { IIndexPatternFieldList } from '../../../data/common';

// Initial data of index pattern fields
const fieldsData = [
  {
    name: '_id',
    type: 'string',
    scripted: false,
    aggregatable: true,
    filterable: true,
    searchable: true,
    sortable: true,
  },
  {
    name: '_index',
    type: 'string',
    scripted: false,
    filterable: true,
    aggregatable: true,
    searchable: true,
    sortable: true,
  },
  {
    name: '_source',
    type: '_source',
    scripted: false,
    aggregatable: false,
    filterable: false,
    searchable: false,
    sortable: false,
  },
];

// Create a mock object for index pattern fields with methods: getAll, getByName and getByType
export const indexPatternFieldMock = {
  getAll: () => fieldsData,
  getByName: (name) => fieldsData.find((field) => field.name === name),
  getByType: (type) => fieldsData.filter((field) => field.type === type),
} as IIndexPatternFieldList;

// Create a mock for the initial index pattern
export const indexPatternInitialMock = ({
  id: '123',
  title: 'test_index',
  fields: indexPatternFieldMock,
  timeFieldName: 'order_date',
  formatHit: jest.fn((hit) => (hit.fields ? hit.fields : hit._source)),
  flattenHit: undefined,
  formatField: undefined,
  metaFields: ['_id', '_index', '_source'],
  getFieldByName: jest.fn(() => ({})),
} as unknown) as IndexPattern;

// Add a flattenHit method to the initial index pattern mock using flattenHitWrapper
const flatternHitMock = indexPatterns.flattenHitWrapper(
  indexPatternInitialMock,
  indexPatternInitialMock.metaFields
);
indexPatternInitialMock.flattenHit = flatternHitMock;

// Add a formatField method to the initial index pattern mock
const formatFieldMock = (hit, field) => {
  return field === '_source' ? hit._source : indexPatternInitialMock.flattenHit(hit)[field];
};
indexPatternInitialMock.formatField = formatFieldMock;

// Export the fully set up index pattern mock
export const indexPatternMock = indexPatternInitialMock;

// Export a function that allows customization of index pattern mocks, by adding extra fields to the fieldsData
export const getMockedIndexPatternWithCustomizedFields = (fields) => {
  const customizedFieldsData = [...fieldsData, ...fields];
  const customizedFieldsMock = {
    getAll: () => customizedFieldsData,
    getByName: (name) => customizedFieldsData.find((field) => field.name === name),
    getByType: (type) => customizedFieldsData.filter((field) => field.type === type),
  } as IIndexPatternFieldList;

  return {
    ...indexPatternMock,
    fields: customizedFieldsMock,
  };
};

// Export a function that allows customization of index pattern mocks with both extra fields and time field
export const getMockedIndexPatternWithTimeField = (fields, timeFiledName: string) => {
  const indexPatternWithTimeFieldMock = getMockedIndexPatternWithCustomizedFields(fields);

  return {
    ...indexPatternWithTimeFieldMock,
    timeFieldName: timeFiledName,
  };
};
