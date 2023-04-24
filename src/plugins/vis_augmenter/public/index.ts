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
  VisLayer,
  VisLayers,
  VisLayerTypes,
  VisLayerErrorTypes,
  VisLayerError,
  PluginResource,
  PointInTimeEvent,
  PointInTimeEventsVisLayer,
  isPointInTimeEventsVisLayer,
  isVisLayerWithError,
} from './types';

export * from './expressions';
export * from './utils';
export * from './constants';
export * from './vega';
export * from './saved_augment_vis';
