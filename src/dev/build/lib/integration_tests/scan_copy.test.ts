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

import { chmodSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { resolve } from 'path';

import del from 'del';

import { getChildPaths } from '../fs';
import { scanCopy } from '../scan_copy';
import { PROCESS_WORKING_DIR } from '@osd/cross-platform';

const IS_WINDOWS = process.platform === 'win32';
const FIXTURES = resolve(__dirname, '../__fixtures__');
const TMP = resolve(__dirname, '../__tmp__');
const WORLD_EXECUTABLE = resolve(FIXTURES, 'bin/world_executable');

const getCommonMode = (path: string) => statSync(path).mode.toString(8).slice(-3);

// ensure WORLD_EXECUTABLE is actually executable by all
beforeAll(async () => {
  chmodSync(WORLD_EXECUTABLE, 0o777);
});

// cleanup TMP directory
afterEach(async () => {
  await del(TMP, { cwd: PROCESS_WORKING_DIR });
});

it('rejects if source path is not absolute', async () => {
  await expect(
    scanCopy({
      source: 'foo/bar',
      destination: __dirname,
    })
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"Please use absolute paths to keep things explicit. You probably want to use \`build.resolvePath()\` or \`config.resolveFromRepo()\`."`
  );
});

it('rejects if destination path is not absolute', async () => {
  await expect(
    scanCopy({
      source: __dirname,
      destination: 'foo/bar',
    })
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"Please use absolute paths to keep things explicit. You probably want to use \`build.resolvePath()\` or \`config.resolveFromRepo()\`."`
  );
});

it('rejects if neither path is absolute', async () => {
  await expect(
    scanCopy({
      source: 'foo/bar',
      destination: 'foo/bar',
    })
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"Please use absolute paths to keep things explicit. You probably want to use \`build.resolvePath()\` or \`config.resolveFromRepo()\`."`
  );
});

it.skip('copies files and directories from source to dest, including dot files, creating dest if necessary, respecting mode', async () => {
  const destination = resolve(TMP, 'a/b/c');
  await scanCopy({
    source: FIXTURES,
    destination,
  });

  expect((await getChildPaths(resolve(destination, 'foo_dir'))).sort()).toEqual([
    resolve(destination, 'foo_dir/.bar'),
    resolve(destination, 'foo_dir/bar.txt'),
    resolve(destination, 'foo_dir/foo'),
  ]);

  expect(getCommonMode(resolve(destination, 'bin/world_executable'))).toBe(
    IS_WINDOWS ? '666' : '777'
  );

  expect(getCommonMode(resolve(destination, 'foo_dir/bar.txt'))).toBe(IS_WINDOWS ? '666' : '644');
});

it('applies filter function specified', async () => {
  const destination = resolve(TMP, 'a/b/c/d');
  await scanCopy({
    source: FIXTURES,
    destination,
    filter: (record) => !record.name.includes('bar'),
  });

  expect((await getChildPaths(resolve(destination, 'foo_dir'))).sort()).toEqual([
    resolve(destination, 'foo_dir/foo'),
  ]);
});

it('supports atime and mtime', async () => {
  const destination = resolve(TMP, 'a/b/c/d/e');
  const time = new Date(1425298511000);

  await scanCopy({
    source: FIXTURES,
    destination,
    time,
  });

  const barTxt = statSync(resolve(destination, 'foo_dir/bar.txt'));
  const fooDir = statSync(resolve(destination, 'foo_dir'));

  // precision is platform specific
  const oneDay = 86400000;
  expect(Math.abs(barTxt.atimeMs - time.getTime())).toBeLessThan(oneDay);
  expect(Math.abs(barTxt.mtimeMs - time.getTime())).toBeLessThan(oneDay);
  expect(Math.abs(fooDir.atimeMs - time.getTime())).toBeLessThan(oneDay);
});

describe('hardlink-preferred copy', () => {
  const SRC_FILE = resolve(FIXTURES, 'foo_dir/bar.txt');

  it('creates hardlinks on the same filesystem (same inode as source)', async () => {
    const destination = resolve(TMP, 'hardlink');
    await scanCopy({ source: FIXTURES, destination });

    const srcInode = statSync(SRC_FILE).ino;
    const dstInode = statSync(resolve(destination, 'foo_dir/bar.txt')).ino;
    // In same-FS mode, hardlinks share the inode, so they must be equal.
    expect(dstInode).toBe(srcInode);
  });

  it('falls back to full copy when OSD_BUILD_NO_HARDLINK=1 (different inode)', async () => {
    const destination = resolve(TMP, 'no-hardlink');
    process.env.OSD_BUILD_NO_HARDLINK = '1';
    try {
      // scan_copy reads OSD_BUILD_NO_HARDLINK per-call, so no module reset needed.
      await scanCopy({ source: FIXTURES, destination });
    } finally {
      delete process.env.OSD_BUILD_NO_HARDLINK;
    }

    const srcInode = statSync(SRC_FILE).ino;
    const dstInode = statSync(resolve(destination, 'foo_dir/bar.txt')).ino;
    expect(dstInode).not.toBe(srcInode);
  });

  it('skips hardlink when `time` is provided (different inode)', async () => {
    const destination = resolve(TMP, 'time');
    await scanCopy({ source: FIXTURES, destination, time: new Date(1425298511000) });

    const srcInode = statSync(SRC_FILE).ino;
    const dstInode = statSync(resolve(destination, 'foo_dir/bar.txt')).ino;
    // With `time`, scan_copy avoids linking so the mtime override doesn't mutate the source.
    expect(dstInode).not.toBe(srcInode);
  });

  it('rejects when the destination file already exists (EEXIST not swallowed)', async () => {
    const destination = resolve(TMP, 'eexist');
    // Pre-create the same relative path so the copy collides.
    await scanCopy({ source: FIXTURES, destination });
    // Second call must fail rather than silently overwrite — preserves COPYFILE_EXCL semantics.
    await expect(scanCopy({ source: FIXTURES, destination })).rejects.toBeDefined();
  });

  it('[CONTRACT] hardlinked copies share state with source — mutating dest mutates source', async () => {
    // This test intentionally demonstrates the behavior that callers MUST respect.
    // If it starts failing because scanCopy switched to a true byte-copy by default,
    // either (a) the performance optimization was intentionally reverted — in which
    // case delete this test — or (b) something regressed and we lost ~40 s of build
    // time; investigate before deleting.
    //
    // IMPORTANT: stage a private source tree under TMP so mutating the destination
    // can't corrupt the git-tracked FIXTURES/ on a crash between the write and a
    // cleanup step. Everything under TMP is removed by afterEach.
    const src = resolve(TMP, 'contract-src/foo_dir');
    const srcFile = resolve(src, 'bar.txt');
    const destination = resolve(TMP, 'contract');
    mkdirSync(src, { recursive: true });
    writeFileSync(srcFile, 'ORIGINAL');

    await scanCopy({ source: resolve(TMP, 'contract-src'), destination });
    const dstFile = resolve(destination, 'foo_dir/bar.txt');

    // Unsafe mutation pattern: write new bytes through the dest path.
    writeFileSync(dstFile, 'MUTATED');
    expect(readFileSync(srcFile, 'utf8')).toBe('MUTATED');
  });
});
