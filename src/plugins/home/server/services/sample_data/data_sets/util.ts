/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObject } from 'opensearch-dashboards/server';
import { cloneDeep } from 'lodash';

const withPrefix = (...args: Array<string | undefined>) => (id: string) => {
  const prefix = args.filter(Boolean).join('_');
  if (prefix) {
    return `${prefix}_${id}`;
  }
  return id;
};

export const addPrefixTo = (id: string) => (...args: Array<string | undefined>) => {
  return withPrefix(...args)(id);
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

export const getDataSourceIntegratedSavedObjects = (
  savedObjectList: SavedObject[],
  dataSourceId?: string,
  dataSourceTitle?: string
): SavedObject[] => {
  savedObjectList = cloneDeep(savedObjectList);
  if (dataSourceId) {
    return savedObjectList.map((savedObject) => {
      overrideSavedObjectId(savedObject, withPrefix(dataSourceId));

      // update reference
      if (savedObject.type === 'index-pattern') {
        savedObject.references = [
          {
            id: `${dataSourceId}`,
            type: 'data-source',
            name: 'dataSource',
          },
        ];
      }

      if (dataSourceTitle) {
        if (
          savedObject.type === 'dashboard' ||
          savedObject.type === 'visualization' ||
          savedObject.type === 'search'
        ) {
          savedObject.attributes.title = savedObject.attributes.title + `_${dataSourceTitle}`;
        }
      }

      return savedObject;
    });
  }

  return savedObjectList;
};

export const getWorkspaceIntegratedSavedObjects = (
  savedObjectList: SavedObject[],
  workspaceId?: string
) => {
  savedObjectList = cloneDeep(savedObjectList);

  savedObjectList.forEach((savedObject) => {
    overrideSavedObjectId(savedObject, withPrefix(workspaceId));
  });
  return savedObjectList;
};
