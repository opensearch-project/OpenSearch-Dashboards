/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchHitRecord, OpenSearchHitRecordList } from '../api/context';

export interface ContextQueryState {
  anchor: OpenSearchHitRecord;
  anchorStatus: ContextQueryStatus;
  predecessors: OpenSearchHitRecordList;
  predecessorsStatus: ContextQueryStatus;
  successors: OpenSearchHitRecordList;
  successorsStatus: ContextQueryStatus;
}

export interface ContextQueryStatus {
  value: LOADING_STATUS;
  reason?: FAILURE_REASONS;
}

export enum LOADING_STATUS {
  LOADING = 'loading',
  LOADED = 'loaded',
  FAILED = 'failed',
  UNINITIALIZED = 'uninitialized',
}

export enum FAILURE_REASONS {
  UNKNOWN = 'unknown',
  INVALID_TIEBREAKER = 'invalid_tiebreaker',
}
