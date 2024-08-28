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
} as unknown) as IndexPattern;

const booleanOperatorSuggestions = [
  { end: -1, start: -1, text: 'or', type: 17 },
  { end: -1, start: -1, text: 'and', type: 17 },
];

const notOperatorSuggestion = { text: 'not', type: 17, end: -1, start: -1 };

const fieldNameSuggestions: Array<{
  text: string;
  type: number;
  insertText?: string;
  end: number;
  start: number;
}> = [
  { text: 'Carrier', type: 3, insertText: 'Carrier: ', end: -1, start: -1 },
  { text: 'DestCityName', type: 3, insertText: 'DestCityName: ', end: -1, start: -1 },
  { text: 'DestCountry', type: 3, insertText: 'DestCountry: ', end: -1, start: -1 },
  { text: 'DestWeather', type: 3, insertText: 'DestWeather: ', end: -1, start: -1 },
  { text: 'DistanceMiles', type: 3, insertText: 'DistanceMiles: ', end: -1, start: -1 },
  { text: 'FlightDelay', type: 3, insertText: 'FlightDelay: ', end: -1, start: -1 },
  { text: 'FlightNum', type: 3, insertText: 'FlightNum: ', end: -1, start: -1 },
  { text: 'OriginWeather', type: 3, insertText: 'OriginWeather: ', end: -1, start: -1 },
  { text: '_id', type: 3, insertText: '_id: ', end: -1, start: -1 },
  { text: '_index', type: 3, insertText: '_index: ', end: -1, start: -1 },
  { text: '_score', type: 3, insertText: '_score: ', end: -1, start: -1 },
  { text: '_source', type: 3, insertText: '_source: ', end: -1, start: -1 },
  { text: '_type', type: 3, insertText: '_type: ', end: -1, start: -1 },
];

const fieldNameWithNotSuggestions = fieldNameSuggestions.concat(notOperatorSuggestion);

const carrierValues = [
  'Logstash Airways',
  'BeatsWest',
  'OpenSearch Dashboards Airlines',
  'OpenSearch-Air',
];

const allCarrierValueSuggestions = [
  { text: 'Logstash Airways', type: 13, start: -1, end: -1 },
  { text: 'BeatsWest', type: 13, start: -1, end: -1 },
  {
    text: 'OpenSearch Dashboards Airlines',
    type: 13,
    start: -1,
    end: -1,
  },
  { text: 'OpenSearch-Air', type: 13, start: -1, end: -1 },
];

const carrierWithNotSuggestions = allCarrierValueSuggestions.concat(notOperatorSuggestion);

const logCarrierValueSuggestion = [{ text: 'Logstash Airways', type: 13, start: -1, end: -1 }];

const openCarrierValueSuggestion = [
  {
    text: 'OpenSearch Dashboards Airlines',
    type: 13,
    start: -1,
    end: -1,
  },
  { text: 'OpenSearch-Air', type: 13, start: -1, end: -1 },
];

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
    expect(await getSuggestionsAtEnd('Carrier: ')).toStrictEqual(allCarrierValueSuggestions);
  });

  it('suggest value for field without surrounding space', async () => {
    expect(await getSuggestionsAtEnd('Carrier:')).toStrictEqual(allCarrierValueSuggestions);
  });

  it('suggest value from partial value', async () => {
    expect(await getSuggestionsAtEnd('Carrier: Log')).toStrictEqual(logCarrierValueSuggestion);
  });

  it('suggest multiple values from partial value', async () => {
    expect(await getSuggestionsAtEnd('Carrier: Open')).toStrictEqual(openCarrierValueSuggestion);
  });

  testAroundClosing(
    'Carrier: ',
    ['"', '"'],
    'should suggest within phrase',
    allCarrierValueSuggestions
  );

  it('suggest rest of partial value within quotes', async () => {
    const query = 'Carrier: "OpenSearch"';
    expect(await getSuggestionsAtPos(query, query.length)).toStrictEqual(
      openCarrierValueSuggestion
    );
  });

  //   it('should suggest within multiple token search context'); <-- maybe it means suggest either bool OR next partial value
});

describe('Test value suggestion with multiple terms', () => {
  testAroundClosing(
    'Carrier: BeatsWest or Carrier: ',
    ['"', '"'],
    'should suggest after one field value expression',
    allCarrierValueSuggestions,
    true
  );

  it('should suggest after field value expression and partial value', async () => {
    expect(await getSuggestionsAtEnd('Carrier: BeatsWest or Carrier: Open')).toStrictEqual(
      openCarrierValueSuggestion
    );
  });

  testAroundClosing(
    'Carrier: BeatsWest or Carrier: "Open',
    [undefined, '"'],
    'should suggest after field value expression in partial value quotes',
    openCarrierValueSuggestion,
    true
  );
});

describe('Test group value suggestions', () => {
  testAroundClosing(
    'Carrier: ',
    ['(', ')'],
    'should suggest within grouping',
    carrierWithNotSuggestions
  );

  testAroundClosing(
    'Carrier: (',
    ['"', '"'],
    'should suggest within grouping and phrase',
    allCarrierValueSuggestions
  );

  testAroundClosing(
    'Carrier: ("',
    [undefined, '")'],
    'should suggest within closed grouping and phrase',
    allCarrierValueSuggestions
  );

  testAroundClosing(
    'Carrier: (BeatsWest or ',
    [undefined, ')'],
    'should suggest after grouping with term',
    carrierWithNotSuggestions,
    true
  );

  testAroundClosing(
    'Carrier: (BeatsWest or ',
    ['"', '")'],
    'should suggest in phrase after grouping with term',
    allCarrierValueSuggestions
  );

  testAroundClosing(
    'Carrier: ("BeatsWest" or ',
    [undefined, ')'],
    'should suggest after grouping with phrase',
    carrierWithNotSuggestions,
    true
  );

  testAroundClosing(
    'Carrier: ("BeatsWest" or ',
    ['"', '")'],
    'should suggest in phrase after grouping with phrase',
    allCarrierValueSuggestions
  );
});
