/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExpressionFunctionDefinition } from '../../expressions';

export enum VisLayerTypes {
  PointInTimeEvents = 'PointInTimeEvents',
}

export interface VisLayer {
  type: keyof typeof VisLayerTypes;
  name: string;
}

export type VisLayers = VisLayer[];

// resourceId & resourceName are required so that the
// events flyout can partition data based on these attributes
// (e.g., partitioning anomalies based on the detector they came from)
export interface EventMetadata {
  resourceId: string;
  resourceName: string;
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

export interface VisLayerResponseValue {
  visLayers: object;
}

export type VisLayerFunctionDefinition = ExpressionFunctionDefinition<
  string,
  VisLayerResponseValue,
  any,
  Promise<VisLayerResponseValue>
>;
