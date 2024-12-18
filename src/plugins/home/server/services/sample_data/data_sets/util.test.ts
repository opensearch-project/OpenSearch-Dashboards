/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObject, updateDataSourceNameInVegaSpec } from '../../../../../../core/server';
import visualizationObjects from './test_utils/visualization_objects.json';
import {
  getFinalSavedObjects,
  getNestedField,
  getSavedObjectsWithDataSource,
  setNestedField,
} from './util';

describe('getSavedObjectsWithDataSource()', () => {
  const getVisualizationSavedObjects = (): Array<SavedObject<any>> => {
    // @ts-expect-error
    return visualizationObjects.saved_objects;
  };

  const TSVBVisualizationSavedObject = {
    type: 'visualization',
    id: 'some-id',
    attributes: {
      title: 'some-title',
      visState: JSON.stringify({
        type: 'metrics',
        params: {},
      }),
    },
    references: [],
  };

  test('when processing Vega Visualization saved objects, it should attach data_source_name to each OpenSearch query', () => {
    const dataSourceId = 'some-datasource-id';
    const dataSourceName = 'Data Source Name';
    const expectedUpdatedFields = getVisualizationSavedObjects().map((object) => {
      const visState = JSON.parse(object.attributes.visState);
      if (visState.type !== 'vega') {
        return {
          vegaSpec: undefined,
          references: object.references,
        };
      }
      const spec = visState.params.spec;
      return {
        vegaSpec: updateDataSourceNameInVegaSpec({
          newDataSourceName: dataSourceName,
          spec,
          spacing: 1,
        }),
        references: [
          {
            id: dataSourceId,
            type: 'data-source',
            name: 'dataSource',
          },
        ],
      };
    });
    const updatedVegaVisualizationsFields = getSavedObjectsWithDataSource(
      getVisualizationSavedObjects(),
      dataSourceId,
      dataSourceName
    ).map((object) => {
      // @ts-expect-error
      const visState = JSON.parse(object.attributes.visState);
      if (visState.type !== 'vega') {
        return {
          vegaSpec: undefined,
          references: object.references,
        };
      }
      const spec = visState.params.spec;
      return {
        vegaSpec: spec,
        references: object.references,
      };
    });

    expect(updatedVegaVisualizationsFields).toEqual(expect.arrayContaining(expectedUpdatedFields));
  });

  it('should processing timeline saved object and add datasource name in the end', () => {
    const dataSourceId = 'some-datasource-id';
    const dataSourceName = 'dataSourceName';
    const savedObjects = [
      {
        id: 'saved-object-1',
        type: 'visualization',
        title: 'example',
        attributes: {
          title: 'example',
          visState:
            '{"title":"(Timeline) Avg bytes over time","type":"timelion","aggs":[],"params":{"expression":".opensearch(opensearch_dashboards_sample_data_logs, metric=avg:bytes, timefield=@timestamp).lines(show=true).points(show=true).yaxis(label=\\"Average bytes\\")","interval":"auto"}}',
        },
        references: [],
      },
    ];

    expect(getSavedObjectsWithDataSource(savedObjects, dataSourceId, dataSourceName)).toEqual([
      {
        id: 'some-datasource-id_saved-object-1',
        type: 'visualization',
        title: 'example',
        attributes: {
          title: 'example_dataSourceName',
          visState:
            '{"title":"(Timeline) Avg bytes over time","type":"timelion","aggs":[],"params":{"expression":".opensearch(opensearch_dashboards_sample_data_logs, metric=avg:bytes, timefield=@timestamp, data_source_name=\\"dataSourceName\\").lines(show=true).points(show=true).yaxis(label=\\"Average bytes\\")","interval":"auto"}}',
        },
        references: [],
      },
    ]);
  });

  it('should update index-pattern id and references with given data source', () => {
    const dataSourceId = 'some-datasource-id';
    const dataSourceName = 'Data Source Name';

    expect(
      getSavedObjectsWithDataSource(
        [
          {
            id: 'saved-object-1',
            type: 'index-pattern',
            attributes: {},
            references: [],
          },
        ],
        dataSourceId,
        dataSourceName
      )
    ).toEqual([
      {
        id: 'some-datasource-id_saved-object-1',
        type: 'index-pattern',
        attributes: {},
        references: [
          {
            id: `${dataSourceId}`,
            type: 'data-source',
            name: 'dataSource',
          },
        ],
      },
    ]);
  });

  test('when processing TSVB Visualization saved objects, it should attach data_source_id to the visState and add datasource reference', () => {
    const dataSourceId = 'some-datasource-id';
    const dataSourceTitle = 'Data Source Name';
    const expectedTSVBVisualizationSavedObject = {
      ...TSVBVisualizationSavedObject,
      id: `${dataSourceId}_some-id`,
      attributes: {
        title: `some-title_${dataSourceTitle}`,
        visState: JSON.stringify({
          type: 'metrics',
          params: {
            data_source_id: dataSourceId,
          },
        }),
      },
      references: [
        {
          id: dataSourceId,
          type: 'data-source',
          name: 'dataSource',
        },
      ],
    };

    expect(
      getSavedObjectsWithDataSource([TSVBVisualizationSavedObject], dataSourceId, dataSourceTitle)
    ).toMatchObject([expectedTSVBVisualizationSavedObject]);
  });
});

describe('getFinalSavedObjects()', () => {
  const generateTestDataSet = (
    savedObjects: Array<
      SavedObject<{
        title: string;
        kibanaSavedObjectMeta?: {
          searchSourceJSON: Record<string, unknown>;
        };
        visState?: string;
      }>
    > = [
      {
        id: 'saved-object-1',
        type: 'search',
        attributes: { title: 'Saved object 1' },
        references: [],
      },
    ]
  ) => {
    const getSavedObjects = () => JSON.parse(JSON.stringify(savedObjects));
    return {
      id: 'foo',
      name: 'Foo',
      description: 'A test sample data set',
      previewImagePath: '',
      darkPreviewImagePath: '',
      overviewDashboard: '',
      getDataSourceIntegratedDashboard: () => '',
      appLinks: [],
      defaultIndex: '',
      getDataSourceIntegratedDefaultIndex: () => '',
      savedObjects: getSavedObjects(),
      getDataSourceIntegratedSavedObjects: (dataSourceId?: string, dataSourceTitle?: string) =>
        getSavedObjectsWithDataSource(getSavedObjects(), dataSourceId, dataSourceTitle),
      getWorkspaceIntegratedSavedObjects: (workspaceId?: string) =>
        getSavedObjects().map((item) => ({
          ...item,
          ...(workspaceId ? { id: `${workspaceId}_${item.id}` } : {}),
        })),
      dataIndices: [],
    };
  };
  it('should return consistent saved object id and title when workspace id and data source provided', () => {
    expect(
      getFinalSavedObjects({
        dataset: generateTestDataSet(),
        workspaceId: 'workspace-1',
        dataSourceId: 'datasource-1',
        dataSourceTitle: 'data source 1',
      })
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: `workspace-1_datasource-1_saved-object-1`,
          attributes: expect.objectContaining({
            title: 'Saved object 1_data source 1',
          }),
        }),
      ])
    );
  });
  it('should return consistent saved object id when workspace id', () => {
    expect(
      getFinalSavedObjects({
        dataset: generateTestDataSet(),
        workspaceId: 'workspace-1',
      })
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: `workspace-1_saved-object-1`,
        }),
      ])
    );
  });
  it('should return consistent saved object id and title when data source id and title', () => {
    expect(
      getFinalSavedObjects({
        dataset: generateTestDataSet(),
        dataSourceId: 'data-source-1',
        dataSourceTitle: 'data source 1',
      })
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: `data-source-1_saved-object-1`,
          attributes: expect.objectContaining({
            title: 'Saved object 1_data source 1',
          }),
        }),
      ])
    );
  });
  it('should return original saved objects when no workspace and data source provided', () => {
    const dataset = generateTestDataSet();
    expect(
      getFinalSavedObjects({
        dataset,
      })
    ).toEqual(dataset.savedObjects);
  });

  it('should update index in searchSource for visualization and search saved objects', () => {
    const dataset = generateTestDataSet([
      {
        id: 'saved-object-1',
        type: 'visualization',
        attributes: {
          title: 'Saved object 1',
          kibanaSavedObjectMeta: {
            searchSourceJSON: JSON.stringify({
              index: 'index-pattern',
              filter: [{ meta: { index: 'index-pattern' } }],
            }),
          },
          visState: JSON.stringify({}),
        },
        references: [],
      },
      {
        id: 'saved-object-2',
        type: 'search',
        attributes: {
          title: 'Saved object 2',
          kibanaSavedObjectMeta: {
            searchSourceJSON: JSON.stringify({
              index: 'index-pattern',
              filter: [{ meta: { index: 'index-pattern' } }],
            }),
          },
        },
        references: [],
      },
    ]);
    const UPDATED_SEARCH_JSON = JSON.stringify({
      index: 'workspace-1_datasource-1_index-pattern',
      filter: [{ meta: { index: 'workspace-1_datasource-1_index-pattern' } }],
    });
    expect(
      getFinalSavedObjects({
        dataset,
        workspaceId: 'workspace-1',
        dataSourceId: 'datasource-1',
        dataSourceTitle: 'data source 1',
      })
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'workspace-1_datasource-1_saved-object-1',
          type: 'visualization',
          attributes: expect.objectContaining({
            kibanaSavedObjectMeta: expect.objectContaining({
              searchSourceJSON: UPDATED_SEARCH_JSON,
            }),
          }),
        }),
        expect.objectContaining({
          id: 'workspace-1_datasource-1_saved-object-2',
          type: 'search',
          attributes: expect.objectContaining({
            kibanaSavedObjectMeta: expect.objectContaining({
              searchSourceJSON: UPDATED_SEARCH_JSON,
            }),
          }),
        }),
      ])
    );
  });
});

describe('getNestedField', () => {
  it('should return the value of a top-level field', () => {
    const doc = { field1: 'value1', field2: 'value2' };
    const result = getNestedField(doc, 'field1');
    expect(result).toBe('value1');
  });

  it('should return the value of a nested field', () => {
    const doc = { field1: { nestedField: 'nestedValue' } };
    const result = getNestedField(doc, 'field1.nestedField');
    expect(result).toBe('nestedValue');
  });

  it('should return undefined for a non-existent field', () => {
    const doc = { field1: 'value1' };
    const result = getNestedField(doc, 'nonExistentField');
    expect(result).toBeUndefined();
  });

  it('should handle fields with dots in their names', () => {
    const doc = { 'field.with.dot': 'valueWithDot' };
    const result = getNestedField(doc, 'field.with.dot');
    expect(result).toBe('valueWithDot');
  });

  it('should return undefined for a non-existent nested field', () => {
    const doc = { field1: { nestedField: 'nestedValue' } };
    const result = getNestedField(doc, 'field1.nonExistentField');
    expect(result).toBeUndefined();
  });
});

describe('setNestedField', () => {
  it('should set the value of a top-level field', () => {
    const doc = { field1: 'value1', field2: 'value2' };
    setNestedField(doc, 'field1', 'newValue1');
    expect(doc.field1).toBe('newValue1');
  });

  it('should set the value of a nested field', () => {
    const doc = { field1: { nestedField: 'nestedValue' } };
    setNestedField(doc, 'field1.nestedField', 'newNestedValue');
    expect(doc.field1.nestedField).toBe('newNestedValue');
  });

  it('should create nested fields if they do not exist', () => {
    const doc: any = {}; // Allow dynamic properties
    setNestedField(doc, 'field1.nestedField', 'newNestedValue');
    expect(doc.field1).toEqual({ nestedField: 'newNestedValue' });
  });

  it('should handle fields with dots in their names', () => {
    const doc = { 'field.with.dot': 'valueWithDot' };
    setNestedField(doc, 'field.with.dot', 'newValueWithDot');
    expect(doc['field.with.dot']).toBe('newValueWithDot');
  });

  it('should set a value in deeply nested structures', () => {
    const doc = { level1: { level2: { level3: { level4: 'oldValue' } } } };
    setNestedField(doc, 'level1.level2.level3.level4', 'newValue');
    expect(doc.level1.level2.level3.level4).toBe('newValue');
  });
});
