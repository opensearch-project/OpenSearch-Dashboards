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
import { REPO_ROOT } from '@osd/dev-utils';
import { ListrContext } from '.';
import { I18nConfig, normalizePath, readFileAsync } from '..';
// @ts-ignore
import { extractCodeMessages } from '../extractors';

function filterEntries(entries: string[], exclude: string[]) {
  return entries.filter((entry: string) =>
    exclude.every((excludedPath: string) => !normalizePath(entry).startsWith(excludedPath))
  );
}

async function checkFilesForUntrackedMessagesTask({
  files,
  config,
  reporter,
}: {
  files: string[];
  config: I18nConfig;
  reporter: any;
}) {
  const availablePaths = Object.values(config.paths).flat();
  const ignoredPatterns = availablePaths.concat([
    '**/*.d.ts',
    '**/*.test.{js,jsx,ts,tsx}',
    '**/__fixtures__/**',
    '**/__tests__/**',
    '**/build/**',
    '**/dist/**',
    '**/node_modules/**',
    '**/packages/osd-i18n/**',
    '**/packages/osd-plugin-generator/template/**',
    '**/scripts/**',
    '**/src/dev/**',
    '**/target/**',
    '**/test/**',
    '**/vendor/**',
  ]);

  const filesToCheck = files.filter(
    (file) => glob.sync(file, { ignore: ignoredPatterns, root: REPO_ROOT }).length > 0
  );

  const fileContents = await Promise.all(
    filterEntries(filesToCheck, config.exclude)
      .filter((entry) => {
        const normalizedEntry = normalizePath(entry);
        return !availablePaths.some(
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
    for (const [id] of extractCodeMessages(content, reporterWithContext)) {
      const errorMessage = `Untracked file contains i18n label (${id}).`;
      reporterWithContext.report(errorMessage);
    }
  }
}

export function checkFilesForUntrackedMessages(files: string[]) {
  return [
    {
      title: `Checking untracked messages in files`,
      task: async (context: ListrContext) => {
        const { reporter, config } = context;
        if (!config) {
          throw new Error('Config is not defined');
        }
        const initialErrorsNumber = reporter.errors.length;
        const result = await checkFilesForUntrackedMessagesTask({ files, config, reporter });
        if (reporter.errors.length === initialErrorsNumber) {
          return result;
        }

        throw reporter;
      },
    },
  ];
}
