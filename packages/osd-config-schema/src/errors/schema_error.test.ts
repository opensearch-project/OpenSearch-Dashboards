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

import { relative, sep } from 'path';
import { SchemaError } from '.';

import { standardize, getRepoRoot } from '@osd/cross-platform';

/**
 * Make all paths in stacktrace relative.
 */
export const cleanStack = (stack: string) =>
  stack
    .split('\n')
    .filter((line) => !line.includes('node_modules' + sep) && !line.includes('internal/'))
    .map((line) => {
      const parts = /.*\((.*)\).?/.exec(line) || [];

      if (parts.length === 0) {
        return line;
      }

      const path = parts[1];
      const relativePath = standardize(relative(getRepoRoot(path) || '.', path));

      return line.replace(path, relativePath);
    })
    .join('\n');

it('includes stack', () => {
  try {
    throw new SchemaError('test');
  } catch (e) {
    expect(cleanStack(e.stack)).toMatchSnapshot();
  }
});
