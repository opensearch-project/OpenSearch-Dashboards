/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '@osd/monaco';
import { getSuggestions } from './code_completion';
import { DataPublicPluginStart, IDataPluginServices } from '../../types';
import { IndexPattern } from '../../index_patterns';

/**
 * Constants
 */

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
  getFieldByName: jest.fn((fieldName: string) => {
    return testingIndex.fields.find((field) => field.name === fieldName);
  }),
} as unknown) as IndexPattern;

const booleanOperatorSuggestions = [
  { text: 'or', type: 11, detail: 'Operator', insertText: 'or ' },
  { text: 'and', type: 11, detail: 'Operator', insertText: 'and ' },
];

const notOperatorSuggestion = { text: 'not', type: 11, detail: 'Operator', insertText: 'not ' };

const fieldNameSuggestions: Array<{
  text: string;
  type: number;
  insertText?: string;
  detail: string;
}> = [
  { text: 'Carrier', type: 3, insertText: 'Carrier : ', detail: 'Field: keyword' },
  { text: 'DestCityName', type: 3, insertText: 'DestCityName : ', detail: 'Field: keyword' },
  { text: 'DestCountry', type: 3, insertText: 'DestCountry : ', detail: 'Field: keyword' },
  { text: 'DestWeather', type: 3, insertText: 'DestWeather : ', detail: 'Field: keyword' },
  { text: 'DistanceMiles', type: 3, insertText: 'DistanceMiles ', detail: 'Field: float' },
  { text: 'FlightDelay', type: 3, insertText: 'FlightDelay : ', detail: 'Field: boolean' },
  { text: 'FlightNum', type: 3, insertText: 'FlightNum : ', detail: 'Field: keyword' },
  { text: 'OriginWeather', type: 3, insertText: 'OriginWeather : ', detail: 'Field: keyword' },
  { text: '_id', type: 3, insertText: '_id : ', detail: 'Field: _id' },
  { text: '_index', type: 3, insertText: '_index : ', detail: 'Field: _index' },
  { text: '_score', type: 3, insertText: '_score ', detail: 'Field: number' },
  { text: '_source', type: 3, insertText: '_source ', detail: 'Field: _source' },
  { text: '_type', type: 3, insertText: '_type : ', detail: 'Field: _type' },
];

const fieldNameWithNotSuggestions = fieldNameSuggestions.concat(notOperatorSuggestion);

const carrierValues = [
  'Logstash Airways',
  'BeatsWest',
  'OpenSearch Dashboards Airlines',
  'OpenSearch-Air',
];

const allCarrierValueSuggestions = [
  { text: 'Logstash Airways', type: 13, detail: 'Value', insertText: '"Logstash Airways" ' },
  { text: 'BeatsWest', type: 13, detail: 'Value', insertText: '"BeatsWest" ' },
  {
    text: 'OpenSearch Dashboards Airlines',
    type: 13,
    detail: 'Value',
    insertText: '"OpenSearch Dashboards Airlines" ',
  },
  { text: 'OpenSearch-Air', type: 13, detail: 'Value', insertText: '"OpenSearch-Air" ' },
];

const carrierWithNotSuggestions = allCarrierValueSuggestions.concat(notOperatorSuggestion);

const logCarrierValueSuggestion = [
  { text: 'Logstash Airways', type: 13, detail: 'Value', insertText: '"Logstash Airways" ' },
];

const openCarrierValueSuggestion = [
  {
    text: 'OpenSearch Dashboards Airlines',
    type: 13,
    detail: 'Value',
    insertText: '"OpenSearch Dashboards Airlines" ',
  },
  { text: 'OpenSearch-Air', type: 13, detail: 'Value', insertText: '"OpenSearch-Air" ' },
];

const addPositionToValue = (vals: any, start: number, end: number) =>
  vals.map((val: any) => {
    return { ...val, replacePosition: new monaco.Range(1, start, 1, end) };
  });

/**
 * Actual Tests
 */

jest.mock('../../services', () => ({
  getUiService: () => ({
    Settings: {
      supportsEnhancementsEnabled: () => true,
    },
  }),
}));

const mockValueSuggestions = jest.fn((passedin) => {
  const { field, query } = passedin;
  if (field?.name === 'Carrier') {
    return carrierValues.filter((val) => val.startsWith(query));
  }
  return [];
});

const getSuggestionsAtPos = async (query: string, endPos: number) => {
  return await getSuggestions({
    query,
    indexPattern: testingIndex,
    position: new monaco.Position(1, endPos),
    language: '', // not relevant
    selectionEnd: 0, // not relevant
    selectionStart: 0, // not relevant
    services: {
      appName: 'discover',
      data: ({
        autocomplete: { getValueSuggestions: mockValueSuggestions },
      } as unknown) as DataPublicPluginStart,
    } as IDataPluginServices,
  });
};

const getSuggestionsAtEnd = async (query: string) => {
  return await getSuggestionsAtPos(query, query.length + 1);
};

const testAroundClosing = (
  query: string,
  surroundingChars: Array<string | undefined>,
  testName: string,
  expectedValue: any,
  includeBase?: boolean
) => {
  if (includeBase) {
    it(testName, async () => {
      expect(await getSuggestionsAtEnd(query)).toStrictEqual(expectedValue);
    });
  }

  let currQuery = query;
  if (surroundingChars[0]) {
    it(testName + ' - opened', async () => {
      currQuery = currQuery + surroundingChars[0];
      expect(await getSuggestionsAtEnd(currQuery)).toStrictEqual(expectedValue);
    });
  }

  it(testName + ' - closed', async () => {
    currQuery = currQuery + surroundingChars[1];
    expect(await getSuggestionsAtPos(currQuery, currQuery.length)).toStrictEqual(expectedValue);
  });

  // TODO: besides NOT issue, need to consolidate behavior where there is no val vs w/ val
  it.skip(testName + ' - no suggestion after closing', async () => {
    expect(await getSuggestionsAtEnd(currQuery)).toStrictEqual([]);
  });
};

describe('Test Boolean Operators', () => {
  it('should suggest AND and OR after expression', async () => {
    expect(await getSuggestionsAtEnd('field: value ')).toStrictEqual(booleanOperatorSuggestions);
  });

  it('should suggest NOT initially', async () => {
    expect(await getSuggestionsAtEnd('')).toContainEqual(notOperatorSuggestion);
  });

  it('should suggest NOT after expression', async () => {
    expect(await getSuggestionsAtEnd('field: value and ')).toContainEqual(notOperatorSuggestion);
  });

  it('should not suggest NOT twice', async () => {
    expect(await getSuggestionsAtEnd('not ')).not.toContainEqual(notOperatorSuggestion);
  });

  it('should suggest after multiple token search', async () => {
    expect(await getSuggestionsAtEnd('field: one two three ')).toStrictEqual(
      booleanOperatorSuggestions
    );
  });

  it('should suggest after phrase value', async () => {
    expect(await getSuggestionsAtEnd('field: "value" ')).toStrictEqual(booleanOperatorSuggestions);
  });

  it('should suggest after number', async () => {
    expect(await getSuggestionsAtEnd('field: 123 ')).toStrictEqual(booleanOperatorSuggestions);
  });

  it('should not suggest after incomplete quote', async () => {
    expect(await getSuggestionsAtEnd('field: "value ')).not.toStrictEqual(
      booleanOperatorSuggestions
    );
  });
});

describe('Test Boolean Operators within groups', () => {
  it('should suggest AND and OR', async () => {
    expect(await getSuggestionsAtEnd('field: (value ')).toStrictEqual(booleanOperatorSuggestions);
  });

  it('should suggest NOT after expression', async () => {
    expect(await getSuggestionsAtEnd('field: (value and ')).toContainEqual(notOperatorSuggestion);
  });

  it('should suggest operator within nested group', async () => {
    expect(await getSuggestionsAtEnd('field: ("one" and ("two" ')).toStrictEqual(
      booleanOperatorSuggestions
    );
  });
});

describe('Test field suggestions', () => {
  it('basic field suggestion', async () => {
    expect(await getSuggestionsAtEnd('')).toStrictEqual(fieldNameWithNotSuggestions);
  });

  it('field suggestion after one term', async () => {
    expect(await getSuggestionsAtEnd('field: value and ')).toStrictEqual(
      fieldNameWithNotSuggestions
    );
  });

  it('field suggestion within group', async () => {
    expect(await getSuggestionsAtEnd('field: value and (one: "two" or ')).toStrictEqual(
      fieldNameWithNotSuggestions
    );
  });
});

describe('Test basic value suggestions', () => {
  it('do not suggest unknown field', async () => {
    expect(await getSuggestionsAtEnd('field: ')).toStrictEqual([]);
  });

  it('suggest token search value for field', async () => {
    expect(await getSuggestionsAtEnd('Carrier: ')).toStrictEqual(
      addPositionToValue(allCarrierValueSuggestions, 10, 10)
    );
  });

  it('suggest value for field without surrounding space', async () => {
    expect(await getSuggestionsAtEnd('Carrier:')).toStrictEqual(
      addPositionToValue(allCarrierValueSuggestions, 9, 9)
    );
  });

  it('suggest value from partial value', async () => {
    expect(await getSuggestionsAtEnd('Carrier: Log')).toStrictEqual(
      addPositionToValue(logCarrierValueSuggestion, 10, 13)
    );
  });

  it('suggest multiple values from partial value', async () => {
    expect(await getSuggestionsAtEnd('Carrier: Open')).toStrictEqual(
      addPositionToValue(openCarrierValueSuggestion, 10, 14)
    );
  });

  testAroundClosing(
    'Carrier: ',
    ['"', '"'],
    'should suggest within phrase',
    addPositionToValue(allCarrierValueSuggestions, 11, 11)
  );

  it('suggest rest of partial value within quotes', async () => {
    const query = 'Carrier: "OpenSearch"';
    expect(await getSuggestionsAtPos(query, query.length)).toStrictEqual(
      addPositionToValue(openCarrierValueSuggestion, 11, 21)
    );
  });

  //   it('should suggest within multiple token search context'); <-- maybe it means suggest either bool OR next partial value
});

describe('Test value suggestion with multiple terms', () => {
  it('should suggest after one field value expression', async () => {
    expect(await getSuggestionsAtEnd('Carrier: BeatsWest or Carrier: ')).toStrictEqual(
      addPositionToValue(allCarrierValueSuggestions, 32, 32)
    );
  });

  testAroundClosing(
    'Carrier: BeatsWest or Carrier: ',
    ['"', '"'],
    'should suggest after one field value expression',
    addPositionToValue(allCarrierValueSuggestions, 33, 33)
  );

  it('should suggest after field value expression and partial value', async () => {
    expect(await getSuggestionsAtEnd('Carrier: BeatsWest or Carrier: Open')).toStrictEqual(
      addPositionToValue(openCarrierValueSuggestion, 32, 36)
    );
  });

  testAroundClosing(
    'Carrier: BeatsWest or Carrier: "Open',
    [undefined, '"'],
    'should suggest after field value expression in partial value quotes',
    addPositionToValue(openCarrierValueSuggestion, 33, 37),
    true
  );
});

describe('Test group value suggestions', () => {
  testAroundClosing(
    'Carrier: ',
    ['(', ')'],
    'should suggest within grouping',
    addPositionToValue(allCarrierValueSuggestions, 11, 11).concat(notOperatorSuggestion)
  );

  testAroundClosing(
    'Carrier: (',
    ['"', '"'],
    'should suggest within grouping and phrase',
    addPositionToValue(allCarrierValueSuggestions, 12, 12)
  );

  testAroundClosing(
    'Carrier: ("',
    [undefined, '")'],
    'should suggest within closed grouping and phrase',
    addPositionToValue(allCarrierValueSuggestions, 13, 13)
  );

  testAroundClosing(
    'Carrier: (BeatsWest or ',
    [undefined, ')'],
    'should suggest after grouping with term',
    addPositionToValue(allCarrierValueSuggestions, 24, 24).concat(notOperatorSuggestion),
    true
  );

  it('should suggest in phrase after grouping with term - opened', async () => {
    const currQuery = 'Carrier: (BeatsWest or "';
    expect(await getSuggestionsAtEnd(currQuery)).toStrictEqual(
      addPositionToValue(allCarrierValueSuggestions, 25, 25)
    );
  });

  it('should suggest in phrase after grouping with term - closed', async () => {
    const currQuery = 'Carrier: (BeatsWest or "")';
    expect(await getSuggestionsAtPos(currQuery, 25)).toStrictEqual(
      addPositionToValue(allCarrierValueSuggestions, 25, 25)
    );
  });

  testAroundClosing(
    'Carrier: ("BeatsWest" or ',
    [undefined, ')'],
    'should suggest after grouping with phrase',
    addPositionToValue(allCarrierValueSuggestions, 26, 26).concat(notOperatorSuggestion),
    true
  );

  it('should suggest in phrase after grouping with phrase - opened', async () => {
    const currQuery = 'Carrier: ("BeatsWest" or "';
    expect(await getSuggestionsAtEnd(currQuery)).toStrictEqual(
      addPositionToValue(allCarrierValueSuggestions, 27, 27)
    );
  });

  it('should suggest in phrase after grouping with phrase - closed', async () => {
    const currQuery = 'Carrier: ("BeatsWest" or "")';
    expect(await getSuggestionsAtPos(currQuery, 27)).toStrictEqual(
      addPositionToValue(allCarrierValueSuggestions, 27, 27)
    );
  });
});
