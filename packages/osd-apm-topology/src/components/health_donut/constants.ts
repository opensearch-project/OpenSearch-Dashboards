/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const HEALTH_DONUT_COLORS = {
  background: 'var(--osd-color-requests)',
  white: 'var(--osd-color-container-default)',
  ok2xx: 'var(--osd-color-ok)',
  okFill: 'var(--osd-color-ok)',
  error4xx: 'var(--osd-color-errors)',
  errorFill: '#8a6b05', // @todo - convert colors to css colors
  fault5xx: 'var(--osd-color-faults)',
  faultFill: 'var(--osd-color-faults)',
} as const;

export enum HEALTH_DONUT_STATUS {
  OK = 'ok',
  FAULT = 'fault',
  ERROR = 'error',
}
