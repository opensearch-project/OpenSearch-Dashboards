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
import { linkProjectExecutables } from '../utils/link_project_executables';
import { log } from '../utils/log';
import { parallelizeBatches } from '../utils/parallelize';
import { topologicallyBatchProjects } from '../utils/projects';
import { Project } from '../utils/project';
import { ICommand } from './';
import { getAllChecksums } from '../utils/project_checksums';
import { BootstrapCacheFile } from '../utils/bootstrap_cache_file';
import { readYarnLock } from '../utils/yarn_lock';
import { validateDependencies, isMutatingSingleVersionMode } from '../utils/validate_dependencies';
import {
  computeFingerprint,
  fingerprintsEqual,
  readFingerprint,
  writeFingerprint,
} from '../utils/bootstrap_fingerprint';

export const BootstrapCommand: ICommand = {
  description: 'Install dependencies and crosslink projects',
  name: 'bootstrap',

  async run(projects, projectGraph, { options, osd }) {
    // -----------------------------------------------------------------------
    // Fast path: if nothing relevant has changed since the last successful
    // bootstrap and every per-project cache is still valid, skip the whole
    // pipeline. Skipped when the user scopes the run (--include/--exclude/
    // --skip-opensearch-dashboards-plugins/--oss), passes --no-cache, or
    // passes --frozen-lockfile (which is a "verify the lockfile" request).
    // -----------------------------------------------------------------------
    const fastPathEligible =
      options.cache !== false &&
      !options['frozen-lockfile'] &&
      !options.include &&
      !options.exclude &&
      !options['skip-opensearch-dashboards-plugins'] &&
      !options.oss;

    if (fastPathEligible) {
      const previous = readFingerprint(osd);
      const current = computeFingerprint(osd, projects);

      const integrityOk = Fs.existsSync(osd.getAbsolute('node_modules/.yarn-integrity'));
      log.verbose(
        `[fingerprint] previous=${previous ? 'present' : 'absent'} match=${
          previous ? fingerprintsEqual(previous, current) : false
        } integrity=${integrityOk}`
      );

      if (previous && fingerprintsEqual(previous, current) && integrityOk) {
        const yarnLock = await readYarnLock(osd);
        const checksums = await getAllChecksums(osd, log, yarnLock);

        let staleProject: string | undefined;
        for (const project of projects.values()) {
          // The workspace root's per-project cache is content-hashed by
          // `git ls-files -dmto` at the repo root, which catches every
          // transient change (including our own fingerprint file writes).
          // Skip it here — the fingerprint itself already covers the
          // workspace-root manifest/lockfile content.
          if (project.isWorkspaceRoot) continue;

          if (project.hasScript('osd:bootstrap') || project.hasBuildTargets()) {
            const cacheFile = new BootstrapCacheFile(osd, project, checksums);
            if (!cacheFile.isValid()) {
              staleProject = project.name;
              break;
            }
          }
        }

        if (!staleProject) {
          // linkProjectExecutables is idempotent — re-linking the same bins
          // produces the same symlinks, and self-heals if someone wiped
          // node_modules/.bin out-of-band between runs.
          await linkProjectExecutables(projects, projectGraph);

          // validateDependencies is safe to re-run in non-mutating modes
          // (strict/ignore), but loose/force/brute-force can mutate
          // package.json/yarn.lock while reconciling single-version
          // conflicts — doing that silently behind a "fast path success"
          // log would be confusing, so defer those to a full bootstrap.
          const singleVersion = options['single-version']?.toLowerCase?.();
          if (!isMutatingSingleVersionMode(singleVersion)) {
            await validateDependencies(osd, yarnLock, singleVersion);
          }

          log.success(
            'bootstrap already up to date (fingerprint matched) — run with `--no-cache` to force a full bootstrap'
          );
          return;
        }
        log.verbose(`[fingerprint] per-project cache stale: ${staleProject}`);
      }
    }

    const batchedProjectsByWorkspace = topologicallyBatchProjects(projects, projectGraph, {
      batchByWorkspace: true,
    });
    const batchedProjects = topologicallyBatchProjects(projects, projectGraph);

    const extraArgs = [
      ...(options['frozen-lockfile'] === true ? ['--frozen-lockfile'] : []),
      ...(options['prefer-offline'] === true ? ['--prefer-offline'] : []),
    ];

    for (const batch of batchedProjectsByWorkspace) {
      for (const project of batch) {
        if (project.isWorkspaceProject) {
          log.verbose(`Skipping workspace project: ${project.name}`);
          continue;
        }

        if (project.hasDependencies()) {
          await project.installDependencies({ extraArgs });
        }
      }
    }

    const yarnLock = await readYarnLock(osd);

    await validateDependencies(osd, yarnLock, options['single-version']?.toLowerCase?.());

    await linkProjectExecutables(projects, projectGraph);

    /**
     * At the end of the bootstrapping process we call all `osd:bootstrap` scripts
     * in the list of projects. We do this because some projects need to be
     * transpiled before they can be used. Ideally we shouldn't do this unless we
     * have to, as it will slow down the bootstrapping process.
     */

    const checksums = await getAllChecksums(osd, log, yarnLock);
    const caches = new Map<Project, { file: BootstrapCacheFile; valid: boolean }>();
    let cachedProjectCount = 0;

    for (const project of projects.values()) {
      if (project.hasScript('osd:bootstrap') || project.hasBuildTargets()) {
        const file = new BootstrapCacheFile(osd, project, checksums);
        const valid = options.cache && file.isValid();

        if (valid) {
          log.debug(`[${project.name}] cache up to date`);
          cachedProjectCount += 1;
        }

        caches.set(project, { file, valid });
      }
    }

    if (cachedProjectCount > 0) {
      log.success(`${cachedProjectCount} bootstrap builds are cached`);
    }

    await parallelizeBatches(batchedProjects, async (project) => {
      const cache = caches.get(project);
      if (cache && !cache.valid) {
        // Explicitly defined targets override any bootstrap scripts
        if (project.hasBuildTargets()) {
          if (project.hasScript('osd:bootstrap')) {
            log.debug(
              `[${project.name}] ignoring [osd:bootstrap] script since build targets are provided`
            );
          }

          log.info(`[${project.name}] running [osd:bootstrap] build targets`);

          cache.file.delete();
          await project.buildForTargets({ sourceMaps: true });
        } else {
          log.info(`[${project.name}] running [osd:bootstrap] script`);

          cache.file.delete();
          await project.runScriptStreaming('osd:bootstrap');
        }

        cache.file.write();
        log.success(`[${project.name}] bootstrap complete`);
      }
    });

    // Record the successful run for next time's fast path. Only when eligible
    // so partial/scoped runs don't clobber the fingerprint captured by a full
    // successful bootstrap.
    if (fastPathEligible) {
      writeFingerprint(osd, computeFingerprint(osd, projects));
    }
  },
};
