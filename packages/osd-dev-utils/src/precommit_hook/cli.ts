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

import Path from 'path';
import { chmod, writeFile } from 'fs';
import { promisify } from 'util';
import { REPO_ROOT } from '@osd/utils';

import { run } from '../run';
import { createFailError, isFailError } from '../run';
import { SCRIPT_SOURCE } from './script_source';
import { getGitDir } from './get_git_dir';

const chmodAsync = promisify(chmod);
const writeFileAsync = promisify(writeFile);

function validateGitDir(gitDir: string) {
  if (gitDir === '--git-common-dir') {
    throw createFailError(
      `--git-common-dir not accessible on current git version. Skipping installation of pre-commit git hook.`
    );
  }
}

run(
  async ({ log }) => {
    try {
      const gitDir = await getGitDir();
      validateGitDir(gitDir);
      const installPath = Path.resolve(REPO_ROOT, gitDir, 'hooks/pre-commit');

      log.info(`Registering OpenSearch Dashboards pre-commit git hook...`);
      await writeFileAsync(installPath, SCRIPT_SOURCE);
      await chmodAsync(installPath, 0o755);
      log.success(`OpenSearch Dashboards pre-commit git hook was installed successfully.`);
    } catch (e) {
      if (isFailError(e)) {
        return;
      }
      log.error(`OpenSearch Dashboards pre-commit git hook was not installed as an error occur.`);
      throw e;
    }
  },
  {
    description: 'Register git hooks in the local repo',
  }
);
