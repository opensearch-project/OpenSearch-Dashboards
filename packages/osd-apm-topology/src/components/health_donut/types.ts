/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PropsWithChildren } from 'react';
import type { Metrics, SloHealth } from '../../shared/types/common.types';

export interface MetricPercentages {
  faults5xxPercent: number;
  errors4xxPercent: number;
  ok2xxPercent: number;
}

export interface HealthDonutProps extends PropsWithChildren {
  metrics: Metrics;
  health?: SloHealth;
  icon?: React.ReactNode;
  size: number;
  status?: string;
  isLegendEnabled?: boolean;
}
