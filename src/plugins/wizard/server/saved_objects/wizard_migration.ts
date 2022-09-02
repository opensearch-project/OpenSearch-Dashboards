/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { get, flow } from 'lodash';
import { SavedObjectMigrationFn } from '../../../../core/server';

const migrateIndexPattern: SavedObjectMigrationFn<any, any> = (doc) => {
  try {
    const visualizationStateJSON = get(doc, 'attributes.visualizationState');
    const visualizationState = JSON.parse(visualizationStateJSON);
    const indexPatternId = visualizationState.indexPattern;
    const indexRefName = 'kibanaSavedObjectMeta.searchSourceJSON.index';

    if (indexPatternId && Array.isArray(doc.references)) {
      const searchSourceIndex = {
        indexRefName,
      };
      const visualizationWithoutIndex = {
        searchFields: visualizationState.searchFields,
        activeVisualization: visualizationState.activeVisualization,
      };
      doc.attributes.visualizationState = JSON.stringify(visualizationWithoutIndex);

      doc.references.push({
        name: indexRefName,
        type: 'index-pattern',
        id: indexPatternId,
      });
      doc.attributes.version = 2;

      return {
        ...doc,
        attributes: {
          ...doc.attributes,
          kibanaSavedObjectMeta: {
            searchSourceJSON: JSON.stringify(searchSourceIndex),
          },
        },
      };
    }
    return doc;
  } catch (e) {
    return doc;
  }
};

export const wizardSavedObjectTypeMigrations = {
  '2.3.0': flow(migrateIndexPattern),
};
