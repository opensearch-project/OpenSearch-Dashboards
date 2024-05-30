/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isEmpty } from 'lodash';
import { IUiSettingsClient, SavedObjectsClientContract } from 'src/core/public';
import { indexPatterns, IndexPatternAttributes } from '../..';

export async function fetchIndexPatterns(
  savedObjectsClient: SavedObjectsClientContract,
  indexPatternStrings: string[],
  uiSettings: IUiSettingsClient
) {
  if (!indexPatternStrings || isEmpty(indexPatternStrings)) {
    return [];
  }

  const searchString = indexPatternStrings.map((string) => `"${string}"`).join(' | ');
  const indexPatternsFromSavedObjects = await savedObjectsClient.find<IndexPatternAttributes>({
    type: 'index-pattern',
    fields: ['title', 'fields'],
    search: searchString,
    searchFields: ['title'],
  });

  const exactMatches = indexPatternsFromSavedObjects.savedObjects.filter((savedObject) => {
    return indexPatternStrings.includes(savedObject.attributes.title);
  });

  const defaultIndex = uiSettings.get('defaultIndex');

  const allMatches =
    exactMatches.length === indexPatternStrings.length
      ? exactMatches
      : [
          ...exactMatches,
          await savedObjectsClient.get<IndexPatternAttributes>('index-pattern', defaultIndex),
        ];

  return allMatches.map(indexPatterns.getFromSavedObject);
}
