/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import multipleDataSourcesJSON from './test_utils/vega_spec_with_multiple_urls.json';
import multipleDataSourcesJSONMds from './test_utils/vega_spec_with_multiple_urls_mds.json';
import openSearchQueryJSON from './test_utils/vega_spec_with_opensearch_query.json';
import nonOpenSearchQueryJSON from './test_utils/vega_spec_without_opensearch_query.json';
import { readFileSync } from 'fs';
import { appendDataSourceNameToVegaSpec } from './utils';
import { parse } from 'hjson';
import { isEqual } from 'lodash';
import { join } from 'path';

describe('Parse Vega Spec', () => {
  /*
    Test cases:
        - (JSON Spec)
            - data has only one url body and is an opensearch query type
            - data has only one url body and isn't an opensearch query type
            - data has multiple url bodies and contains different types of url bodies
            - data has multiple url bodies but none are local cluster queries
        - (HJSON Spec)
            - data has only one url body and is an opensearch query type
            - data has only one url body and isn't an opensearch query type
            - data has multiple url bodies and contains different types of url bodies
            - data has multiple url bodies but none are local cluster queries
    */

  const loadHJSONStringFromFile = (filepath: string) => {
    return readFileSync(join(__dirname, filepath)).toString();
  };

  test('(JSON) When data has only one url body and it is an opensearch query, add data_source_name field to the spec', () => {
    const jsonString = JSON.stringify(openSearchQueryJSON);
    const modifiedString = JSON.parse(appendDataSourceNameToVegaSpec(jsonString, 'newDataSource'));

    expect(modifiedString.data.url.hasOwnProperty('data_source_name')).toBe(true);
    expect(modifiedString.data.url.data_source_name).toBe('newDataSource');

    // These fields should be unchanged
    Object.keys(openSearchQueryJSON).forEach((field) => {
      if (field !== 'data') {
        expect(
          isEqual(
            modifiedString[field as keyof typeof openSearchQueryJSON],
            openSearchQueryJSON[field as keyof typeof openSearchQueryJSON]
          )
        ).toBe(true);
      }
    });
  });

  test('(JSON) When data has only one url body and it is not an opensearch query, change nothing', () => {
    const jsonString = JSON.stringify(nonOpenSearchQueryJSON);
    const modifiedJSON = JSON.parse(appendDataSourceNameToVegaSpec(jsonString, 'noDataSource'));
    expect(isEqual(modifiedJSON, nonOpenSearchQueryJSON)).toBe(true);
  });

  test('(JSON) When data has multiple url bodies, make sure only opensearch queries are updated with data_source_names', () => {
    const jsonString = JSON.stringify(multipleDataSourcesJSON);
    const modifiedString = JSON.parse(appendDataSourceNameToVegaSpec(jsonString, 'newDataSource'));

    expect(modifiedString.data.length).toBe(multipleDataSourcesJSON.data.length);
    for (let i = 0; i < modifiedString.data.length; i++) {
      const originalUrlBody = multipleDataSourcesJSON.data[i];
      const urlBody = modifiedString.data[i];

      if (urlBody.name !== 'exampleIndexSource') {
        expect(isEqual(originalUrlBody, urlBody)).toBe(true);
      } else {
        expect(urlBody.url.hasOwnProperty('data_source_name')).toBe(true);
        expect(urlBody.url.data_source_name).toBe('newDataSource');
      }
    }

    // These fields should be unchanged
    Object.keys(multipleDataSourcesJSON).forEach((field) => {
      if (field !== 'data') {
        expect(
          isEqual(
            modifiedString[field as keyof typeof multipleDataSourcesJSON],
            multipleDataSourcesJSON[field as keyof typeof multipleDataSourcesJSON]
          )
        ).toBe(true);
      }
    });
  });

  test('(JSON) When an MDS object does not reference local queries, return the same spec', () => {
    const jsonString = JSON.stringify(multipleDataSourcesJSONMds);
    const modifiedJSON = JSON.parse(appendDataSourceNameToVegaSpec(jsonString, 'noDataSource'));
    expect(isEqual(modifiedJSON, multipleDataSourcesJSONMds)).toBe(true);
  });

  test('(HJSON) When data has only one url body and it is an opensearch query, add data_source_name field to the spec', () => {
    const hjsonString = loadHJSONStringFromFile(
      '/test_utils/vega_spec_with_opensearch_query.hjson'
    );

    const originalHJSONParse = parse(hjsonString, { keepWsc: true });
    const hjsonParse = parse(appendDataSourceNameToVegaSpec(hjsonString, 'newDataSource'), {
      keepWsc: true,
    });

    expect(hjsonParse.data.url.hasOwnProperty('data_source_name')).toBe(true);
    expect(hjsonParse.data.url.data_source_name).toBe('newDataSource');

    // These fields should be unchanged
    Object.keys(originalHJSONParse).forEach((field) => {
      if (field !== 'data') {
        expect(
          isEqual(
            originalHJSONParse[field as keyof typeof originalHJSONParse],
            hjsonParse[field as keyof typeof originalHJSONParse]
          )
        ).toBe(true);
      }
    });
  });

  test('(HJSON) When data has only one url body and it is not an opensearch query, change nothing', () => {
    const hjsonString = loadHJSONStringFromFile(
      '/test_utils/vega_spec_without_opensearch_query.hjson'
    );
    const originalHJSONParse = parse(hjsonString, { keepWsc: true });
    const hjsonParse = parse(appendDataSourceNameToVegaSpec(hjsonString, 'noDataSource'));

    expect(isEqual(originalHJSONParse, hjsonParse)).toBe(true);
  });

  test('(HJSON) When data has multiple url bodies, make sure only opensearch queries are updated with data_source_names', () => {
    const hjsonString = loadHJSONStringFromFile('/test_utils/vega_spec_with_multiple_urls.hjson');
    const originalHJSONParse = parse(hjsonString, { keepWsc: true });
    const hjsonParse = parse(appendDataSourceNameToVegaSpec(hjsonString, 'newDataSource'));

    expect(hjsonParse.data.length).toBe(originalHJSONParse.data.length);
    for (let i = 0; i < hjsonParse.data.length; i++) {
      const originalUrlBody = originalHJSONParse.data[i];
      const urlBody = hjsonParse.data[i];

      if (urlBody.name !== 'exampleIndexSource') {
        expect(isEqual(originalUrlBody, urlBody)).toBe(true);
      } else {
        expect(urlBody.url.hasOwnProperty('data_source_name')).toBe(true);
        expect(urlBody.url.data_source_name).toBe('newDataSource');
      }
    }

    // These fields should be unchanged
    Object.keys(originalHJSONParse).forEach((field) => {
      if (field !== 'data') {
        expect(
          isEqual(
            originalHJSONParse[field as keyof typeof originalHJSONParse],
            hjsonParse[field as keyof typeof originalHJSONParse]
          )
        ).toBe(true);
      }
    });
  });

  test('(HJSON) When an MDS object does not reference local queries, return the same spec', () => {
    const hjsonString = loadHJSONStringFromFile(
      '/test_utils/vega_spec_with_multiple_urls_mds.hjson'
    );
    const originalHJSONParse = parse(hjsonString, { keepWsc: true });
    const hjsonParse = parse(appendDataSourceNameToVegaSpec(hjsonString, 'noDataSource'));

    expect(isEqual(originalHJSONParse, hjsonParse)).toBe(true);
  });
});
