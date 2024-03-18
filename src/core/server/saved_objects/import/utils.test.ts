/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { readFileSync } from 'fs';
import {
  extractVegaSpecFromSavedObject,
  getDataSourceTitleFromId,
  updateDataSourceNameInVegaSpec,
} from './utils';
import { parse } from 'hjson';
import { isEqual } from 'lodash';
import { join } from 'path';
import { SavedObject, SavedObjectsClientContract } from '../types';

describe('updateDataSourceNameInVegaSpec()', () => {
  const loadHJSONStringFromFile = (filepath: string) => {
    return readFileSync(join(__dirname, filepath)).toString();
  };

  const loadJSONFromFile = (filepath: string) => {
    return JSON.parse(readFileSync(join(__dirname, filepath)).toString());
  };

  /*
  JSON Test cases
  */
  test('(JSON) When data has only one url body and it is an opensearch query, add data_source_name field to the spec', () => {
    const openSearchQueryJSON = loadJSONFromFile(
      './test_utils/vega_spec_with_opensearch_query.json'
    );
    const jsonString = JSON.stringify(openSearchQueryJSON);
    const modifiedString = JSON.parse(
      updateDataSourceNameInVegaSpec({ spec: jsonString, newDataSourceName: 'newDataSource' })
    );

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
    const nonOpenSearchQueryJSON = loadJSONFromFile(
      './test_utils/vega_spec_without_opensearch_query.json'
    );
    const jsonString = JSON.stringify(nonOpenSearchQueryJSON);
    const modifiedJSON = JSON.parse(
      updateDataSourceNameInVegaSpec({ spec: jsonString, newDataSourceName: 'noDataSource' })
    );
    expect(isEqual(modifiedJSON, nonOpenSearchQueryJSON)).toBe(true);
  });

  test('(JSON) When data has multiple url bodies, make sure only opensearch queries are updated with data_source_names', () => {
    const multipleDataSourcesJSON = loadJSONFromFile(
      './test_utils/vega_spec_with_multiple_urls.json'
    );
    const jsonString = JSON.stringify(multipleDataSourcesJSON);
    const modifiedString = JSON.parse(
      updateDataSourceNameInVegaSpec({ spec: jsonString, newDataSourceName: 'newDataSource' })
    );

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
    const multipleDataSourcesJSONMds = loadJSONFromFile(
      './test_utils/vega_spec_with_multiple_urls_mds.json'
    );
    const jsonString = JSON.stringify(multipleDataSourcesJSONMds);
    const modifiedJSON = JSON.parse(
      updateDataSourceNameInVegaSpec({ spec: jsonString, newDataSourceName: 'noDataSource' })
    );
    expect(isEqual(modifiedJSON, multipleDataSourcesJSONMds)).toBe(true);
  });

  /*
  HJSON Test cases
  */
  test('(HJSON) When data has only one url body and it is an opensearch query, add data_source_name field to the spec', () => {
    const hjsonString = loadHJSONStringFromFile(
      '/test_utils/vega_spec_with_opensearch_query.hjson'
    );

    const originalHJSONParse = parse(hjsonString, { keepWsc: true });
    const hjsonParse = parse(
      updateDataSourceNameInVegaSpec({ spec: hjsonString, newDataSourceName: 'newDataSource' }),
      {
        keepWsc: true,
      }
    );

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
    const hjsonParse = parse(
      updateDataSourceNameInVegaSpec({ spec: hjsonString, newDataSourceName: 'noDataSource' })
    );

    expect(isEqual(originalHJSONParse, hjsonParse)).toBe(true);
  });

  test('(HJSON) When data has multiple url bodies, make sure only opensearch queries are updated with data_source_names', () => {
    const hjsonString = loadHJSONStringFromFile('/test_utils/vega_spec_with_multiple_urls.hjson');
    const originalHJSONParse = parse(hjsonString, { keepWsc: true });
    const hjsonParse = parse(
      updateDataSourceNameInVegaSpec({ spec: hjsonString, newDataSourceName: 'newDataSource' })
    );

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
    const hjsonParse = parse(
      updateDataSourceNameInVegaSpec({ spec: hjsonString, newDataSourceName: 'newDataSource' })
    );

    expect(isEqual(originalHJSONParse, hjsonParse)).toBe(true);
  });
});

describe('extractVegaSpecFromSavedObject()', () => {
  test('For a Vega visualization saved object, return its spec', () => {
    const spec = 'some-vega-spec';
    const vegaSavedObject = {
      attributes: {
        visState: `{"type": "vega", "params": {"spec": "${spec}"}}`,
      },
    } as SavedObject;

    expect(extractVegaSpecFromSavedObject(vegaSavedObject)).toBe(spec);
  });

  test('For another saved object type, return undefined', () => {
    const nonVegaSavedObject = {
      attributes: {
        visState: `{"type": "area", "params": {"spec": "some-spec"}}`,
      },
    } as SavedObject;

    expect(extractVegaSpecFromSavedObject(nonVegaSavedObject)).toBe(undefined);
  });
});

describe('getDataSourceTitleFromId()', () => {
  const savedObjectsClient = {} as SavedObjectsClientContract;
  savedObjectsClient.get = jest.fn().mockImplementation((type, id) => {
    if (type === 'data-source' && id === 'valid-id') {
      return Promise.resolve({
        attributes: {
          title: 'some-datasource-title',
        },
      });
    }

    return Promise.resolve({});
  });

  test('When a valid id is passed, return the correct title', async () => {
    expect(await getDataSourceTitleFromId('valid-id', savedObjectsClient)).toBe(
      'some-datasource-title'
    );
  });

  test('When a nonexistent id is passed, return nothing', async () => {
    expect(await getDataSourceTitleFromId('nonexistent-id', savedObjectsClient)).toBe(undefined);
  });
});
