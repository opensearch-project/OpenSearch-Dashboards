/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreSetup } from 'opensearch-dashboards/public';
import { Observable } from 'rxjs';
import { ASYNC_TRIGGER_ID } from './constants';

export interface FetchDataFrameContext {
  http: CoreSetup['http'];
  path: string;
  signal?: AbortSignal;
}

export type FetchFunction<T, P = void> = (params?: P) => Observable<T>;

/**
 * Job states are defined to mostly be compatible with EMR job run states, but aren't strictly
 * limited to that use. "PENDING" has been replaced with "WAITING", since the underlying async API
 * seems to use this state instead. See also: {@link parseJobState}.
 */
export enum JobState {
  SUBMITTED = 'SUBMITTED',
  WAITING = 'WAITING',
  SCHEDULED = 'SCHEDULED',
  RUNNING = 'RUNNING',
  FAILED = 'FAILED',
  SUCCESS = 'SUCCESS',
  CANCELLING = 'CANCELLING',
  CANCELLED = 'CANCELLED',
}

const jobStatesMap = Object.values(JobState).reduce((acc, value) => {
  acc.set(value.toUpperCase(), value);
  return acc;
}, new Map<string, JobState>());

/**
 * Convert a string to a {@link JobState} if possible. Case-insensitive. Returns `null` for
 * invalid strings or non-strings.
 *
 * @param maybeState An optional string.
 * @returns The corresponding {@link JobState} if one exists, otherwise null.
 */
export const parseJobState = (maybeState: unknown): JobState | null => {
  if (!maybeState || typeof maybeState !== 'string') {
    return null;
  }
  return jobStatesMap.get(maybeState.toUpperCase()) ?? null;
};

export interface AsyncQueryContext {
  queryId: string;
  queryStatus: JobState;
}
declare module 'src/plugins/ui_actions/public' {
  export interface TriggerContextMapping {
    [ASYNC_TRIGGER_ID]: AsyncQueryContext;
  }
}
