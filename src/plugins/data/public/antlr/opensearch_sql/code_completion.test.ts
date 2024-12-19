/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '@osd/monaco';
import { getSuggestions } from './code_completion';
import { DataPublicPluginStart, IDataPluginServices } from '../../types';
import { HttpSetup, IUiSettingsClient } from 'opensearch-dashboards/public';
import { UI_SETTINGS } from 'src/plugins/data/common';
import { IQueryStart, QueryStringContract } from '../../query';
import { testingIndex } from '../shared/constants';

const getSuggestionsAtPos = async (query: string, endPos: number) => {
  return await getSuggestions({
    query,
    indexPattern: testingIndex,
    position: new monaco.Position(1, endPos),
    language: '', // not relevant
    selectionEnd: 0, // not relevant
    selectionStart: 0, // not relevant
    services: ({
      http: ({
        fetch: jest.fn(),
      } as unknown) as HttpSetup,
      uiSettings: ({
        get: jest.fn().mockImplementation((setting) => {
          if (setting === UI_SETTINGS.QUERY_ENHANCEMENTS_SUGGEST_VALUES) {
            return true;
          }
          if (setting === UI_SETTINGS.QUERY_ENHANCEMENTS_SUGGEST_VALUES_LIMIT) {
            return 10;
          }
        }),
      } as unknown) as IUiSettingsClient,
      data: ({
        query: ({
          queryString: ({
            getQuery: jest.fn().mockReturnValue({ dataset: { dataSource: { id: 'test-id' } } }),
          } as unknown) as QueryStringContract,
        } as unknown) as IQueryStart,
      } as unknown) as DataPublicPluginStart,
      appName: 'discover',
    } as unknown) as IDataPluginServices,
  });
};

const getSuggestionsAtEnd = async (query: string) => {
  return await getSuggestionsAtPos(query, query.length + 1);
};

describe('End to end suggestion runs', () => {
  it('first suggestions', async () => {
    expect(await getSuggestionsAtEnd('')).toEqual([
      {
        detail: 'Keyword',
        insertText: 'SELECT ',
        sortText: '9select',
        text: 'SELECT',
        type: 17,
      },
      {
        detail: 'Keyword',
        insertText: 'SHOW ',
        sortText: '9show',
        text: 'SHOW',
        type: 17,
      },
      {
        detail: 'Keyword',
        insertText: 'DESCRIBE ',
        sortText: '9describe',
        text: 'DESCRIBE',
        type: 17,
      },
    ]);
  });

  it('column suggestions', async () => {
    expect(await getSuggestionsAtEnd('SELECT * FROM index WHERE ')).toEqual([
      {
        detail: 'Field: keyword',
        insertText: 'Carrier ',
        sortText: '2',
        text: 'Carrier',
        type: 3,
      },
      {
        detail: 'Field: keyword',
        insertText: 'DestCityName ',
        sortText: '2',
        text: 'DestCityName',
        type: 3,
      },
      {
        detail: 'Field: keyword',
        insertText: 'DestCountry ',
        sortText: '2',
        text: 'DestCountry',
        type: 3,
      },
      {
        detail: 'Field: keyword',
        insertText: 'DestWeather ',
        sortText: '2',
        text: 'DestWeather',
        type: 3,
      },
      {
        detail: 'Field: float',
        insertText: 'DistanceMiles ',
        sortText: '2',
        text: 'DistanceMiles',
        type: 3,
      },
      {
        detail: 'Field: boolean',
        insertText: 'FlightDelay ',
        sortText: '2',
        text: 'FlightDelay',
        type: 3,
      },
      {
        detail: 'Field: keyword',
        insertText: 'FlightNum ',
        sortText: '2',
        text: 'FlightNum',
        type: 3,
      },
      {
        detail: 'Field: keyword',
        insertText: 'OriginWeather ',
        sortText: '2',
        text: 'OriginWeather',
        type: 3,
      },
      {
        detail: 'Field: _id',
        insertText: '_id ',
        sortText: '2',
        text: '_id',
        type: 3,
      },
      {
        detail: 'Field: _index',
        insertText: '_index ',
        sortText: '2',
        text: '_index',
        type: 3,
      },
      {
        detail: 'Field: number',
        insertText: '_score ',
        sortText: '2',
        text: '_score',
        type: 3,
      },
      {
        detail: 'Field: _source',
        insertText: '_source ',
        sortText: '2',
        text: '_source',
        type: 3,
      },
      {
        detail: 'Field: _type',
        insertText: '_type ',
        sortText: '2',
        text: '_type',
        type: 3,
      },
      {
        detail: 'Keyword',
        insertText: 'NOT ',
        sortText: '9not',
        text: 'NOT',
        type: 17,
      },
      {
        detail: 'Keyword',
        insertText: 'FALSE ',
        sortText: '9false',
        text: 'FALSE',
        type: 17,
      },
      {
        detail: 'Keyword',
        insertText: 'TRUE ',
        sortText: '9true',
        text: 'TRUE',
        type: 17,
      },
      {
        detail: 'Keyword',
        insertText: 'INTERVAL ',
        sortText: '9interval',
        text: 'INTERVAL',
        type: 17,
      },
      {
        detail: 'Keyword',
        insertText: 'NULL ',
        sortText: '9null',
        text: 'NULL',
        type: 17,
      },
      {
        detail: 'Keyword',
        insertText: 'FIRST ',
        sortText: '9first',
        text: 'FIRST',
        type: 17,
      },
      {
        detail: 'Keyword',
        insertText: 'LAST ',
        sortText: '9last',
        text: 'LAST',
        type: 17,
      },
      {
        detail: 'Keyword',
        insertText: 'FULL ',
        sortText: '9full',
        text: 'FULL',
        type: 17,
      },
      {
        detail: 'Keyword',
        insertText: 'DATETIME ',
        sortText: '9datetime',
        text: 'DATETIME',
        type: 17,
      },
      {
        detail: 'Keyword',
        insertText: 'DAY ',
        sortText: '9day',
        text: 'DAY',
        type: 17,
      },
      {
        detail: 'Keyword',
        insertText: 'HOUR ',
        sortText: '9hour',
        text: 'HOUR',
        type: 17,
      },
      {
        detail: 'Keyword',
        insertText: 'MICROSECOND ',
        sortText: '9microsecond',
        text: 'MICROSECOND',
        type: 17,
      },
      {
        detail: 'Keyword',
        insertText: 'MINUTE ',
        sortText: '9minute',
        text: 'MINUTE',
        type: 17,
      },
      {
        detail: 'Keyword',
        insertText: 'MONTH ',
        sortText: '9month',
        text: 'MONTH',
        type: 17,
      },
      {
        detail: 'Keyword',
        insertText: 'QUARTER ',
        sortText: '9quarter',
        text: 'QUARTER',
        type: 17,
      },
      {
        detail: 'Keyword',
        insertText: 'SECOND ',
        sortText: '9second',
        text: 'SECOND',
        type: 17,
      },
      {
        detail: 'Keyword',
        insertText: 'WEEK ',
        sortText: '9week',
        text: 'WEEK',
        type: 17,
      },
      {
        detail: 'Keyword',
        insertText: 'YEAR ',
        sortText: '9year',
        text: 'YEAR',
        type: 17,
      },
      {
        detail: 'Keyword',
        insertText: 'LEFT ',
        sortText: '9left',
        text: 'LEFT',
        type: 17,
      },
      {
        detail: 'Keyword',
        insertText: 'RIGHT ',
        sortText: '9right',
        text: 'RIGHT',
        type: 17,
      },
      {
        detail: 'Keyword',
        insertText: 'CASE ',
        sortText: '9case',
        text: 'CASE',
        type: 17,
      },
      {
        detail: 'Keyword',
        insertText: 'CAST ',
        sortText: '9cast',
        text: 'CAST',
        type: 17,
      },
      {
        detail: 'Keyword',
        insertText: 'MATCH ',
        sortText: '9match',
        text: 'MATCH',
        type: 17,
      },
    ]);

    // it('table suggestions', async () => {
    //   expect(await getSuggestionsAtEnd('SELECT * FROM ')).toEqual([]);
    // });

    // it('table suggestions', async () => {
    //   expect(await getSuggestionsAtEnd('')).toEqual([]);
    // });

    // it('table suggestions', async () => {
    //   expect(await getSuggestionsAtEnd('')).toEqual([]);
    // });

    // it('table suggestions', async () => {
    //   expect(await getSuggestionsAtEnd('')).toEqual([]);
    // });
  });
});
