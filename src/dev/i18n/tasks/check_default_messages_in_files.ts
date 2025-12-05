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

import { glob } from 'glob';
import { createFailError, isFailError, REPO_ROOT } from '@osd/dev-utils';
import { ErrorReporter, filterConfigPaths, I18nConfig, normalizePath, readFileAsync } from '..';
import { extractCodeMessages } from '../extractors';
import { validateMessageNamespace } from '../extract_default_translations';

function filterEntries(entries: string[], exclude: string[]) {
  return entries.filter((entry: string) =>
    exclude.every((excludedPath: string) => !normalizePath(entry).startsWith(excludedPath))
  );
}

function addMessageToMap(
  targetMap: Map<string, { message: string }>,
  key: string,
  value: { message: string },
  reporter: ErrorReporter
) {
  const existingValue = targetMap.get(key);

  if (targetMap.has(key) && existingValue!.message !== value.message) {
    reporter.report(
      createFailError(`There is more than one default message for the same id "${key}":
"${existingValue!.message}" and "${value.message}"`)
    );
  } else {
    targetMap.set(key, value);
  }
}

async function extractMessagesFromFilesToMap(
  files: string[],
  targetMap: Map<string, { message: string }>,
  config: I18nConfig,
  reporter: any
) {
  const availablePaths = Object.values(config.paths).flat();
  const ignoredPatterns = [
    '**/node_modules/**',
    '**/__tests__/**',
    '**/dist/**',
    '**/target/**',
    '**/vendor/**',
    '**/*.test.{js,jsx,ts,tsx}',
    '**/*.d.ts',
  ];

  const filesToCheck = files.filter(
    (file) => glob.sync(file, { ignore: ignoredPatterns, root: REPO_ROOT }).length > 0
  );

  const fileContents = await Promise.all(
    filterEntries(filesToCheck, config.exclude)
      .filter((entry) => {
        const normalizedEntry = normalizePath(entry);
        return availablePaths.some(
          (availablePath) =>
            normalizedEntry.startsWith(`${normalizePath(availablePath)}/`) ||
            normalizePath(availablePath) === normalizedEntry
        );
      })
      .map(async (entry: any) => ({
        name: entry,
        content: await readFileAsync(entry),
      }))
  );

  for (const { name, content } of fileContents) {
    const reporterWithContext = reporter.withContext({ name });

    try {
      for (const [id, value] of extractCodeMessages(content, reporterWithContext)) {
        validateMessageNamespace(id, name, config.paths, reporterWithContext);
        addMessageToMap(targetMap, id, value, reporterWithContext);
      }
    } catch (error) {
      if (!isFailError(error)) {
        throw error;
      }

      reporterWithContext.report(error);
    }
  }
}

export function checkDefaultMessagesInFiles(config: I18nConfig | undefined, inputPaths: string[]) {
  if (!config) {
    throw new Error('Config is missing');
  }
  const filteredPaths = filterConfigPaths(inputPaths, config) as string[];
  if (filteredPaths.length === 0) return;
  return [
    {
      title: 'Checking default messages in files',
      task: async (context: {
        messages: Map<string, { message: string }>;
        reporter: ErrorReporter;
      }) => {
        const { messages, reporter } = context;
        const initialErrorsNumber = reporter.errors.length;

        // Return result if no new errors were reported for this path.
        const result = await extractMessagesFromFilesToMap(
          filteredPaths,
          messages,
          config,
          reporter
        );
        if (reporter.errors.length === initialErrorsNumber) {
          return result;
        }

        throw reporter;
      },
    },
  ];
}
