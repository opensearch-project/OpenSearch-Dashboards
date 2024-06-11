/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export enum VisLayerTypes {
  PointInTimeEvents = 'PointInTimeEvents',
}

export enum VisLayerErrorTypes {
  PERMISSIONS_FAILURE = 'PERMISSIONS_FAILURE',
  FETCH_FAILURE = 'FETCH_FAILURE',
  RESOURCE_DELETED = 'RESOURCE_DELETED',
}

export enum VisFlyoutContext {
  BASE_VIS = 'BASE_VIS',
  EVENT_VIS = 'EVENT_VIS',
  TIMELINE_VIS = 'TIMELINE_VIS',
}

export interface VisLayerError {
  type: keyof typeof VisLayerErrorTypes;
  message: string;
}

export type PluginResourceType = string;

export interface PluginResource {
  type: PluginResourceType;
  // Should match what is persisted in the plugin
  id: string;
  // Should match what is persisted in the plugin
  name: string;
  // Should be the full path to the resource details page
  // in the respective plugin. Will be used in the hyperlinked
  // name of the resource when viewed in the View Events flyout
  urlPath: string;
}

export interface VisLayer {
  type: keyof typeof VisLayerTypes;
  // A unique name for the plugin. Is used to partition data
  // on the View Events flyout by plugin.
  originPlugin: string;
  // The specific plugin resource - e.g., an anomaly detector
  pluginResource: PluginResource;
  error?: VisLayerError;
}

export type VisLayers = VisLayer[];

export interface EventMetadata {
  pluginResourceId: string;
}

export interface PointInTimeEvent {
  timestamp: number;
  metadata: EventMetadata;
}

export interface PointInTimeEventsVisLayer extends VisLayer {
  events: PointInTimeEvent[];
  // Should be the plugin-specific event name, such as 'Anomalies'.
  // Will be visible in the tooltips when hovering over an event
  // in a visualization.
  pluginEventType: string;
}

export const isPointInTimeEventsVisLayer = (obj: any) => {
  return obj?.type === VisLayerTypes.PointInTimeEvents;
};

/**
 * Used to determine if a given saved obj has a valid type and can
 * be converted into a VisLayer
 */
export const isValidVisLayer = (obj: any) => {
  return obj?.type in VisLayerTypes;
};

/**
 * Used for checking if an existing VisLayer has a populated error field or not
 */
export const isVisLayerWithError = (visLayer: VisLayer): boolean => visLayer.error !== undefined;
// We need to have some extra config in order to render the charts correctly in different contexts.
// For example, we use the same base vis and modify it within the view events flyout to hide
// axes, only show events, only show timeline, add custom padding, etc.
// So, we abstract these concepts out and let the underlying implementation make changes as needed
// to support the different contexts.
export interface VisAugmenterEmbeddableConfig {
  visLayerResourceIds?: string[];
  inFlyout?: boolean;
  flyoutContext?: VisFlyoutContext;
  leftValueAxisPadding?: boolean;
  rightValueAxisPadding?: boolean;
}
