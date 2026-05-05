/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { inspect } from 'util';

import { WorkerMsg, CompilerMsg, Bundle, Summarizer } from '../common';

import { ChangeEvent } from './watcher';
import { WorkerStatus } from './observe_worker';
import { OptimizerConfig } from './optimizer_config';

export interface OptimizerInitializedEvent {
  type: 'optimizer initialized';
}

export type OptimizerEvent = OptimizerInitializedEvent | ChangeEvent | WorkerMsg | WorkerStatus;

export interface OptimizerState {
  phase: 'initializing' | 'initialized' | 'running' | 'issue' | 'success' | 'reallocating';
  startTime: number;
  durSec: number;
  compilerStates: CompilerMsg[];
  onlineBundles: Bundle[];
  offlineBundles: Bundle[];
}

const msToSec = (ms: number) => Math.round(ms / 10) / 100;

/**
 * merge a state and some updates into a new optimizer state, apply some
 * standard updates related to timing
 */
function createOptimizerState(
  prevState: OptimizerState,
  update?: Partial<Omit<OptimizerState, 'version' | 'durSec' | 'startTime'>>
): OptimizerState {
  // reset start time if we are transitioning into running
  const startTime =
    (prevState.phase === 'success' || prevState.phase === 'issue') &&
    (update?.phase === 'running' || update?.phase === 'reallocating')
      ? Date.now()
      : prevState.startTime;

  return {
    ...prevState,
    ...update,
    startTime,
    durSec: msToSec(Date.now() - startTime),
  };
}

/**
 * calculate the total state, given a set of compiler messages
 * and the total number of online bundles
 */
function getStatePhase(states: CompilerMsg[], totalOnlineBundles: number) {
  const types = states.map((s) => s.type);

  if (types.includes('running')) {
    return 'running';
  }

  if (types.includes('compiler issue')) {
    return 'issue';
  }

  // Only report success when ALL online bundles have reported
  if (states.length >= totalOnlineBundles && types.every((s) => s === 'compiler success')) {
    return 'success';
  }

  // Some bundles finished but others haven't reported yet — still running
  if (states.length < totalOnlineBundles) {
    return 'running';
  }

  throw new Error(`unable to summarize bundle states: ${JSON.stringify(states)}`);
}

export function createOptimizerStateSummarizer(
  config: OptimizerConfig
): Summarizer<OptimizerEvent, OptimizerState> {
  return (state, event) => {
    if (event.type === 'optimizer initialized') {
      // All bundles are always online — they all go to workers
      return createOptimizerState(state, {
        phase: 'initialized',
        onlineBundles: [...config.bundles],
        offlineBundles: [],
      });
    }

    if (event.type === 'worker error' || event.type === 'compiler error') {
      // unrecoverable error states
      const error = new Error(event.errorMsg);
      error.stack = event.errorStack;
      throw error;
    }

    if (event.type === 'worker stdio' || event.type === 'worker started') {
      // same state, but updated so the event is shared externally
      return createOptimizerState(state);
    }

    if (event.type === 'changes detected') {
      // switch to running early, before workers are started, so that
      // base path proxy can prevent requests in the delay between changes
      // and workers started
      return createOptimizerState(state, {
        phase: 'reallocating',
      });
    }

    if (event.type === 'changes') {
      const onlineBundles: Bundle[] = [...state.onlineBundles];
      onlineBundles.push(...event.bundles);

      const offlineBundles: Bundle[] = [];
      for (const bundle of config.bundles) {
        if (!onlineBundles.includes(bundle)) {
          offlineBundles.push(bundle);
        }
      }

      return createOptimizerState(state, {
        phase: 'running',
        onlineBundles,
        offlineBundles,
      });
    }

    if (
      event.type === 'compiler issue' ||
      event.type === 'compiler success' ||
      event.type === 'running'
    ) {
      const compilerStates: CompilerMsg[] = [
        ...state.compilerStates.filter((c) => c.bundleId !== event.bundleId),
        event,
      ];
      return createOptimizerState(state, {
        phase: getStatePhase(compilerStates, state.onlineBundles.length),
        compilerStates,
      });
    }

    throw new Error(`unexpected optimizer event ${inspect(event)}`);
  };
}
