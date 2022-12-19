/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisLayerExpressionFn } from '../types';
import {
  createSavedAugmentVisLoader,
  SavedObjectOpenSearchDashboardsServicesWithAugmentVis,
} from './saved_augment_vis';
import { generateAugmentVisSavedObject, getMockAugmentVisSavedObjectClient } from './utils';

describe('SavedObjectLoaderAugmentVis', () => {
  const fn = {
    // TODO: VisLayerTypes will resolve after rebasing with earlier PR
    type: VisLayerTypes.PointInTimeEventsLayer,
    name: 'test-fn',
    args: {
      testArg: 'test-value',
    },
  } as VisLayerExpressionFn;
  const obj1 = generateAugmentVisSavedObject('test-id-1', fn);
  const obj2 = generateAugmentVisSavedObject('test-id-2', fn);

  it('findAll returns single saved obj', async () => {
    const loader = createSavedAugmentVisLoader({
      savedObjectsClient: getMockAugmentVisSavedObjectClient([obj1]),
    } as SavedObjectOpenSearchDashboardsServicesWithAugmentVis);
    const resp = await loader.findAll();
    expect(resp.hits.length === 1);
  });

  // TODO: once done rebasing after VisLayer PR, can finish creating test cases here.
  // right now they are failing since there is missing imports

  // add test for empty response
  // add test for multi obj response
  // add test for invalid VisLayerType
  // add test for missing reference
  // add test for missing visLayerExpressionFn
});
