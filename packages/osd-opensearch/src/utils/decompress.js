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

const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises');

const yauzl = require('yauzl');
const zlib = require('zlib');
const tarFs = require('tar-fs');

function decompressTarball(archive, dirPath) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(archive)
      .on('error', reject)
      .pipe(zlib.createGunzip())
      .on('error', reject)
      .pipe(tarFs.extract(dirPath, { strip: true }))
      .on('error', reject)
      .on('finish', resolve);
  });
}

async function decompressZip(input, output) {
  const resolvedOutput = path.resolve(output);
  fs.mkdirSync(resolvedOutput, { recursive: true });
  const zipfile = await yauzl.openPromise(input);
  for await (const entry of zipfile.eachEntry()) {
    // Strip the leading root-directory segment (all supported archives have one)
    const zipPath = entry.fileName.split(/\/|\\/).slice(1).join(path.sep);
    const resolvedPath = path.resolve(resolvedOutput, zipPath);

    // Guard against zip-slip for both files and directories
    if (resolvedPath !== resolvedOutput && !resolvedPath.startsWith(resolvedOutput + path.sep)) {
      throw new Error(`Zip slip detected: ${entry.fileName}`);
    }

    if (entry.fileName.endsWith('/')) {
      fs.mkdirSync(resolvedPath, { recursive: true });
    } else {
      // ensure parent directory exists
      fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
      const readStream = await zipfile.openReadStreamPromise(entry);
      await pipeline(readStream, fs.createWriteStream(resolvedPath));
    }
  }
}

exports.decompress = async function (input, output) {
  const ext = path.extname(input);

  switch (ext) {
    case '.zip':
      await decompressZip(input, output);
      break;
    case '.tar':
    case '.gz':
      await decompressTarball(input, output);
      break;
    default:
      throw new Error(`unknown extension "${ext}"`);
  }
};
