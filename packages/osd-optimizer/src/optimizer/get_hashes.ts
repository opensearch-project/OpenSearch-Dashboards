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

import Fs from 'fs';

import * as Rx from 'rxjs';
import { mergeMap, map, catchError } from 'rxjs/operators';
import Crypto from 'crypto';
import { allValuesFrom } from '../common';

// const stat$ = Rx.bindNodeCallback<Fs.PathLike, Fs.Stats>(Fs.stat);
const readFile$ = Rx.bindNodeCallback<Fs.PathLike, Buffer>(Fs.readFile);

/**
 * Get content hashes of referenced paths concurrently, with at most 100 concurrent files
 */
export async function getHashes(paths: Iterable<string>): Promise<Map<string, string>> {
  return new Map(
    await allValuesFrom(
      Rx.from(paths).pipe(
        // map paths to [path, sha1Hash] entries with concurrency of
        // 100 at a time, ignoring missing paths
        mergeMap(
          (path) =>
            readFile$(path).pipe(
              map(
                (buffer) =>
                  [path, Crypto.createHash('sha1').update(buffer).digest('base64')] as const
              ),
              catchError((error: any) =>
                error?.code === 'ENOENT' ? Rx.EMPTY : Rx.throwError(error)
              )
            ),
          100
        )
      )
    )
  );
}
