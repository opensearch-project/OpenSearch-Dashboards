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

import { ESLint } from 'eslint';

import { ToolingLog } from '@osd/dev-utils';
import { File } from '../file';

/**
 * Filters a list of files to only include lintable files.
 *
 * @param  {ToolingLog} log
 * @param  {Array<File>} files
 * @return {Array<File>}
 */
export async function pickFilesToLint(log: ToolingLog, files: File[]) {
  const eslint = new ESLint({});
  const result: File[] = [];

  for (const file of files) {
    if (!file.isJs() && !file.isTypescript()) {
      continue;
    }

    const path = file.getRelativePath();

    if (await eslint.isPathIgnored(path)) {
      log.warning(`[eslint] %j ignored by .eslintignore`, file);
      continue;
    }

    log.debug('[eslint] linting %j', file);
    result.push(file);
  }

  return result;
}
