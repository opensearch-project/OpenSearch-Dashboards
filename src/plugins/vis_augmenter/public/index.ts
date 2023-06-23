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
  VisAugmenterEmbeddableConfig,
  VisFlyoutContext,
} from './types';

export { AugmentVisContext } from './ui_actions_bootstrap';

export * from './expressions';
export * from './utils';
export * from './constants';
export * from './vega';
export * from './saved_augment_vis';
export * from './test_constants';
export * from './triggers';
export * from './actions';
export { fetchVisEmbeddable } from './view_events_flyout';
export { setUISettings } from './services'; // Needed for plugin tests related to the CRUD saved object functions
