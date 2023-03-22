/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginInitializerContext } from 'src/core/public';
import { VisAugmenterPlugin, VisAugmenterSetup, VisAugmenterStart } from './plugin';

export function plugin(initializerContext: PluginInitializerContext) {
  return new VisAugmenterPlugin(initializerContext);
}
export { VisAugmenterSetup, VisAugmenterStart };

export {
  createSavedAugmentVisLoader,
  createAugmentVisSavedObject,
  SavedAugmentVisLoader,
  SavedObjectOpenSearchDashboardsServicesWithAugmentVis,
} from './saved_augment_vis';

export {
  VisLayer,
  VisLayers,
  VisLayerTypes,
  VisLayerErrorTypes,
  VisLayerError,
  PluginResource,
  PointInTimeEvent,
  PointInTimeEventsVisLayer,
  isPointInTimeEventsVisLayer,
} from './types';

export { generateVisLayer } from './test_helpers';

export * from './expressions';
export * from './utils';
export * from './constants';
export * from './vega';
export * from './saved_augment_vis';
