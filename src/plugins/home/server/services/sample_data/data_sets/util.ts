/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObject } from 'opensearch-dashboards/server';
import {
  extractVegaSpecFromSavedObject,
  updateDataSourceNameInVegaSpec,
} from '../../../../../../core/server';
import { SampleDatasetSchema } from '../lib/sample_dataset_registry_types';

export const appendDataSourceId = (id: string) => {
  return (dataSourceId?: string, workspaceId?: string) => {
    const idWithDataSource = dataSourceId ? `${dataSourceId}_` + id : id;
    if (!workspaceId) {
      return idWithDataSource;
    }
    return `${workspaceId}_${idWithDataSource}`;
  };
};

const overrideSavedObjectId = (savedObject: SavedObject, idGenerator: (id: string) => string) => {
  savedObject.id = idGenerator(savedObject.id);
  // update reference
  if (savedObject.type === 'dashboard') {
    savedObject.references.map((reference) => {
      if (reference.id) {
        reference.id = idGenerator(reference.id);
      }
    });
  }

  // update reference
  if (savedObject.type === 'visualization' || savedObject.type === 'search') {
    const searchSourceString = savedObject.attributes?.kibanaSavedObjectMeta?.searchSourceJSON;
    const visStateString = savedObject.attributes?.visState;

    if (searchSourceString) {
      const searchSource = JSON.parse(searchSourceString);
      if (searchSource.index) {
        searchSource.index = idGenerator(searchSource.index);
        savedObject.attributes.kibanaSavedObjectMeta.searchSourceJSON = JSON.stringify(
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
            control.indexPattern = idGenerator(control.indexPattern);
          }
        });
      }
      savedObject.attributes.visState = JSON.stringify(visState);
    }
  }
};

export const getSavedObjectsWithDataSource = (
  saveObjectList: SavedObject[],
  dataSourceId?: string,
  dataSourceTitle?: string
): SavedObject[] => {
  if (dataSourceId) {
    const idGenerator = (id: string) => `${dataSourceId}_${id}`;
    return saveObjectList.map((saveObject) => {
      overrideSavedObjectId(saveObject, idGenerator);

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

export const overwriteSavedObjectsWithWorkspaceId = (
  savedObjectList: SavedObject[],
  workspaceId: string
) => {
  const idGenerator = (id: string) => `${workspaceId}_${id}`;
  savedObjectList.forEach((savedObject) => {
    overrideSavedObjectId(savedObject, idGenerator);
  });
  return savedObjectList;
};

export const getFinalSavedObjects = ({
  dataset,
  workspaceId,
  dataSourceId,
  dataSourceTitle,
}: {
  dataset: SampleDatasetSchema;
  workspaceId?: string;
  dataSourceId?: string;
  dataSourceTitle?: string;
}) => {
  if (workspaceId && dataSourceId) {
    return overwriteSavedObjectsWithWorkspaceId(
      dataset.getDataSourceIntegratedSavedObjects(dataSourceId, dataSourceTitle),
      workspaceId
    );
  }
  if (workspaceId) {
    return dataset.getWorkspaceIntegratedSavedObjects(workspaceId);
  }
  if (dataSourceId) {
    return dataset.getDataSourceIntegratedSavedObjects(dataSourceId, dataSourceTitle);
  }

  return dataset.savedObjects;
};
