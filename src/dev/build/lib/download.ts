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

import { openSync, writeSync, unlinkSync, closeSync } from 'fs';
import { dirname } from 'path';

import chalk from 'chalk';
import { createHash } from 'crypto';
import Axios from 'axios';
import { ToolingLog } from '@osd/dev-utils';

import { mkdirp } from './fs';

function tryUnlink(path: string) {
  try {
    unlinkSync(path);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

interface DownloadOptions {
  log: ToolingLog;
  url: string;
  destination: string;
  sha256: string;
  retries?: number;
}
export async function download(options: DownloadOptions): Promise<void> {
  const { log, url, destination, sha256, retries = 0 } = options;

  if (!sha256) {
    throw new Error(`sha256 checksum of ${url} not provided, refusing to download.`);
  }

  // mkdirp and open file outside of try/catch, we don't retry for those errors
  await mkdirp(dirname(destination));
  const fileHandle = openSync(destination, 'w');

  let error;
  try {
    log.debug(`Attempting download of ${url}`, chalk.dim(sha256));

    const response = await Axios.request({
      url,
      responseType: 'stream',
      adapter: 'http',
    });

    if (response.status !== 200) {
      throw new Error(`Unexpected status code ${response.status} when downloading ${url}`);
    }

    const hash = createHash('sha256');
    await new Promise((resolve, reject) => {
      response.data.on('data', (chunk: Buffer) => {
        hash.update(chunk);
        writeSync(fileHandle, chunk);
      });

      response.data.on('error', reject);
      response.data.on('end', resolve);
    });

    const downloadedSha256 = hash.digest('hex');
    if (downloadedSha256 !== sha256) {
      throw new Error(
        `Downloaded checksum ${downloadedSha256} does not match the expected sha256 checksum.`
      );
    }
  } catch (_error) {
    error = _error;
  } finally {
    closeSync(fileHandle);
  }

  if (!error) {
    log.debug(`Downloaded ${url} and verified checksum`);
    return;
  }

  log.debug(`Download failed: ${error.message}`);

  // cleanup downloaded data and log error
  log.debug(`Deleting downloaded data at ${destination}`);
  tryUnlink(destination);

  // retry if we have retries left
  if (retries > 0) {
    log.debug(`Retrying - ${retries} attempt remaining`);
    return await download({
      ...options,
      retries: retries - 1,
    });
  }

  throw error;
}
