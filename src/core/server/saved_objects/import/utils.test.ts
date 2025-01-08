/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { readFileSync } from 'fs';
import {
  extractVegaSpecFromSavedObject,
  getDataSourceTitleFromId,
  getUpdatedTSVBVisState,
  updateDataSourceNameInVegaSpec,
  updateDataSourceNameInTimeline,
  findReferenceDataSourceForObject,
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

describe('updateDataSourceNameInTimeline()', () => {
  test('When a timeline expression does not contain a data source name, modify the expression', () => {
    const expression =
      '.opensearch(opensearch_dashboards_sample_data_logs, metric=avg:bytes, timefield=@timestamp).lines(show=true).points(show=true).yaxis(label="Average bytes")';
    const expectedExpression =
      '.opensearch(opensearch_dashboards_sample_data_logs, metric=avg:bytes, timefield=@timestamp, data_source_name="newDataSource").lines(show=true).points(show=true).yaxis(label="Average bytes")';
    expect(updateDataSourceNameInTimeline(expression, 'newDataSource')).toBe(expectedExpression);
  });

  test('When a timeline expression contains a data source name, then do nothing', () => {
    const expression =
      '.opensearch(opensearch_dashboards_sample_data_logs, metric=avg:bytes, timefield=@timestamp, data_source_name=newDataSource).lines(show=true).points(show=true).yaxis(label="Average bytes")';
    expect(updateDataSourceNameInTimeline(expression, 'newDataSource')).toBe(expression);
  });

  test('When a timeline expression contains multiple timeline expression, modify each of them', () => {
    const expression =
      '.opensearch(opensearch_dashboards_sample_data_logs, metric=avg:bytes, timefield=@timestamp,data_source_name=aos211).lines(show=true).points(show=true).yaxis(label="Average bytes"),.opensearch(opensearch_dashboards_sample_data_logs, metric=avg:bytes, timefield=@timestamp).lines(show=true).points(show=true).yaxis(label="Average bytes")';
    const expectedExpression =
      '.opensearch(opensearch_dashboards_sample_data_logs, metric=avg:bytes, timefield=@timestamp,data_source_name=aos211).lines(show=true).points(show=true).yaxis(label="Average bytes"),.opensearch(opensearch_dashboards_sample_data_logs, metric=avg:bytes, timefield=@timestamp, data_source_name="aos211").lines(show=true).points(show=true).yaxis(label="Average bytes")';
    expect(updateDataSourceNameInTimeline(expression, 'aos211')).toBe(expectedExpression);
  });

  test('When a timeline expression contains multiple timeline expression and the datasource name contains space, we modify each of them', () => {
    const expression =
      '.es(opensearch_dashboards_sample_data_logs, metric=avg:bytes, timefield=@timestamp).lines(show=true).points(show=true).yaxis(label="Average bytes"),.elasticsearch(opensearch_dashboards_sample_data_logs, metric=avg:bytes, timefield=@timestamp).lines(show=true).points(show=true).yaxis(label="Average bytes")';
    const expectedExpression =
      '.es(opensearch_dashboards_sample_data_logs, metric=avg:bytes, timefield=@timestamp, data_source_name="aos 211").lines(show=true).points(show=true).yaxis(label="Average bytes"),.elasticsearch(opensearch_dashboards_sample_data_logs, metric=avg:bytes, timefield=@timestamp, data_source_name="aos 211").lines(show=true).points(show=true).yaxis(label="Average bytes")';
    expect(updateDataSourceNameInTimeline(expression, 'aos 211')).toBe(expectedExpression);
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

describe('getUpdatedTSVBVisState', () => {
  const getTSVBSavedObject = (dataSourceId?: string) => {
    const params = dataSourceId ? { data_source_id: dataSourceId } : {};
    const references = dataSourceId
      ? [{ id: dataSourceId, type: 'data-source', name: 'dataSource' }]
      : [];

    return {
      type: 'visualization',
      id: 'some-id',
      attributes: {
        title: 'Some Title',
        visState: JSON.stringify({
          type: 'metrics',
          params,
        }),
      },
      references,
    };
  };

  test('non-TSVB object should return the old references and visState', () => {
    const visState = {
      type: 'area',
      params: {},
    };

    const object = {
      type: 'visualization',
      id: 'some-id',
      attributes: {
        title: 'Some title',
        visState: JSON.stringify(visState),
      },
      references: [],
    };

    expect(getUpdatedTSVBVisState(object, 'some-datasource-id')).toMatchObject({
      visState: JSON.stringify(visState),
      references: [],
    });
  });

  test.each(['old-datasource-id', undefined])(
    `non-MDS TSVB object should update the datasource when the old datasource is "%s"`,
    (oldDataSourceId) => {
      const object = getTSVBSavedObject(oldDataSourceId);
      const dataSourceId = 'some-datasource-id';
      const expectedVisState = JSON.stringify({
        type: 'metrics',
        params: {
          data_source_id: dataSourceId,
        },
      });

      expect(getUpdatedTSVBVisState(object, dataSourceId)).toMatchObject({
        visState: expectedVisState,
        references: [{ id: dataSourceId, name: 'dataSource', type: 'data-source' }],
      });
    }
  );
});

describe('findReferenceDataSourceForObject', () => {
  const savedObjects: Array<SavedObject<{ title?: string }>> = [
    {
      id: '1',
      references: [{ id: '5', type: 'data-source', name: '5' }],
      type: 'index-pattern',
      attributes: {},
    },
    {
      id: '2',
      references: [{ id: '3', type: 'non-data-source', name: '3' }],
      type: 'index-pattern',
      attributes: {},
    },
    {
      id: '3',
      references: [],
      type: 'non-data-source',
      attributes: {},
    },
    {
      id: '4',
      references: [{ id: '1', type: 'index-pattern', name: '1' }],
      type: 'non-data-source',
      attributes: {},
    },
    {
      id: '6',
      references: [{ id: '7', type: 'index-pattern', name: '7' }],
      type: 'non-data-source',
      attributes: {},
    },
    {
      id: '8',
      references: [
        { id: '1', type: 'index-pattern', name: '1' },
        { id: '6', type: 'data-source', name: '6' },
      ],
      type: 'dashboards',
      attributes: {},
    },
  ];

  const ObjectsMap = new Map(savedObjects.map((so) => [so.id, so]));

  test('returns the data-source reference if it exists in the references', () => {
    const result = findReferenceDataSourceForObject(savedObjects[0], ObjectsMap);
    expect(result).toEqual(new Set('5'));
  });

  test('returns empty Set if there is no data-source reference and no nested references', () => {
    expect(findReferenceDataSourceForObject(savedObjects[1], ObjectsMap)).toEqual(new Set());
  });

  test('returns empty Set if no references exist', () => {
    expect(findReferenceDataSourceForObject(savedObjects[2], ObjectsMap)).toEqual(new Set());
  });

  test('returns nested data-source reference if found', () => {
    const result = findReferenceDataSourceForObject(savedObjects[3], ObjectsMap);
    expect(result).toEqual(new Set('5'));
  });

  test('returns empty Set if the nested references have no data-source reference', () => {
    expect(findReferenceDataSourceForObject(savedObjects[4], ObjectsMap)).toEqual(new Set());
  });

  test('returns empty Set if circular reference', () => {
    const circularAssets: Array<SavedObject<{ title?: string }>> = [
      {
        id: '1',
        references: [{ id: '2', type: 'non-data-source', name: '2' }],
        type: 'non-data-source',
        attributes: {},
      },
      {
        id: '2',
        references: [{ id: '3', type: 'non-data-source', name: '3' }],
        type: 'non-data-source',
        attributes: {},
      },
      {
        id: '3',
        references: [{ id: '1', type: 'non-data-source', name: '1' }],
        type: 'non-data-source',
        attributes: {},
      },
    ];
    const circularAssetsMap = new Map(circularAssets.map((so) => [so.id, so]));

    const result = findReferenceDataSourceForObject(circularAssets[0], circularAssetsMap);
    expect(result).toEqual(new Set());
  });

  test('returns empty Set if circular reference is itself', () => {
    const circularAssets: Array<SavedObject<{ title?: string }>> = [
      {
        id: '1',
        references: [{ id: '1', type: 'non-data-source', name: '1' }],
        type: 'non-data-source',
        attributes: {},
      },
    ];
    const circularAssetsMap = new Map(circularAssets.map((so) => [so.id, so]));

    const result = findReferenceDataSourceForObject(circularAssets[0], circularAssetsMap);
    expect(result).toEqual(new Set());
  });

  test('returns multiple data sources if they exist in the references', () => {
    const result = findReferenceDataSourceForObject(savedObjects[5], ObjectsMap);
    expect(result).toEqual(new Set(['5', '6']));
  });
});
