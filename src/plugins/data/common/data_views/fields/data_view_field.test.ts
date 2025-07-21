/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataViewField } from './data_view_field';
import { DataView } from '../data_views';
import { OSD_FIELD_TYPES, FieldFormat } from '../..';
import { DataViewFieldSpec } from '../types';

describe('Field', function () {
  function flatten(obj: Record<string, any>) {
    return JSON.parse(JSON.stringify(obj));
  }

  function getField(values = {}) {
    return new DataViewField({ ...fieldValues, ...values }, 'displayName');
  }

  const fieldValues = {
    name: 'name',
    type: 'string',
    script: 'script',
    lang: 'lang',
    count: 1,
    esTypes: ['text'],
    aggregatable: true,
    filterable: true,
    searchable: true,
    sortable: true,
    indexed: true,
    readFromDocValues: false,
    visualizable: true,
    scripted: true,
    subType: { multi: { parent: 'parent' }, nested: { path: 'path' } },
    displayName: 'displayName',
    indexPattern: ({
      fieldFormatMap: { name: {}, _source: {}, _score: {}, _id: {} },
    } as unknown) as DataView,
    $$spec: ({} as unknown) as DataViewFieldSpec,
    conflictDescriptions: { a: ['b', 'c'], d: ['e'] },
  };

  it('the correct properties are writable', () => {
    const field = getField();

    expect(field.count).toEqual(1);
    field.count = 2;
    expect(field.count).toEqual(2);

    expect(field.script).toEqual(fieldValues.script);
    field.script = '1';
    expect(field.script).toEqual('1');

    expect(field.lang).toEqual(fieldValues.lang);
    field.lang = 'painless';
    expect(field.lang).toEqual('painless');

    expect(field.conflictDescriptions).toEqual(fieldValues.conflictDescriptions);
    field.conflictDescriptions = {};
    expect(field.conflictDescriptions).toEqual({});
  });

  it('sets type field when _source field', () => {
    const field = getField({ name: '_source' });
    expect(field.type).toEqual('_source');
  });

  it('calculates searchable', () => {
    const field = getField({ searchable: true, scripted: false });
    expect(field.searchable).toEqual(true);

    const fieldB = getField({ searchable: false, scripted: true });
    expect(fieldB.searchable).toEqual(true);

    const fieldC = getField({ searchable: false, scripted: false });
    expect(fieldC.searchable).toEqual(false);
  });

  it('calculates visualizable', () => {
    const field = getField({ type: 'unknown' });
    expect(field.visualizable).toEqual(false);

    const fieldB = getField({ type: 'conflict' });
    expect(fieldB.visualizable).toEqual(false);

    const fieldC = getField({ aggregatable: false, scripted: false });
    expect(fieldC.visualizable).toEqual(false);
  });

  it('calculates aggregatable', () => {
    const field = getField({ aggregatable: true, scripted: false });
    expect(field.aggregatable).toEqual(true);

    const fieldB = getField({ aggregatable: false, scripted: true });
    expect(fieldB.aggregatable).toEqual(true);

    const fieldC = getField({ aggregatable: false, scripted: false });
    expect(fieldC.aggregatable).toEqual(false);
  });

  it('calculates readFromDocValues', () => {
    const field = getField({ readFromDocValues: true, scripted: false });
    expect(field.readFromDocValues).toEqual(true);

    const fieldB = getField({ readFromDocValues: false, scripted: false });
    expect(fieldB.readFromDocValues).toEqual(false);

    const fieldC = getField({ readFromDocValues: true, scripted: true });
    expect(fieldC.readFromDocValues).toEqual(false);
  });

  it('calculates sortable', () => {
    const field = getField({ name: '_score' });
    expect(field.sortable).toEqual(true);

    const fieldB = getField({ indexed: true, type: OSD_FIELD_TYPES.STRING });
    expect(fieldB.sortable).toEqual(true);

    const fieldC = getField({ indexed: false, aggregatable: false, scripted: false });
    expect(fieldC.sortable).toEqual(false);
  });

  it('calculates filterable', () => {
    const field = getField({ name: '_id' });
    expect(field.filterable).toEqual(true);

    const fieldB = getField({ scripted: true });
    expect(fieldB.filterable).toEqual(true);

    const fieldC = getField({ indexed: true, type: OSD_FIELD_TYPES.STRING });
    expect(fieldC.filterable).toEqual(true);

    const fieldD = getField({ scripted: false, indexed: false, searchable: false });
    expect(fieldD.filterable).toEqual(false);
  });

  it('exports the property to JSON', () => {
    const field = new DataViewField(fieldValues, 'displayName');
    expect(flatten(field)).toMatchSnapshot();
  });

  it('spec snapshot', () => {
    const field = new DataViewField(fieldValues, 'displayName');
    const getFormatterForField = () =>
      ({
        toJSON: () => ({
          id: 'number',
          params: {
            pattern: '$0,0.[00]',
          },
        }),
      } as FieldFormat);
    expect(field.toSpec({ getFormatterForField })).toMatchSnapshot();
  });
});
