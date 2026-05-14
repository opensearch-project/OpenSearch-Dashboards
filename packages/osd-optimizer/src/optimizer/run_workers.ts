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

import { Bundle, maybeMap } from '../common';

import { OptimizerConfig } from './optimizer_config';
import { ChangeEvent } from './watcher';
import { assignBundlesToWorkers } from './assign_bundles_to_workers';
import { observeWorker } from './observe_worker';

/**
 * Create a stream of all worker events, these include messages
 * from workers and events about the status of workers. To get
 * these events we assign the bundles to workers via
 * `assignBundlesToWorkers()` and then start a worker for each
 * assignment with `observeWorker()`.
 *
 * Subscribes to `changeEvent$` in order to determine when more
 * bundles should be assigned to workers.
 *
 * Completes when all workers have exited. If we are running in
 * watch mode this observable will never exit.
 */
export function runWorkers(
  config: OptimizerConfig,
  bundles: Bundle[],
  changeEvent$: Rx.Observable<ChangeEvent>
) {
  return Rx.concat(
    // first batch of bundles — all of them
    Rx.of(bundles),
    // subsequent batches are defined by changeEvent$
    changeEvent$.pipe(maybeMap((c) => (c.type === 'changes' ? c.bundles : undefined)))
  ).pipe(
    mergeMap((batchBundles) =>
      Rx.from(assignBundlesToWorkers(batchBundles, config.maxWorkerCount)).pipe(
        mergeMap((assignment) =>
          observeWorker(config, config.getWorkerConfig(), assignment.bundles)
        )
      )
    )
  );
}
