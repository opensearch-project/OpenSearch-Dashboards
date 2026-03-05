/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Metrics, SloHealth } from '../../../../shared/types/common.types';

export type TrianglePosition = 'left' | 'right';

export interface LegendProps {
  metrics: Metrics;
  health?: SloHealth;
  trianglePosition?: TrianglePosition;
}
