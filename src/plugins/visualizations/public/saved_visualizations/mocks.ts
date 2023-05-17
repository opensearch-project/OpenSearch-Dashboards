/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ISavedAugmentVis,
  getMockAugmentVisSavedObjectClient,
  createSavedAugmentVisLoader,
  SavedObjectOpenSearchDashboardsServicesWithAugmentVis,
} from '../../../vis_augmenter/public';
import {
  SavedObjectOpenSearchDashboardsServicesWithVisualizations,
  createSavedVisLoader,
} from './saved_visualizations';

export const getMockSavedVisLoader = (
  mockAugmentVisDeleteFn: jest.Mock<any, any>,
  mockVisDeleteFn: jest.Mock<any, any>,
  augmentVisSavedObjs: ISavedAugmentVis[]
): any => {
  const augmentVisLoader = createSavedAugmentVisLoader({
    savedObjectsClient: {
      ...getMockAugmentVisSavedObjectClient(augmentVisSavedObjs),
      delete: mockAugmentVisDeleteFn,
    },
  } as SavedObjectOpenSearchDashboardsServicesWithAugmentVis);

  const savedVisLoader = createSavedVisLoader({
    savedObjectsClient: {
      delete: mockVisDeleteFn,
    } as any,
    savedAugmentVisLoader: augmentVisLoader,
  } as SavedObjectOpenSearchDashboardsServicesWithVisualizations);
  return savedVisLoader;
};
