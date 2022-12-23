/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObject } from '../../saved_objects/public';
import { ExpressionFunctionDefinition } from '../../expressions';

export enum VisLayerTypes {
  PointInTimeEvents = 'PointInTimeEvents',
}

export type PluginResourceType = string;

export interface PluginResource {
  type: PluginResourceType;
  id: string;
  name: string;
  urlPath: string;
}

export interface VisLayer {
  type: keyof typeof VisLayerTypes;
  originPlugin: string;
  pluginResource: PluginResource;
}

export type VisLayers = VisLayer[];

export interface EventMetadata {
  pluginResourceId: string;
  tooltip?: string;
}

export interface PointInTimeEvent {
  timestamp: number;
  metadata: EventMetadata;
}

export interface PointInTimeEventsVisLayer extends VisLayer {
  events: PointInTimeEvent[];
}

export const isPointInTimeEventsVisLayer = (obj: any) => {
  return obj?.type === VisLayerTypes.PointInTimeEvents;
};

export const isValidVisLayer = (obj: any) => {
  return obj?.type in VisLayerTypes;
};

export interface ISavedAugmentVis {
  id?: string;
  title: string;
  description?: string;
  pluginResourceId: string;
  visName?: string;
  visId?: string;
  visLayerExpressionFn: VisLayerExpressionFn;
  version?: number;
}

export interface VisLayerExpressionFn {
  type: keyof typeof VisLayerTypes;
  name: string;
  // plugin expression fns can freely set custom arguments
  args: { [key: string]: any };
}

export interface AugmentVisSavedObject extends SavedObject, ISavedAugmentVis {}

export interface VisLayerResponseValue {
  visLayers: object;
}

export type VisLayerFunctionDefinition = ExpressionFunctionDefinition<
  string,
  VisLayerResponseValue,
  any,
  Promise<VisLayerResponseValue>
>;
