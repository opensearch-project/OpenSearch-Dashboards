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

import { Task } from '../../lib';
import { runFpm } from './run_fpm';
import { runDockerGenerator, runDockerGeneratorForUBI } from './docker_generator';

export const CreateDebPackage: Task = {
  description: 'Creating deb package',

  async run(config, log, build) {
    await runFpm(config, log, build, 'deb', 'x64', [
      '--architecture',
      'amd64',
      '--deb-priority',
      'optional',
    ]);
  },
};

export const CreateDebArmPackage: Task = {
  description: 'Creating deb-arm package',

  async run(config, log, build) {
    await runFpm(config, log, build, 'deb', 'arm64', [
      '--architecture',
      'arm64',
      '--deb-priority',
      'optional',
    ]);
  },
};

export const CreateRpmPackage: Task = {
  description: 'Creating rpm package',

  async run(config, log, build) {
    await runFpm(config, log, build, 'rpm', 'x64', ['--architecture', 'x64', '--rpm-os', 'linux']);
  },
};

export const CreateRpmArmPackage: Task = {
  description: 'Creating rpm-arm package',

  async run(config, log, build) {
    await runFpm(config, log, build, 'rpm', 'arm64', [
      '--architecture',
      'arm64',
      '--rpm-os',
      'linux',
    ]);
  },
};

export const CreateDockerPackage: Task = {
  description: 'Creating docker package',

  async run(config, log, build) {
    // Builds Docker targets
    await runDockerGenerator(config, log, build);
  },
};

export const CreateDockerUbiPackage: Task = {
  description: 'Creating docker ubi package',

  async run(config, log, build) {
    // Builds Docker target default with ubi7 base image
    await runDockerGeneratorForUBI(config, log, build);
  },
};

/**
 * Runs the provided fpm-based OS package tasks in parallel. fpm invocations read the
 * platform-specific linux build tree (disjoint by arch) and write disjoint files in
 * target/, so they're safe to run concurrently. Concurrency is capped via
 * OSD_BUILD_FPM_CONCURRENCY (optional; default = tasks.length, i.e. all in parallel).
 */
export const createOsPackagesTask = (tasks: Task[]): Task => ({
  description: `Creating OS packages (${tasks.length})`,
  async run(config, log, build) {
    const envConcurrency = Number(process.env.OSD_BUILD_FPM_CONCURRENCY);
    const concurrency =
      Number.isInteger(envConcurrency) && envConcurrency >= 1 ? envConcurrency : tasks.length;

    log.info(
      `Creating OS packages: ${tasks.length} task(s), concurrency=${Math.min(
        concurrency,
        tasks.length
      )}`
    );
    log.debug(`os package concurrency=${concurrency} of ${tasks.length}`);

    const queue = [...tasks];
    // Shared failure sentinel: once any worker throws, the others stop pulling new tasks
    // from the queue. In-flight tasks still run to completion (we can't safely interrupt
    // an fpm subprocess mid-run), but we avoid starting new ones after a known failure.
    let failed = false;
    const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
      while (queue.length && !failed) {
        const task = queue.shift();
        if (!task) break;
        const start = Date.now();
        log.info(`▶ ${task.description}`);
        try {
          await task.run(config, log, build);
        } catch (err) {
          failed = true;
          throw err;
        }
        log.info(`✓ ${task.description} (${((Date.now() - start) / 1000).toFixed(1)} sec)`);
      }
    });
    await Promise.all(workers);
  },
});
