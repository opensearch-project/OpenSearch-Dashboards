/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ChromeStart,
  SavedObjectsClientContract,
  OverlayStart,
} from 'opensearch-dashboards/public';
import { DataPublicPluginStart } from '../..';
import { SavedObjectLoader } from '../../../../saved_objects/public';
import { IndexPatternsContract } from '../../../common/index_patterns/index_patterns';
import { createSavedIndexPatternClass } from './_saved_index_pattern';

// todo: why not share with other type def SavedObjectOpenSearchDashboardsServices
interface Services {
  savedObjectsClient: SavedObjectsClientContract;
  // indexPatterns: IndexPatternsContract;
  // search: DataPublicPluginStart['search'];
  chrome: ChromeStart;
  overlays: OverlayStart;
}

export function createSavedIndexPatternLoader(services: Services) {
  const SavedIndexPattern = createSavedIndexPatternClass(services);

  return new SavedObjectLoader(SavedIndexPattern, services.savedObjectsClient);
}
