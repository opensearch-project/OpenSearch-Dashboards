/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export type SliStatus = 'breached' | 'recovered' | string;

export interface Metrics {
  requests: number;
  faults5xx: number;
  errors4xx: number;

  // @deprecated - celestial is not using throttles
  throttled?: number;

  // @deprecated - use faults 5xx instead
  errors5xx?: number;
  // @deprecated - use requests instead
  totalRequests?: number;
}

export interface SloHealth {
  status: SliStatus;
  breached: number;
  recovered: number;
  total: number;
}

export interface ChangeEvents {
  latestDeployment?: number;
  eventId?: string;
  username?: string;
}
