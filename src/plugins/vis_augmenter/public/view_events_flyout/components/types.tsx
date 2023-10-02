/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisLayer } from '../../types';
import { VisualizeEmbeddable } from '../../../../visualizations/public';

export interface EventVisEmbeddableItem {
  visLayer: VisLayer;
  embeddable: VisualizeEmbeddable;
}

export type EventVisEmbeddablesMap = Map<string, EventVisEmbeddableItem[]>;
