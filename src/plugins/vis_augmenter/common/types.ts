/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExpressionFunctionDefinition } from '../../expressions';

export interface VisLayer {
  // will be used as the column ID
  id: string;
  // will be used as the name when hovering over the tooltip
  name: string;
}

export type VisLayers = VisLayer[];

export interface PointInTimeEventMetadata {
  resourceId: string;
  resourceName: string;
  tooltip?: string;
}

export interface PointInTimeEvent {
  timestamp: number;
  metadata: PointInTimeEventMetadata;
}

export interface PointInTimeEventsVisLayer extends VisLayer {
  events: PointInTimeEvent[];
}

// used to determine what vis layer's interface is being implemented.
// currently PointInTimeEventsLayer is the only interface extending VisLayer
export const isPointInTimeEventsVisLayer = (obj: any) => {
  return 'events' in obj;
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
