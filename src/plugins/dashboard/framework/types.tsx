/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export enum DirectQueryLoadingStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  RUNNING = 'running',
  SUBMITTED = 'submitted',
  SCHEDULED = 'scheduled',
  CANCELLED = 'cancelled',
  WAITING = 'waiting',
  INITIAL = 'initial',
  FRESH = 'fresh',
}

export interface DirectQueryRequest {
  query: string;
  lang: string;
  datasource: string;
  sessionId?: string;
}
