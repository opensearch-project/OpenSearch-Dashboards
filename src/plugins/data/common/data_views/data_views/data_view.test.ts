/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { map, last, cloneDeep } from 'lodash';

import { DataView } from './data_view';

import { DuplicateField } from '../../../../opensearch_dashboards_utils/common';
// @ts-expect-error
import mockLogStashFields from '../../../../../fixtures/logstash_fields';
import { stubbedSavedObjectIndexPattern } from '../../../../../fixtures/stubbed_saved_object_index_pattern';
import { DataViewField } from '../fields';

import { fieldFormatsMock } from '../../field_formats/mocks';
import { DataViewSavedObjectsClientCommon, FieldFormat, SavedObject } from '../..';

class MockFieldFormatter {}

fieldFormatsMock.getInstance = jest.fn().mockImplementation(() => new MockFieldFormatter()) as any;

jest.mock('../../field_mapping', () => {
  const originalModule = jest.requireActual('../../field_mapping');

  return {
    ...originalModule,
    expandShorthand: jest.fn(() => ({
      id: true,
      title: true,
      fieldFormatMap: {
        _serialize: jest.fn().mockImplementation(() => {}),
        _deserialize: jest.fn().mockImplementation(() => []),
      },
      fields: {
        _serialize: jest.fn().mockImplementation(() => {}),
        _deserialize: jest.fn().mockImplementation((fields) => fields),
      },
      sourceFilters: {
        _serialize: jest.fn().mockImplementation(() => {}),
        _deserialize: jest.fn().mockImplementation(() => undefined),
      },
      typeMeta: {
        _serialize: jest.fn().mockImplementation(() => {}),
        _deserialize: jest.fn().mockImplementation(() => undefined),
      },
    })),
  };
});

const object: any = {};
const indexPatternObj = { id: 'id', version: 'a', attributes: { title: 'title' } };

const savedObjectsClient = {} as DataViewSavedObjectsClientCommon;
savedObjectsClient.find = jest.fn(
  () => Promise.resolve([indexPatternObj]) as Promise<Array<SavedObject<any>>>
);
savedObjectsClient.delete = jest.fn(() => Promise.resolve({}) as Promise<any>);
savedObjectsClient.create = jest.fn();
savedObjectsClient.get = jest.fn().mockResolvedValue(indexPatternObj);
savedObjectsClient.update = jest.fn().mockImplementation(async (_type, _id, body, { version }) => {
  if (object.version !== version) {
    throw new Object({
      res: {
        status: 409,
      },
    });
  }
  object.attributes.title = body.title;
  object.version += 'a';
  return {
    id: object.id,
    version: object.version,
  };
});

// helper function to create index patterns
function create(id: string) {
  const {
    type,
    version,
    attributes: { timeFieldName, fields, title },
  } = stubbedSavedObjectIndexPattern(id);

  return new DataView({
    spec: { id, type, version, timeFieldName, fields, title },
    savedObjectsClient: {} as any,
    fieldFormats: fieldFormatsMock,
    shortDotsEnable: false,
    metaFields: [],
  });
}

function createWithDataSource(id: string) {
  const {
    type,
    version,
    attributes: { timeFieldName, fields, title },
    reference,
  } = stubbedSavedObjectIndexPattern(id, true);

  const dataSourceRef = { id: reference[0].id, type: reference[0].type };
  return new DataView({
    // @ts-expect-error TS2741 TODO(ts-error): fixme
    spec: { id, type, version, timeFieldName, fields, title, dataSourceRef },
    savedObjectsClient,
    fieldFormats: fieldFormatsMock,
    shortDotsEnable: false,
    metaFields: [],
  });
}

function createWithDataSourceMeta(id: string) {
  const {
    type,
    version,
    attributes: { timeFieldName, fields, title },
  } = stubbedSavedObjectIndexPattern(id);

  const dataSourceMeta = { prometheusUrl: 'http://localhost:9090', customField: 'value' };
  return new DataView({
    spec: { id, type, version, timeFieldName, fields, title, dataSourceMeta },
    savedObjectsClient: {} as any,
    fieldFormats: fieldFormatsMock,
    shortDotsEnable: false,
    metaFields: [],
  });
}

describe('DataView', () => {
  let dataView: DataView;

  // create an dataView instance for each test
  beforeEach(() => {
    dataView = create('test-pattern');
  });

  describe('api', () => {
    test('should have expected properties', () => {
      expect(dataView).toHaveProperty('getScriptedFields');
      expect(dataView).toHaveProperty('getNonScriptedFields');
      expect(dataView).toHaveProperty('addScriptedField');
      expect(dataView).toHaveProperty('removeScriptedField');

      // properties
      expect(dataView).toHaveProperty('fields');
    });
  });

  describe('fields', () => {
    test('should have expected properties on fields', function () {
      expect(dataView.fields[0]).toHaveProperty('displayName');
      expect(dataView.fields[0]).toHaveProperty('filterable');
      expect(dataView.fields[0]).toHaveProperty('sortable');
      expect(dataView.fields[0]).toHaveProperty('scripted');
    });
  });

  describe('getScriptedFields', () => {
    test('should return all scripted fields', () => {
      const scriptedNames = mockLogStashFields()
        .filter((item: DataViewField) => item.scripted === true)
        .map((item: DataViewField) => item.name);
      const respNames = map(dataView.getScriptedFields(), 'name');

      expect(respNames).toEqual(scriptedNames);
    });
  });

  describe('getComputedFields', () => {
    test('should be a function', () => {
      expect(dataView.getComputedFields).toBeInstanceOf(Function);
    });

    test('should request all stored fields', () => {
      expect(dataView.getComputedFields().storedFields).toContain('*');
    });

    test('should request date fields as docvalue_fields', () => {
      const { docvalueFields } = dataView.getComputedFields();
      const docValueFieldNames = docvalueFields.map((field) => field.field);

      expect(Object.keys(docValueFieldNames).length).toBe(3);
      expect(docValueFieldNames).toContain('@timestamp');
      expect(docValueFieldNames).toContain('time');
      expect(docValueFieldNames).toContain('utc_time');
    });

    test('should request date field doc values in date_time format', () => {
      const { docvalueFields } = dataView.getComputedFields();
      const timestampField = docvalueFields.find((field) => field.field === '@timestamp');

      expect(timestampField).toHaveProperty('format', 'date_time');
    });

    test('should not request scripted date fields as docvalue_fields', () => {
      const { docvalueFields } = dataView.getComputedFields();

      expect(docvalueFields).not.toContain('script date');
    });
  });

  describe('getNonScriptedFields', () => {
    test('should return all non-scripted fields', () => {
      const notScriptedNames = mockLogStashFields()
        .filter((item: DataViewField) => item.scripted === false)
        .map((item: DataViewField) => item.name);
      const respNames = map(dataView.getNonScriptedFields(), 'name');

      expect(respNames).toEqual(notScriptedNames);
    });
  });

  describe('add and remove scripted fields', () => {
    test('should append the scripted field', async () => {
      // keep a copy of the current scripted field count
      const oldCount = dataView.getScriptedFields().length;

      // add a new scripted field
      const scriptedField = {
        name: 'new scripted field',
        script: 'false',
        type: 'boolean',
      };

      await dataView.addScriptedField(scriptedField.name, scriptedField.script, scriptedField.type);

      const scriptedFields = dataView.getScriptedFields();
      expect(scriptedFields).toHaveLength(oldCount + 1);
      expect(dataView.fields.getByName(scriptedField.name)?.name).toEqual(scriptedField.name);
    });

    test('should remove scripted field, by name', async () => {
      const scriptedFields = dataView.getScriptedFields();
      const oldCount = scriptedFields.length;
      const scriptedField = last(scriptedFields)!;

      await dataView.removeScriptedField(scriptedField.name);

      expect(dataView.getScriptedFields().length).toEqual(oldCount - 1);
      expect(dataView.fields.getByName(scriptedField.name)).toEqual(undefined);
    });

    test('should not allow duplicate names', async () => {
      const scriptedFields = dataView.getScriptedFields();
      const scriptedField = last(scriptedFields) as any;
      expect.assertions(1);
      try {
        await dataView.addScriptedField(scriptedField.name, "'new script'", 'string');
      } catch (e) {
        expect(e).toBeInstanceOf(DuplicateField);
      }
    });
  });

  describe('toSpec', () => {
    test('should match snapshot', () => {
      const formatter = {
        toJSON: () => ({ id: 'number', params: { pattern: '$0,0.[00]' } }),
      } as FieldFormat;
      dataView.getFormatterForField = () => formatter;
      expect(dataView.toSpec()).toMatchSnapshot();
    });

    test('can restore from spec', () => {
      const formatter = {
        toJSON: () => ({ id: 'number', params: { pattern: '$0,0.[00]' } }),
      } as FieldFormat;
      dataView.getFormatterForField = () => formatter;
      const spec = dataView.toSpec();
      const restoredPattern = new DataView({
        spec,
        savedObjectsClient: {} as any,
        fieldFormats: fieldFormatsMock,
        shortDotsEnable: false,
        metaFields: [],
      });
      expect(restoredPattern.id).toEqual(dataView.id);
      expect(restoredPattern.title).toEqual(dataView.title);
      expect(restoredPattern.timeFieldName).toEqual(dataView.timeFieldName);
      expect(restoredPattern.fields.length).toEqual(dataView.fields.length);
      expect(restoredPattern.fieldFormatMap.bytes instanceof MockFieldFormatter).toEqual(true);
    });
  });
});

describe('DataViewWithDataSource', () => {
  let dataView: DataView;

  // create an dataView instance for each test
  beforeEach(() => {
    dataView = createWithDataSource('test-pattern');
  });

  describe('toSpec', () => {
    test('should match snapshot', () => {
      const formatter = {
        toJSON: () => ({ id: 'number', params: { pattern: '$0,0.[00]' } }),
      } as FieldFormat;
      dataView.getFormatterForField = () => formatter;
      expect(dataView.toSpec()).toMatchSnapshot();
    });

    test('can restore from spec', () => {
      const formatter = {
        toJSON: () => ({ id: 'number', params: { pattern: '$0,0.[00]' } }),
      } as FieldFormat;
      dataView.getFormatterForField = () => formatter;
      const spec = dataView.toSpec();
      const restoredPattern = new DataView({
        spec,
        savedObjectsClient,
        fieldFormats: fieldFormatsMock,
        shortDotsEnable: false,
        metaFields: [],
      });
      expect(restoredPattern.id).toEqual(dataView.id);
      expect(restoredPattern.title).toEqual(dataView.title);
      expect(restoredPattern.timeFieldName).toEqual(dataView.timeFieldName);
      expect(restoredPattern.fields.length).toEqual(dataView.fields.length);
      expect(restoredPattern.fieldFormatMap.bytes instanceof MockFieldFormatter).toEqual(true);
      expect(restoredPattern.dataSourceRef).toEqual(dataView.dataSourceRef);
    });
  });

  describe('getSaveObjectReference', () => {
    test('should get index pattern saved object reference', function () {
      expect(dataView.getSaveObjectReference()[0]?.id).toEqual(dataView.dataSourceRef?.id);
      expect(dataView.getSaveObjectReference()[0]?.type).toEqual(dataView.dataSourceRef?.type);
      expect(dataView.getSaveObjectReference()[0]?.name).toEqual('dataSource');
    });
  });

  describe('flattenHit', () => {
    test('should not modify original hit', () => {
      const nestedArrayDataView = new DataView({
        spec: {
          id: 'test-nested-array',
          type: 'index-pattern',
          fields: {
            'nested_test1.d_values': {
              count: 0,
              name: 'nested_test1.d_values',
              type: 'number',
              esTypes: ['double'],
              scripted: false,
              searchable: true,
              aggregatable: true,
              readFromDocValues: true,
              subType: {
                nested: {
                  path: 'nested_test1',
                },
              },
            },
            'nested_test1.s_entry': {
              count: 0,
              name: 'nested_test1.s_entry',
              type: 'string',
              esTypes: ['keyword'],
              scripted: false,
              searchable: true,
              aggregatable: true,
              readFromDocValues: true,
              subType: {
                nested: {
                  path: 'nested_test1',
                },
              },
            },
          },
        },
        savedObjectsClient: {} as any,
        fieldFormats: fieldFormatsMock,
        shortDotsEnable: false,
        metaFields: [],
      });

      const hit = {
        _index: 'test-nested-array',
        _id: 'JPas2pQBluzwIEYCwD0y',
        _score: 1,
        _source: {
          nested_test1: [
            {
              d_values: [0.1, 0.2],
              s_entry: '4',
            },
            {
              d_values: [0.3, 0.4],
              s_entry: '5',
            },
            {
              d_values: [0.5, 0.6],
              s_entry: '6',
            },
          ],
        },
      };
      const hitClone = cloneDeep(hit);
      nestedArrayDataView.flattenHit(hit);

      expect(hit).toEqual(hitClone);
    });
  });
});

describe('DataViewWithDataSourceMeta', () => {
  let dataView: DataView;

  beforeEach(() => {
    dataView = createWithDataSourceMeta('test-pattern');
  });

  describe('dataSourceMeta', () => {
    test('should store dataSourceMeta from spec', () => {
      expect(dataView.dataSourceMeta).toEqual({
        prometheusUrl: 'http://localhost:9090',
        customField: 'value',
      });
    });

    test('should be undefined when not provided in spec', () => {
      const dataViewWithoutMeta = create('test-pattern');
      expect(dataViewWithoutMeta.dataSourceMeta).toBeUndefined();
    });
  });
});
