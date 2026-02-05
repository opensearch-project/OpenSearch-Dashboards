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

process.env.OPENSEARCH_DASHBOARDS_RESOLVER_HARD_CACHE = 'true';

const { ESLint } = require('eslint');

async function main() {
  const cliArgs = process.argv.slice(2);

  let fix = false;
  let cache = true;
  let format = 'stylish';
  const patterns = [];

  // Parse CLI arguments
  for (let i = 0; i < cliArgs.length; i++) {
    const arg = cliArgs[i];

    if (arg === '--fix') {
      fix = true;
    } else if (arg === '--no-cache') {
      cache = false;
    } else if (arg === '--format' || arg === '-f') {
      format = cliArgs[++i];
    } else if (arg.startsWith('--format=')) {
      format = arg.slice('--format='.length);
    } else if (
      arg === '--ext' ||
      arg === '--config' ||
      arg === '-c' ||
      arg === '--ignore-path' ||
      arg === '--ignore-pattern' ||
      arg === '--output-file' ||
      arg === '-o' ||
      arg === '--max-warnings' ||
      arg === '--resolve-plugins-relative-to' ||
      arg === '--rulesdir' ||
      arg === '--print-config'
    ) {
      // Skip flags with values that we don't need to handle
      i++;
    } else if (!arg.startsWith('-')) {
      patterns.push(arg);
    }
  }

  const eslint = new ESLint({
    fix,
    cache,
    extensions: ['.js', '.mjs', '.ts', '.tsx'],
  });

  const results = await eslint.lintFiles(patterns.length > 0 ? patterns : ['.']);

  if (fix) {
    await ESLint.outputFixes(results);
  }

  const formatter = await eslint.loadFormatter(format);
  const output = await formatter.format(results);
  if (output) {
    console.log(output);
  }

  const errorCount = results.reduce((sum, r) => sum + r.errorCount, 0);
  if (errorCount > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 2;
});
