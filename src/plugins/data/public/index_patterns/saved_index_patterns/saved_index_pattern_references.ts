/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectAttributes, SavedObjectReference } from 'opensearch-dashboards/public';
import { IndexPatternSavedObject } from '../types';

export function extractReferences({
  attributes,
  references = [],
}: {
  attributes: SavedObjectAttributes;
  references: SavedObjectReference[];
}) {
  const dataSourceRefs: SavedObjectReference[] = [];

  if (!attributes.dataSourcesJSON) {
    return {
      references: [...references],
      attributes: {
        ...attributes,
      },
    };
  }
  const dataSources: Array<Record<string, string>> = JSON.parse(String(attributes.dataSourcesJSON));
  dataSources.forEach((dataSource, i) => {
    if (!dataSource.type) {
      throw new Error(`"type" attribute is missing from panel "${i}"`);
    }
    if (!dataSource.id) {
      // Embeddables are not required to be backed off a saved object.
      return;
    }

    dataSource.dataSourceRefName = `dataSource_${i}`;
    dataSourceRefs.push({
      name: `dataSource_${i}`,
      type: dataSource.type,
      id: dataSource.id,
    });
    delete dataSource.type;
    delete dataSource.id;
  });

  return {
    references: [...references, ...dataSourceRefs],
    attributes: {
      ...attributes,
      dataSourcesJSON: JSON.stringify(dataSources),
    },
  };
}

// inject id and type back to object for development useage
export function injectReferences(
  savedObject: IndexPatternSavedObject,
  references: SavedObjectReference[]
) {
  if (typeof savedObject.dataSourcesJSON !== 'string') {
    return;
  }

  const dataSources = JSON.parse(savedObject.dataSourcesJSON);

  if (!Array.isArray(dataSources)) {
    return;
  }

  dataSources.forEach((dataSource) => {
    if (!dataSource.dataSourceRefName) {
      return;
    }

    const reference = references.find((ref) => ref.name === dataSource.dataSourceRefName);
    if (!reference) {
      // Throw an error since "dataSourceRefName" means the reference exists within
      // "references" and in this scenario we have bad data.
      throw new Error(`Could not find reference "${dataSource.dataSourceRefName}"`);
    }

    dataSource.id = reference.id;
    dataSource.type = reference.type;
    delete dataSource.dataSourceRefName;
  });

  savedObject.dataSourcesJSON = JSON.stringify(dataSources);
}
