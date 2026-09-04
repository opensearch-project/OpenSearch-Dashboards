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

const { decompress } = require('./decompress');
const fs = require('fs');
const path = require('path');
const del = require('del');
const os = require('os');

const fixturesFolder = path.resolve(__dirname, '__fixtures__');
const randomDir = Math.random().toString(36);
const tmpFolder = path.resolve(os.tmpdir(), randomDir);
const dataFolder = path.resolve(tmpFolder, 'data');
const opensearchFolder = path.resolve(tmpFolder, '.opensearch');

const zipSnapshot = path.resolve(dataFolder, 'snapshot.zip');
const tarGzSnapshot = path.resolve(dataFolder, 'snapshot.tar.gz');

beforeEach(() => {
  fs.mkdirSync(tmpFolder, { recursive: true });
  fs.mkdirSync(dataFolder, { recursive: true });
  fs.mkdirSync(opensearchFolder, { recursive: true });

  fs.copyFileSync(path.resolve(fixturesFolder, 'snapshot.zip'), zipSnapshot);
  fs.copyFileSync(path.resolve(fixturesFolder, 'snapshot.tar.gz'), tarGzSnapshot);
});

afterEach(async () => {
  await del(tmpFolder, { force: true });
});

test('zip strips root directory', async () => {
  await decompress(zipSnapshot, path.resolve(opensearchFolder, 'foo'));
  expect(fs.readdirSync(path.resolve(opensearchFolder, 'foo/bin'))).toContain('opensearch.bat');
});

test('tar strips root directory', async () => {
  await decompress(tarGzSnapshot, path.resolve(opensearchFolder, 'foo'));
  expect(fs.readdirSync(path.resolve(opensearchFolder, 'foo/bin'))).toContain('opensearch');
});

test('zip with explicit root directory entry decompresses without false zip-slip error', async () => {
  // root_dir_entry.zip has entries: rootdir/, rootdir/subdir/, rootdir/file.txt, rootdir/subdir/nested.txt
  // The leading path segment is stripped, so the root dir entry resolves to the output dir itself.
  // This must not throw "Zip slip detected".
  const archive = path.resolve(fixturesFolder, 'root_dir_entry.zip');
  const outDir = path.resolve(opensearchFolder, 'root_dir_out');
  await expect(decompress(archive, outDir)).resolves.toBeUndefined();
  expect(fs.readFileSync(path.resolve(outDir, 'file.txt'), 'utf8')).toBe('hello');
  expect(fs.readFileSync(path.resolve(outDir, 'subdir/nested.txt'), 'utf8')).toBe('world');
});

test('zip rejects zip-slip path traversal attempts', async () => {
  const archive = path.resolve(fixturesFolder, 'zip_slip.zip');
  const outDir = path.resolve(opensearchFolder, 'slip_out');
  // yauzl v3 may itself reject traversal paths before our guard fires;
  // either rejection is acceptable — both protect against zip-slip.
  await expect(decompress(archive, outDir)).rejects.toThrow(
    /Zip slip detected|invalid relative path/i
  );
});
