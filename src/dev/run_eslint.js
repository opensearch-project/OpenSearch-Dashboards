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

const { ESLint } = require('eslint');

async function run() {
  // Parse command line arguments manually since ESLint 8.x doesn't export options parser
  const args = process.argv.slice(2);
  const hasPrintConfig = args.includes('--print-config');
  const hasCache = !args.includes('--no-cache');
  const hasFix = args.includes('--fix');
  const extIndex = args.indexOf('--ext');
  const hasExt = extIndex !== -1;

  process.env.OPENSEARCH_DASHBOARDS_RESOLVER_HARD_CACHE = 'true';

  // Parse --ext value (e.g. --ext .js,.ts,.tsx)
  let extensions = ['.js', '.mjs', '.ts', '.tsx'];
  if (hasExt && extIndex + 1 < args.length) {
    extensions = args[extIndex + 1].split(',').map((ext) => ext.trim());
  }

  // Build ESLint options
  const options = {
    cache: hasCache,
    extensions,
    fix: hasFix,
  };

  // Determine what to lint — filter out flags and their values
  const flagsWithValues = new Set(['--ext', '--print-config']);
  let filesToLint = ['.'];
  const fileArgs = [];
  for (let i = 0; i < args.length; i++) {
    if (flagsWithValues.has(args[i])) {
      i++; // skip the flag's value
      continue;
    }
    if (args[i].startsWith('-')) continue;
    fileArgs.push(args[i]);
  }
  if (fileArgs.length > 0 && !hasPrintConfig) {
    filesToLint = fileArgs;
  }

  try {
    const eslint = new ESLint(options);

    if (hasPrintConfig) {
      // Handle --print-config
      const configFile = args[args.indexOf('--print-config') + 1];
      const config = await eslint.calculateConfigForFile(configFile || '.');
      console.log(JSON.stringify(config, null, 2));
      return;
    }

    // Lint files
    const results = await eslint.lintFiles(filesToLint);

    // Write fixes if --fix was passed
    if (hasFix) {
      await ESLint.outputFixes(results);
    }

    // Output results
    const formatter = await eslint.loadFormatter('stylish');
    const resultText = formatter.format(results);

    if (resultText) {
      console.log(resultText);
    }

    // Exit with error code if there are errors
    const hasErrors = results.some((result) => result.errorCount > 0);
    if (hasErrors) {
      process.exit(1);
    }
  } catch (error) {
    console.error('ESLint error:', error.message);
    process.exit(1);
  }
}

run().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
