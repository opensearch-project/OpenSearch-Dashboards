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
import Fs from 'fs';
import Os from 'os';
import { promisify } from 'util';

import { CiStatsReporter, CiStatsMetrics } from '@osd/dev-utils';

import { mkdirp, compressTar, compressZip, hasPigz, Task } from '../lib';

const asyncStat = promisify(Fs.stat);

export const CreateArchives: Task = {
  description: 'Creating the archives for each platform',

  async run(config, log, build) {
    // Compression level: default 6 (gzip/zlib default). Release builds default to 9 to preserve
    // historical artifact size. Both overridable via OSD_BUILD_GZIP_LEVEL (optional, 0-9).
    const defaultLevel = config.isRelease ? 9 : 6;
    const envLevel = Number(process.env.OSD_BUILD_GZIP_LEVEL);
    const level =
      Number.isInteger(envLevel) && envLevel >= 0 && envLevel <= 9 ? envLevel : defaultLevel;

    // Concurrency rationale:
    //   - Each archive = one archiver tar walk (I/O-bound) piped to one compressor (CPU-bound).
    //   - Node-zlib path is single-threaded, so 1 archive ≈ 1 CPU. We can safely fan out to
    //     ~cpuCount archives in parallel.
    //   - pigz uses ~cpuCount internal threads, so concurrent pigz invocations oversubscribe.
    //     Cap at 2 to overlap one archive's I/O walk with another's CPU crunch.
    // Overridable via OSD_BUILD_ARCHIVE_CONCURRENCY when operators know their runner profile.
    const platforms = [...config.getTargetPlatforms()];
    const cpuCount = Math.max(1, Os.cpus().length);
    // Snapshot hasPigz() once: under OSD_BUILD_FORCE_PIGZ_PROBE each call re-spawns pigz,
    // and we want the concurrency decision, the log line, and the compressTar path to agree.
    const pigzAvailable = hasPigz();
    const defaultConcurrency = pigzAvailable
      ? Math.min(2, platforms.length)
      : Math.min(cpuCount, platforms.length);
    const envConcurrency = Number(process.env.OSD_BUILD_ARCHIVE_CONCURRENCY);
    const requested =
      Number.isInteger(envConcurrency) && envConcurrency >= 1 ? envConcurrency : defaultConcurrency;
    const concurrency = Math.min(requested, platforms.length);

    log.debug(
      `archive compression level=${level}, effective concurrency=${concurrency} ` +
        `(requested=${requested}, platforms=${platforms.length}, pigz=${pigzAvailable})`
    );

    const archives: Array<{ format: string; path: string; fileCount: number }> = [];

    const archiveOne = async (platform: ReturnType<typeof config.getTargetPlatforms>[number]) => {
      const source = build.resolvePathForPlatform(platform, '.');
      const destination = build.getPlatformArchivePath(platform);

      log.info('archiving', source, 'to', destination);

      await mkdirp(Path.dirname(destination));

      switch (Path.extname(destination)) {
        case '.zip':
          archives.push({
            format: 'zip',
            path: destination,
            fileCount: await compressZip({
              source,
              destination,
              archiverOptions: { zlib: { level } },
              createRootDirectory: true,
            }),
          });
          break;

        case '.gz':
          archives.push({
            format: 'tar',
            path: destination,
            fileCount: await compressTar({
              source,
              destination,
              archiverOptions: { gzip: true, gzipOptions: { level } },
              createRootDirectory: true,
              log,
            }),
          });
          break;

        default:
          throw new Error(`Unexpected extension for archive destination: ${destination}`);
      }
    };

    // Bounded-concurrency queue: run up to `concurrency` archives at once. Once any
    // worker fails, the others stop pulling new platforms — avoids spawning additional
    // pigz subprocesses after a known failure. In-flight archives finish (archiver +
    // pigz handle their own teardown on stream errors).
    let failed = false;
    const workers = Array.from({ length: concurrency }, async () => {
      while (platforms.length && !failed) {
        const next = platforms.shift();
        if (!next) break;
        try {
          await archiveOne(next);
        } catch (err) {
          failed = true;
          throw err;
        }
      }
    });
    await Promise.all(workers);

    const metrics: CiStatsMetrics = [];
    for (const { format, path, fileCount } of archives) {
      metrics.push({
        group: `distributable size`,
        id: format,
        value: (await asyncStat(path)).size,
      });

      metrics.push({
        group: 'distributable file count',
        id: 'distribution',
        value: fileCount,
      });
    }
    log.debug('archive metrics:', metrics);

    await CiStatsReporter.fromEnv(log).metrics(metrics);
  },
};
