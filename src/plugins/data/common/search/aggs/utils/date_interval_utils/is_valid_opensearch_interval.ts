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

import { parseOpenSearchInterval } from './parse_opensearch_interval';

/**
 * Checks whether a given interval string (e.g. 1w, 24h, ...) is a valid OpenSearch interval.
 * Will return false if the interval is not valid in OpenSearch, otherwise true.
 * Invalid intervals might be: 2f, since there is no unit 'f'; 2w, since weeks and month intervals
 * are only allowed with a value of 1, etc.
 *
 * @param interval The interval string like 1w, 24h
 * @returns True if the interval is valid for OpenSearch
 */
export function isValidOpenSearchInterval(interval: string): boolean {
  try {
    parseOpenSearchInterval(interval);
    return true;
  } catch {
    return false;
  }
}
