/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObject } from 'opensearch-dashboards/server';

export const getSavedObjectsWithDataSource = (
  saveObjectList: SavedObject[],
  dataSourceId?: string
): SavedObject[] => {
  if (dataSourceId) {
    return saveObjectList.map((saveObject) => ({
      ...saveObject,
      id: `${dataSourceId}_` + saveObject.id,
    }));
  }

  return saveObjectList;
};
