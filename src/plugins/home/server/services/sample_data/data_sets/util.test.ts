/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getSavedObjectsWithDataSource } from './util';
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
});
