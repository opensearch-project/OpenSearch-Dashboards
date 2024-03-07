/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import multipleDataSourcesJSON from './test_utils/vega_spec_with_multiple_urls.json';
import openSearchQueryJSON from './test_utils/vega_spec_with_opensearch_query.json';
import nonOpenSearchQueryJSON from './test_utils/vega_spec_without_opensearch_query.json';
import { readFileSync } from 'fs';
import { appendDataSourceNameToVegaSpec } from './utils';
import { parse } from 'hjson';

describe('Parse Vega Spec', () => {
  /*
    Test cases:
        - (JSON Spec)
            - data has only one url body and is an opensearch query type
            - data has only one url body and isn't an opensearch query type
            - data has multiple url bodies and contains different types of url bodies
        - (HJSON Spec)
            - data has only one url body and is an opensearch query type
            - data has only one url body and isn't an opensearch query type
            - data has multiple url bodies and contains different types of url bodies
    */

  const loadHJSONStringFromFile = (filepath: string) => {
    return readFileSync(filepath).toString();
  };

  test('(JSON) When data has only one url body and it is an opensearch query, add data_source_name field to the spec', () => {
    const jsonString = JSON.stringify(openSearchQueryJSON);
    const modifiedString = JSON.parse(appendDataSourceNameToVegaSpec(jsonString, 'newDataSource'));

    expect(modifiedString.data.url.hasOwnProperty('data_source_name')).toBe(true);
    expect(modifiedString.data.url.data_source_name).toBe('newDataSource');
  });

  test('(JSON) When data has only one url body and it is not an opensearch query, change nothing', () => {
    const jsonString = JSON.stringify(nonOpenSearchQueryJSON);
    expect(appendDataSourceNameToVegaSpec(jsonString, 'noDataSource')).toBe(jsonString);
  });

  test('(JSON) When data has multiple url bodies, make sure only opensearch queries are updated with data_source_names', () => {
    const jsonString = JSON.stringify(multipleDataSourcesJSON);
  });

  test('(HJSON) When data has only one url body and it is an opensearch query, add data_source_name field to the spec', () => {
    const hjsonString = loadHJSONStringFromFile(
      './test_utils/vega_spec_with_opensearch_query.hjson'
    );
    const modifiedString = JSON.parse(appendDataSourceNameToVegaSpec(hjsonString, 'newDataSource'));
    const hjsonParse = parse(modifiedString, { keepWsc: true });

    expect(hjsonParse.data.url.hasOwnProperty('data_source_name')).toBe(true);
    expect(hjsonParse.data.url.data_source_name).toBe('newDataSource');
  });

  test('(HJSON) When data has only one url body and it is not an opensearch query, change nothing', () => {
    const hjsonString = loadHJSONStringFromFile(
      './test_utils/vega_spec_without_opensearch_query.hjson'
    );
    expect(appendDataSourceNameToVegaSpec(hjsonString, 'noDataSource')).toBe(hjsonString);
  });

  test('(HJSON) When data has multiple url bodies, make sure only opensearch queries are updated with data_source_names', () => {
    const hjsonString = loadHJSONStringFromFile('./test_utils/vega_spec_with_multiple_urls.hjson');
  });
});
