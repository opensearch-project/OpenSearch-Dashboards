/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  extractDataSourceNamesInVegaSpec,
  extractVegaSpecFromAttributes,
  findDataSourceIdbyName,
} from './utils';
import { readFileSync } from 'fs';
import { join } from 'path';
import { SavedObjectsClientContract, SavedObjectsFindOptions } from 'src/core/server';

describe('findDataSourceIdbyName()', () => {
  const savedObjectsClient = {} as SavedObjectsClientContract;
  savedObjectsClient.find = jest.fn().mockImplementation((query: SavedObjectsFindOptions) => {
    if (query.search === `"uniqueDataSource"`) {
      return Promise.resolve({
        total: 1,
        saved_objects: [{ id: 'some-datasource-id', attributes: { title: 'uniqueDataSource' } }],
      });
    } else if (query.search === `"duplicateDataSource"`) {
      return Promise.resolve({
        total: 2,
        saved_objects: [
          { id: 'some-datasource-id', attributes: { title: 'duplicateDataSource' } },
          { id: 'some-other-datasource-id', attributes: { title: 'duplicateDataSource' } },
        ],
      });
    } else if (query.search === `"DataSource"`) {
      return Promise.resolve({
        total: 2,
        saved_objects: [
          { id: 'some-datasource-id', attributes: { title: 'DataSource' } },
          { id: 'some-other-datasource-id', attributes: { title: 'DataSource Copy' } },
        ],
      });
    } else {
      return Promise.resolve({
        total: 0,
        saved_objects: [],
      });
    }
  });

  test('If no matching dataSourceName, then throw error', () => {
    expect(
      findDataSourceIdbyName({ dataSourceName: 'nonexistentDataSource', savedObjectsClient })
    ).rejects.toThrowError(
      'Expected exactly 1 result for data_source_name "nonexistentDataSource" but got 0 results'
    );
  });

  test('If duplicate dataSourceNames, then throw error', () => {
    expect(
      findDataSourceIdbyName({ dataSourceName: 'duplicateDataSource', savedObjectsClient })
    ).rejects.toThrowError(
      'Expected exactly 1 result for data_source_name "duplicateDataSource" but got 2 results'
    );
  });

  test('If dataSource is enabled but only one dataSourceName, then return id', async () => {
    expect(
      await findDataSourceIdbyName({ dataSourceName: 'uniqueDataSource', savedObjectsClient })
    ).toBe('some-datasource-id');
  });

  test('If dataSource is enabled and the dataSourceName is a prefix of another, ensure the prefix is only returned', async () => {
    expect(await findDataSourceIdbyName({ dataSourceName: 'DataSource', savedObjectsClient })).toBe(
      'some-datasource-id'
    );
  });
});

describe('extractDataSourceNamesInVegaSpec()', () => {
  const loadHJSONStringFromFile = (filepath: string) => {
    return readFileSync(join(__dirname, filepath)).toString();
  };

  const loadJSONFromFile = (filepath: string) => {
    return JSON.parse(readFileSync(join(__dirname, filepath)).toString());
  };

  // JSON test cases
  test('(JSON) Set should be empty when no queries are in the Vega spec', () => {
    const noQueryJSON = loadJSONFromFile('/test_utils/vega_spec_without_opensearch_query.json');
    expect(extractDataSourceNamesInVegaSpec(JSON.stringify(noQueryJSON))).toMatchObject(new Set());
  });

  test('(JSON) Set should be empty when one local cluster query is in the Vega spec', () => {
    const oneLocalQueryJSON = loadJSONFromFile('/test_utils/vega_spec_with_opensearch_query.json');
    expect(extractDataSourceNamesInVegaSpec(JSON.stringify(oneLocalQueryJSON))).toMatchObject(
      new Set()
    );
  });

  test('(JSON) Set should have exactly one data_source_name when one data source query is in the Vega spec', () => {
    const oneDataSourceQueryJSON = loadJSONFromFile(
      '/test_utils/vega_spec_with_opensearch_query_mds.json'
    );
    expect(extractDataSourceNamesInVegaSpec(JSON.stringify(oneDataSourceQueryJSON))).toMatchObject(
      new Set(['example data source'])
    );
  });

  test('(JSON) Set should be empty when many local cluster queries are in the Vega spec', () => {
    const manyLocalQueriesJSON = loadJSONFromFile('/test_utils/vega_spec_with_multiple_urls.json');
    expect(extractDataSourceNamesInVegaSpec(JSON.stringify(manyLocalQueriesJSON))).toMatchObject(
      new Set()
    );
  });

  test('(JSON) Set have multiple data_source_name fields when the Vega spec has a mix of local cluster and data source queries', () => {
    const manyDataSourceQueriesJSON = loadJSONFromFile(
      '/test_utils/vega_spec_with_multiple_urls_mds.json'
    );
    expect(
      extractDataSourceNamesInVegaSpec(JSON.stringify(manyDataSourceQueriesJSON))
    ).toMatchObject(new Set(['some other datasource name', 'some datasource name']));
  });

  // HJSON test cases
  test('(HJSON) Set should be empty when no queries are in the Vega spec', () => {
    const noQueryHJSON = loadHJSONStringFromFile(
      '/test_utils/vega_spec_without_opensearch_query.hjson'
    );
    expect(extractDataSourceNamesInVegaSpec(noQueryHJSON)).toMatchObject(new Set());
  });

  test('(HJSON) Set should be empty when one local cluster query is in the Vega spec', () => {
    const oneLocalQueryHJSON = loadHJSONStringFromFile(
      '/test_utils/vega_spec_with_opensearch_query.hjson'
    );
    expect(extractDataSourceNamesInVegaSpec(oneLocalQueryHJSON)).toMatchObject(new Set());
  });

  test('(HJSON) Set should have exactly one data_source_name when one data source query is in the Vega spec', () => {
    const oneDataSourceQueryHJSON = loadHJSONStringFromFile(
      '/test_utils/vega_spec_with_opensearch_query_mds.hjson'
    );
    expect(extractDataSourceNamesInVegaSpec(oneDataSourceQueryHJSON)).toMatchObject(
      new Set(['example data source'])
    );
  });

  test('(HJSON) Set should be empty when many local cluster queries are in the Vega spec', () => {
    const manyLocalQueriesHJSON = loadHJSONStringFromFile(
      '/test_utils/vega_spec_with_multiple_urls.hjson'
    );
    expect(extractDataSourceNamesInVegaSpec(manyLocalQueriesHJSON)).toMatchObject(new Set());
  });

  test('(HJSON) Set have multiple data_source_name fields when the Vega spec has a mix of local cluster and data source queries', () => {
    const manyDataSourceQueriesHJSON = loadHJSONStringFromFile(
      '/test_utils/vega_spec_with_multiple_urls_mds.hjson'
    );
    expect(extractDataSourceNamesInVegaSpec(manyDataSourceQueriesHJSON)).toMatchObject(
      new Set(['some other datasource name', 'some datasource name'])
    );
  });
});

describe('extractVegaSpecFromSavedObject()', () => {
  test('For a Vega visualization saved object, return its spec', () => {
    const spec = 'some-vega-spec';
    const vegaAttributes = {
      visState: `{"type": "vega", "params": {"spec": "${spec}"}}`,
    };

    expect(extractVegaSpecFromAttributes(vegaAttributes)).toBe(spec);
  });

  test('For another saved object type, return undefined', () => {
    const nonVegaAttributes = {
      visState: `{"type": "area", "params": {"spec": "some-spec"}}`,
    };

    expect(extractVegaSpecFromAttributes(nonVegaAttributes)).toBe(undefined);
  });
});
