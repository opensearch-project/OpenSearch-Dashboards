/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '@osd/monaco';
import { getSuggestions } from './code_completion';
import { IIndexPattern } from '../..';

const testingIndex = ({
  title: 'opensearch_dashboards_sample_data_flights',
  fields: [
    {
      count: 0,
      name: 'Carrier',
      displayName: 'Carrier',
      type: 'string',
      esTypes: ['keyword'],
      scripted: false,
      searchable: true,
      aggregatable: true,
      readFromDocValues: true,
      subType: undefined,
    },
    {
      count: 2,
      name: 'DestCityName',
      displayName: 'DestCityName',
      type: 'string',
      esTypes: ['keyword'],
      scripted: false,
      searchable: true,
      aggregatable: true,
      readFromDocValues: true,
      subType: undefined,
    },
    {
      count: 0,
      name: 'DestCountry',
      displayName: 'DestCountry',
      type: 'string',
      esTypes: ['keyword'],
      scripted: false,
      searchable: true,
      aggregatable: true,
      readFromDocValues: true,
      subType: undefined,
    },
    {
      count: 0,
      name: 'DestWeather',
      displayName: 'DestWeather',
      type: 'string',
      esTypes: ['keyword'],
      scripted: false,
      searchable: true,
      aggregatable: true,
      readFromDocValues: true,
      subType: undefined,
    },
    {
      count: 0,
      name: 'DistanceMiles',
      displayName: 'DistanceMiles',
      type: 'number',
      esTypes: ['float'],
      scripted: false,
      searchable: true,
      aggregatable: true,
      readFromDocValues: true,
      subType: undefined,
    },
    {
      count: 0,
      name: 'FlightDelay',
      displayName: 'FlightDelay',
      type: 'boolean',
      esTypes: ['boolean'],
      scripted: false,
      searchable: true,
      aggregatable: true,
      readFromDocValues: true,
      subType: undefined,
    },
    {
      count: 0,
      name: 'FlightNum',
      displayName: 'FlightNum',
      type: 'string',
      esTypes: ['keyword'],
      scripted: false,
      searchable: true,
      aggregatable: true,
      readFromDocValues: true,
      subType: undefined,
    },
    {
      count: 0,
      name: 'OriginWeather',
      displayName: 'OriginWeather',
      type: 'string',
      esTypes: ['keyword'],
      scripted: false,
      searchable: true,
      aggregatable: true,
      readFromDocValues: true,
      subType: undefined,
    },
    {
      count: 0,
      name: '_id',
      displayName: '_id',
      type: 'string',
      esTypes: ['_id'],
      scripted: false,
      searchable: true,
      aggregatable: true,
      readFromDocValues: false,
      subType: undefined,
    },
    {
      count: 0,
      name: '_index',
      displayName: '_index',
      type: 'string',
      esTypes: ['_index'],
      scripted: false,
      searchable: true,
      aggregatable: true,
      readFromDocValues: false,
      subType: undefined,
    },
    {
      count: 0,
      name: '_score',
      displayName: '_score',
      type: 'number',
      scripted: false,
      searchable: false,
      aggregatable: false,
      readFromDocValues: false,
      subType: undefined,
    },
    {
      count: 0,
      name: '_source',
      displayName: '_source',
      type: '_source',
      esTypes: ['_source'],
      scripted: false,
      searchable: false,
      aggregatable: false,
      readFromDocValues: false,
      subType: undefined,
    },
    {
      count: 0,
      name: '_type',
      displayName: '_type',
      type: 'string',
      esTypes: ['_type'],
      scripted: false,
      searchable: true,
      aggregatable: true,
      readFromDocValues: false,
      subType: undefined,
    },
  ],
} as unknown) as IIndexPattern;

const booleanOperatorSuggestions = [
  { text: 'or', type: 'keyword' },
  { text: 'and', type: 'keyword' },
];

const notOperatorSuggestion = { text: 'not', type: 'keyword' };

const fieldNameSuggestions = [
  { text: 'Carrier', type: 'field' },
  { text: 'DestCityName', type: 'field' },
  { text: 'DestCountry', type: 'field' },
  { text: 'DestWeather', type: 'field' },
  { text: 'DistanceMiles', type: 'field' },
  { text: 'FlightDelay', type: 'field' },
  { text: 'FlightNum', type: 'field' },
  { text: 'OriginWeather', type: 'field' },
  { text: '_id', type: 'field' },
  { text: '_index', type: 'field' },
  { text: '_score', type: 'field' },
  { text: '_source', type: 'field' },
  { text: '_type', type: 'field' },
];

const fieldNameWithNotSuggestions = fieldNameSuggestions.concat(notOperatorSuggestion);

const getSuggestionsAtPos = async (query: string, endPos: number) => {
  return await getSuggestions({
    query,
    indexPatterns: [testingIndex],
    position: new monaco.Position(1, endPos),
    language: '', // not relevant
    selectionEnd: 0, // not relevant
    selectionStart: 0, // not relevant
  });
};

const getSuggestionAtEnd = async (query: string) => {
  return await getSuggestionsAtPos(query, query.length + 1);
};

describe('Test Boolean Operators', () => {
  it('should suggest AND and OR after expression', async () => {
    expect(await getSuggestionAtEnd('field: value ')).toStrictEqual(booleanOperatorSuggestions);
  });

  it('should suggest NOT initially', async () => {
    expect(await getSuggestionAtEnd('')).toContainEqual(notOperatorSuggestion);
  });

  it('should suggest NOT after expression', async () => {
    expect(await getSuggestionAtEnd('field: value and ')).toContainEqual(notOperatorSuggestion);
  });

  it('should not suggest NOT twice', async () => {
    expect(await getSuggestionAtEnd('not ')).not.toContainEqual(notOperatorSuggestion);
  });

  it('should suggest after multiple token search', async () => {
    expect(await getSuggestionAtEnd('field: one two three ')).toStrictEqual(
      booleanOperatorSuggestions
    );
  });

  it('should suggest after phrase value', async () => {
    expect(await getSuggestionAtEnd('field: "value" ')).toStrictEqual(booleanOperatorSuggestions);
  });

  it('should suggest after number', async () => {
    expect(await getSuggestionAtEnd('field: 123 ')).toStrictEqual(booleanOperatorSuggestions);
  });

  it('should not suggest after incomplete quote', async () => {
    expect(await getSuggestionAtEnd('field: "value ')).not.toStrictEqual(
      booleanOperatorSuggestions
    );
  });
});

describe('Test Boolean Operators within groups', () => {
  it('should suggest AND and OR', async () => {
    expect(await getSuggestionAtEnd('field: (value ')).toStrictEqual(booleanOperatorSuggestions);
  });

  it('should suggest NOT after expression', async () => {
    expect(await getSuggestionAtEnd('field: (value and ')).toContainEqual(notOperatorSuggestion);
  });

  it('should suggest operator within nested group', async () => {
    expect(await getSuggestionAtEnd('field: ("one" and ("two" ')).toStrictEqual(
      booleanOperatorSuggestions
    );
  });
});

describe('Test field suggestions', () => {
  it('basic field suggestion', async () => {
    expect(await getSuggestionAtEnd('')).toStrictEqual(fieldNameWithNotSuggestions);
  });

  it('field suggestion after one term', async () => {
    expect(await getSuggestionAtEnd('field: value and ')).toStrictEqual(
      fieldNameWithNotSuggestions
    );
  });

  it('field suggestion within group', async () => {
    expect(await getSuggestionAtEnd('field: value and (one: "two" or ')).toStrictEqual(
      fieldNameWithNotSuggestions
    );
  });
});
