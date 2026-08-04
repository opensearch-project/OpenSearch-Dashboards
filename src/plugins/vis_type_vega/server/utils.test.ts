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
    ).rejects.toThrow(
      'Expected exactly 1 result for data_source_name "nonexistentDataSource" but got 0 results'
    );
  });

  test('If duplicate dataSourceNames, then throw error', () => {
    expect(
      findDataSourceIdbyName({ dataSourceName: 'duplicateDataSource', savedObjectsClient })
    ).rejects.toThrow(
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
    return readFileSync(join(__dirname, filepath), 'utf8').toString();
  };

  const loadJSONFromFile = (filepath: string) => {
    return JSON.parse(readFileSync(join(__dirname, filepath), 'utf8').toString());
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

  // Vega spec with no data field at all (marks-only visualization)
  test('Set should be empty when the Vega spec has no data field', () => {
    const noDataFieldJSON = loadJSONFromFile('/test_utils/vega_spec_no_data_field.json');
    expect(extractDataSourceNamesInVegaSpec(JSON.stringify(noDataFieldJSON))).toMatchObject(
      new Set()
    );
  });

  // Vega spec with top-level data containing data_source_name
  test('Set should have one data_source_name from a Vega spec with data_source_name in data array', () => {
    const vegaWithDsName = loadJSONFromFile('/test_utils/vega_spec_with_data_source_name.json');
    expect(extractDataSourceNamesInVegaSpec(JSON.stringify(vegaWithDsName))).toMatchObject(
      new Set(['my-datasource'])
    );
  });

  // Vega-Lite spec with data_source_name nested inside layers
  test('Set should extract data_source_name from Vega-Lite layer composition', () => {
    const vegaLiteLayerSpec = loadJSONFromFile('/test_utils/vega_lite_spec_with_layers_mds.json');
    expect(extractDataSourceNamesInVegaSpec(JSON.stringify(vegaLiteLayerSpec))).toMatchObject(
      new Set(['my-datasource'])
    );
  });

  // Vega-Lite spec with data_source_name in hconcat views
  test('Set should extract multiple data_source_names from Vega-Lite hconcat composition', () => {
    const vegaLiteHconcatSpec = loadJSONFromFile(
      '/test_utils/vega_lite_spec_with_hconcat_mds.json'
    );
    expect(extractDataSourceNamesInVegaSpec(JSON.stringify(vegaLiteHconcatSpec))).toMatchObject(
      new Set(['datasource-alpha', 'datasource-beta'])
    );
  });

  // Vega-Lite spec with top-level data and facet/spec composition
  test('Set should extract data_source_name from top-level data in a faceted Vega-Lite spec', () => {
    const vegaLiteFacetSpec = loadJSONFromFile('/test_utils/vega_lite_spec_with_facet_mds.json');
    expect(extractDataSourceNamesInVegaSpec(JSON.stringify(vegaLiteFacetSpec))).toMatchObject(
      new Set(['top-level-datasource'])
    );
  });

  // Spec exceeding traversal node limit should not throw
  test('Should not throw on a spec that exceeds the traversal node limit', () => {
    // Build a spec with a layer array containing 15,000 items (exceeds MAX_TRAVERSAL_NODES of 10,000)
    const layers = Array.from({ length: 15000 }, (_, i) => ({
      data: {
        url: {
          data_source_name: `datasource-${i}`,
          index: `index-${i}`,
          body: { size: 1 },
        },
      },
      mark: 'point',
    }));
    const wideSpec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      layer: layers,
    };

    // Should not throw and should terminate gracefully
    expect(() => extractDataSourceNamesInVegaSpec(JSON.stringify(wideSpec))).not.toThrow();

    // Should find some data sources but not all 15,000 (capped by traversal limit)
    const result = extractDataSourceNamesInVegaSpec(JSON.stringify(wideSpec));
    expect(result.size).toBeGreaterThan(0);
    expect(result.size).toBeLessThan(15000);
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
