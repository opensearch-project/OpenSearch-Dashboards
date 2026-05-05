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

import { Bundle } from '../common';

import { Watcher } from './watcher';

/**
 * Recursively call watcher.getNextChange$, passing it
 * just the bundles that haven't been changed yet until
 * all bundles have changed, then exit
 */
function recursiveGetNextChange$(
  watcher: Watcher,
  bundles: Bundle[],
  startTime: number
): ReturnType<Watcher['getNextChange$']> {
  return !bundles.length
    ? Rx.EMPTY
    : watcher.getNextChange$(bundles, startTime).pipe(
        mergeMap((event) => {
          if (event.type === 'changes detected') {
            return Rx.of(event);
          }

          return Rx.concat(
            Rx.of(event),

            recursiveGetNextChange$(
              watcher,
              bundles.filter((b) => !event.bundles.includes(b)),
              Date.now()
            )
          );
        })
      );
}

/**
 * Create an observable that emits change events for bundles
 * being watched.
 *
 * Once changes are seen in a bundle, that bundle's
 * files will no longer be watched.
 *
 * Once changes have been seen in all bundles, changeEvent$
 * will complete.
 *
 * If there are no bundles to watch, the observable completes
 * without sending any notifications.
 */
export function watchBundlesForChanges$(bundles: Bundle[], initialStartTime: number) {
  return bundles.length
    ? Watcher.using((watcher) => recursiveGetNextChange$(watcher, bundles, initialStartTime))
    : Rx.EMPTY;
}
