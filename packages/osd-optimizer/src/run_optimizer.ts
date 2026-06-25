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

import * as Rx from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { summarizeEventStream, Update } from './common';

import {
  OptimizerConfig,
  OptimizerEvent,
  OptimizerState,
  runWorkers,
  OptimizerInitializedEvent,
  createOptimizerStateSummarizer,
  handleOptimizerCompletion,
} from './optimizer';

export type OptimizerUpdate = Update<OptimizerEvent, OptimizerState>;
export type OptimizerUpdate$ = Rx.Observable<OptimizerUpdate>;

export function runOptimizer(config: OptimizerConfig) {
  return Rx.defer(() => {
    const startTime = Date.now();
    return Rx.of({ startTime });
  }).pipe(
    mergeMap(({ startTime }) => {
      // initialization completes immediately — all bundles go to workers
      const init$ = Rx.of<OptimizerInitializedEvent>({
        type: 'optimizer initialized',
      });

      // run workers to build all bundles, plus any changed bundles from watch mode
      const workerEvent$ = runWorkers(config, config.bundles);

      // create the stream that summarizes all the events into specific states
      return summarizeEventStream<OptimizerEvent, OptimizerState>(
        Rx.merge(init$, workerEvent$),
        {
          phase: 'initializing',
          compilerStates: [],
          offlineBundles: [],
          onlineBundles: [],
          startTime,
          durSec: 0,
        },
        createOptimizerStateSummarizer(config)
      );
    }),
    handleOptimizerCompletion(config)
  );
}
