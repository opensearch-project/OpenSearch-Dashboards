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

import { createInterface } from 'readline';
import { join, isAbsolute, relative } from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { copyAll, Task } from '../lib';

export const CopySource: Task = {
  description: 'Copying source into platform-generic build directory',

  async run(config, log, build) {
    const repoRoot = config.resolveFromRepo();
    const buildRoot = build.resolvePath();

    await copyAll(repoRoot, buildRoot, {
      dot: false,
      select: [
        'src/**',
        '!src/**/*.{test,test.mocks,mock}.{js,ts,tsx}',
        '!src/**/mocks.ts', // special file who imports .mock files
        '!src/**/{target,__tests__,__snapshots__,__mocks__}/**',
        '!src/test_utils/**',
        '!src/fixtures/**',
        '!src/cli/cluster/**',
        '!src/cli/repl/**',
        '!src/cli/dev.js',
        '!src/functional_test_runner/**',
        '!src/dev/**',
        '!src/setup_node_env/babel_register/index.js',
        '!src/setup_node_env/babel_register/register.js',
        '!**/public/**/*.{js,ts,tsx,json}',
        'typings/**',
        'config/opensearch_dashboards.yml',
        'config/node.options',
        'tsconfig*.json',
        '.i18nrc.json',
        'opensearch_dashboards.d.ts',
      ],
    });

    await copyYarnLock(repoRoot, buildRoot);
  },
};

/*
 * Dependencies linked using `file:` in the `yarn.lock` file are
 * referenced with relative paths. Moving them to the `build`
 * folder, these paths need to be transformed.
 */
export const copyYarnLock = async (repoRoot: string, buildRoot: string) => {
  const writeStream = createWriteStream(join(buildRoot, 'yarn.lock'));
  const writeLine = (line: string) =>
    new Promise((resolve) => {
      if (writeStream.write(line + '\n')) return resolve();
      writeStream.once('drain', resolve);
    });

  const returnPromise = new Promise((resolve) => {
    writeStream.once('close', resolve);
  });

  /*
   * Dependency patterns are comma separated `name@range` values, followed
   * by a colon, like `AAAA:` and `AAAA, BBBB, CCCC:`
   * Some are wrapped in quotes, like `"AAAA":` and `"AAAA, BBBB, CCCC":`
   *
   * The linked file will have `@file:` in it and the inner strings will
   * not have commas or colons.
   *
   * Zero-width lookbehind and lookaheads allow getting only the part
   * required for processing the patterns. `\S` is to avoid matching
   * spaces after commas.
   */
  const linkedFileDepPattern = /(?<=^"?|,\s*)(\S+?[^,:]+)@file:([^,:]+)(?=,\s*|"?:\s*$)/g;
  const fileLinkDelimiter = '@file:';

  const reader = createInterface({
    input: createReadStream(join(repoRoot, 'yarn.lock')),
    crlfDelay: Infinity,
  });

  for await (const line of reader) {
    /*
     * For added safety, we make sure the line doesn't start with whitespace
     * before we check that it has `@file:`.
     */
    if (!line.startsWith(' ') && line.includes(fileLinkDelimiter)) {
      await writeLine(
        line.replace(linkedFileDepPattern, (match, m1, m2) => {
          if (isAbsolute(m2)) return `${m1}${fileLinkDelimiter}${m2}`;
          // Join the relative path and repoRoot and find how to ge there from buildRoot
          return `${m1}${fileLinkDelimiter}${relative(buildRoot, join(repoRoot, m2))}`;
        })
      );
    } else {
      await writeLine(line);
    }
  }

  writeStream.end();

  return returnPromise;
};
