/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getSavedObjectsWithDataSource, getFinalSavedObjects } from './util';
import { SavedObject, updateDataSourceNameInVegaSpec } from '../../../../../../core/server';
import visualizationObjects from './test_utils/visualization_objects.json';

describe('getSavedObjectsWithDataSource()', () => {
  const getVisualizationSavedObjects = (): Array<SavedObject<any>> => {
    // @ts-expect-error
    return visualizationObjects.saved_objects;
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
});

describe('getFinalSavedObjects()', () => {
  const savedObjects = [
    { id: 'saved-object-1', type: 'test', attributes: { title: 'Saved object 1' }, references: [] },
  ];
  const generateTestDataSet = () => {
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
      savedObjects,
      getDataSourceIntegratedSavedObjects: (dataSourceId?: string, dataSourceTitle?: string) =>
        savedObjects.map((item) => ({
          ...item,
          ...(dataSourceId ? { id: `${dataSourceId}_${item.id}` } : {}),
          attributes: {
            ...item.attributes,
            title: dataSourceTitle
              ? `${item.attributes.title}_${dataSourceTitle}`
              : item.attributes.title,
          },
        })),
      getWorkspaceIntegratedSavedObjects: (workspaceId?: string) =>
        savedObjects.map((item) => ({
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
    ).toBe(dataset.savedObjects);
  });
});
