/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectAttributes, SavedObjectReference } from 'opensearch-dashboards/public';
import { DataSourceSavedObject } from '../types';

export function extractReferences({
  attributes,
  references = [],
}: {
  attributes: SavedObjectAttributes;
  references: SavedObjectReference[];
}) {
  const credientialRefs: SavedObjectReference[] = [];
  const credientials: Array<Record<string, string>> = JSON.parse(
    String(attributes.credientialsJSON)
  );
  credientials.forEach((crediential, i) => {
    if (!crediential.type) {
      throw new Error(`"type" attribute is missing from panel "${i}"`);
    }
    if (!crediential.id) {
      // Embeddables are not required to be backed off a saved object.
      return;
    }

    crediential.credientialRefName = `crediential_${i}`;
    credientialRefs.push({
      name: `crediential_${i}`,
      type: crediential.type,
      id: crediential.id,
    });
    delete crediential.type;
    delete crediential.id;
  });

  return {
    references: [...references, ...credientialRefs],
    attributes: {
      ...attributes,
      credientialsJSON: JSON.stringify(credientials),
    },
  };
}

export function injectReferences(
  savedObject: DataSourceSavedObject,
  references: SavedObjectReference[]
) {
  if (typeof savedObject.credientialsJSON !== 'string') {
    return;
  }

  const credientials = JSON.parse(savedObject.credientialsJSON);

  if (!Array.isArray(credientials)) {
    return;
  }

  credientials.forEach((crediential) => {
    if (!crediential.credientialRefName) {
      return;
    }

    const reference = references.find((ref) => ref.name === crediential.credientialRefName);
    if (!reference) {
      // Throw an error since "credientialRefName" means the reference exists within
      // "references" and in this scenario we have bad data.
      throw new Error(`Could not find reference "${crediential.credientialRefName}"`);
    }

    crediential.id = reference.id;
    crediential.type = reference.type;
    delete crediential.credientialRefName;
  });

  savedObject.credientialsJSON = JSON.stringify(credientials);
}
