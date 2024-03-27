/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObject } from 'opensearch-dashboards/server';
import {
  extractVegaSpecFromSavedObject,
  updateDataSourceNameInVegaSpec,
} from '../../../../../../core/server';

export const appendDataSourceId = (id: string) => {
  return (dataSourceId?: string) => (dataSourceId ? `${dataSourceId}_` + id : id);
};

export const getSavedObjectsWithDataSource = (
  saveObjectList: SavedObject[],
  dataSourceId?: string,
  dataSourceTitle?: string
): SavedObject[] => {
  if (dataSourceId) {
    return saveObjectList.map((saveObject) => {
      saveObject.id = `${dataSourceId}_` + saveObject.id;
      // update reference
      if (saveObject.type === 'dashboard') {
        saveObject.references.map((reference) => {
          if (reference.id) {
            reference.id = `${dataSourceId}_` + reference.id;
          }
        });
      }

      // update reference
      if (saveObject.type === 'visualization' || saveObject.type === 'search') {
        const searchSourceString = saveObject.attributes?.kibanaSavedObjectMeta?.searchSourceJSON;
        const visStateString = saveObject.attributes?.visState;

        if (searchSourceString) {
          const searchSource = JSON.parse(searchSourceString);
          if (searchSource.index) {
            searchSource.index = `${dataSourceId}_` + searchSource.index;
            saveObject.attributes.kibanaSavedObjectMeta.searchSourceJSON = JSON.stringify(
              searchSource
            );
          }
        }

        if (visStateString) {
          const visState = JSON.parse(visStateString);
          const controlList = visState.params?.controls;
          if (controlList) {
            controlList.map((control) => {
              if (control.indexPattern) {
                control.indexPattern = `${dataSourceId}_` + control.indexPattern;
              }
            });
          }
          saveObject.attributes.visState = JSON.stringify(visState);
        }
      }

      // update reference
      if (saveObject.type === 'index-pattern') {
        saveObject.references = [
          {
            id: `${dataSourceId}`,
            type: 'data-source',
            name: 'dataSource',
          },
        ];
      }

      if (dataSourceTitle) {
        if (
          saveObject.type === 'dashboard' ||
          saveObject.type === 'visualization' ||
          saveObject.type === 'search'
        ) {
          saveObject.attributes.title = saveObject.attributes.title + `_${dataSourceTitle}`;
        }

        if (saveObject.type === 'visualization') {
          const vegaSpec = extractVegaSpecFromSavedObject(saveObject);

          if (!!vegaSpec) {
            const updatedVegaSpec = updateDataSourceNameInVegaSpec({
              spec: vegaSpec,
              newDataSourceName: dataSourceTitle,
              // Spacing of 1 prevents the Sankey visualization in logs data from exceeding the default url length and breaking
              spacing: 1,
            });

            // @ts-expect-error
            const visStateObject = JSON.parse(saveObject.attributes?.visState);
            visStateObject.params.spec = updatedVegaSpec;

            // @ts-expect-error
            saveObject.attributes.visState = JSON.stringify(visStateObject);
            saveObject.references.push({
              id: `${dataSourceId}`,
              type: 'data-source',
              name: 'dataSource',
            });
          }
        }
      }

      return saveObject;
    });
  }

  return saveObjectList;
};
