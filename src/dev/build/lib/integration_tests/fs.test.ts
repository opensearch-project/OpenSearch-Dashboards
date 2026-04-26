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

import { resolve } from 'path';
import { chmodSync, statSync } from 'fs';

import del from 'del';

import {
  mkdirp,
  write,
  read,
  getChildPaths,
  copyAll,
  getFileHash,
  untar,
  gunzip,
  compressTar,
  hasPigz,
} from '../fs';
import { PROCESS_WORKING_DIR } from '@osd/cross-platform';

const TMP = resolve(__dirname, '../__tmp__');
const FIXTURES = resolve(__dirname, '../__fixtures__');
const FOO_TAR_PATH = resolve(FIXTURES, 'foo_dir.tar.gz');
const FOO_GZIP_PATH = resolve(FIXTURES, 'foo.txt.gz');
const BAR_TXT_PATH = resolve(FIXTURES, 'foo_dir/bar.txt');
const WORLD_EXECUTABLE = resolve(FIXTURES, 'bin/world_executable');

const isWindows = /^win/.test(process.platform);

// get the mode of a file as a string, like 777, or 644,
function getCommonMode(path: string) {
  return statSync(path).mode.toString(8).slice(-3);
}

function assertNonAbsoluteError(error: any) {
  expect(error).toBeInstanceOf(Error);
  expect(error.message).toContain('Please use absolute paths');
}

// ensure WORLD_EXECUTABLE is actually executable by all
beforeAll(async () => {
  chmodSync(WORLD_EXECUTABLE, 0o777);
});

// clean and recreate TMP directory
beforeEach(async () => {
  await del(TMP, { cwd: PROCESS_WORKING_DIR });
  await mkdirp(TMP);
});

// cleanup TMP directory
afterAll(async () => {
  await del(TMP, { cwd: PROCESS_WORKING_DIR });
});

describe('mkdirp()', () => {
  it('rejects if path is not absolute', async () => {
    try {
      await mkdirp('foo/bar');
      throw new Error('Expected mkdirp() to reject');
    } catch (error) {
      assertNonAbsoluteError(error);
    }
  });

  it('makes directory and necessary parent directories', async () => {
    const destination = resolve(TMP, 'a/b/c/d/e/f/g');

    expect(await mkdirp(destination)).toBe(undefined);

    expect(statSync(destination).isDirectory()).toBe(true);
  });
});

describe('write()', () => {
  it('rejects if path is not absolute', async () => {
    try {
      // @ts-expect-error missing content intentional
      await write('foo/bar');
      throw new Error('Expected write() to reject');
    } catch (error) {
      assertNonAbsoluteError(error);
    }
  });

  it('writes content to a file with existing parent directory', async () => {
    const destination = resolve(TMP, 'a');

    expect(await write(destination, 'bar')).toBe(undefined);
    expect(await read(destination)).toBe('bar');
  });

  it('writes content to a file with missing parents', async () => {
    const destination = resolve(TMP, 'a/b/c/d/e');

    expect(await write(destination, 'bar')).toBe(undefined);
    expect(await read(destination)).toBe('bar');
  });
});

describe('read()', () => {
  it('rejects if path is not absolute', async () => {
    try {
      await read('foo/bar');
      throw new Error('Expected read() to reject');
    } catch (error) {
      assertNonAbsoluteError(error);
    }
  });

  it('reads file, resolves with result', async () => {
    expect(await read(BAR_TXT_PATH)).toBe('bar\n');
  });
});

describe('getChildPaths()', () => {
  it('rejects if path is not absolute', async () => {
    try {
      await getChildPaths('foo/bar');
      throw new Error('Expected getChildPaths() to reject');
    } catch (error) {
      assertNonAbsoluteError(error);
    }
  });

  it('resolves with absolute paths to the children of directory', async () => {
    const path = resolve(FIXTURES, 'foo_dir');
    expect((await getChildPaths(path)).sort()).toEqual([
      resolve(FIXTURES, 'foo_dir/.bar'),
      BAR_TXT_PATH,
      resolve(FIXTURES, 'foo_dir/foo'),
    ]);
  });

  it('rejects with ENOENT if path does not exist', async () => {
    try {
      await getChildPaths(resolve(FIXTURES, 'notrealpath'));
      throw new Error('Expected getChildPaths() to reject');
    } catch (error) {
      expect(error).toHaveProperty('code', 'ENOENT');
    }
  });
});

describe('copyAll()', () => {
  it('rejects if source path is not absolute', async () => {
    try {
      await copyAll('foo/bar', __dirname);
      throw new Error('Expected copyAll() to reject');
    } catch (error) {
      assertNonAbsoluteError(error);
    }
  });

  it('rejects if destination path is not absolute', async () => {
    try {
      await copyAll(__dirname, 'foo/bar');
      throw new Error('Expected copyAll() to reject');
    } catch (error) {
      assertNonAbsoluteError(error);
    }
  });

  it('rejects if neither path is not absolute', async () => {
    try {
      await copyAll('foo/bar', 'foo/bar');
      throw new Error('Expected copyAll() to reject');
    } catch (error) {
      assertNonAbsoluteError(error);
    }
  });

  it.skip('copies files and directories from source to dest, creating dest if necessary, respecting mode', async () => {
    const path777 = resolve(FIXTURES, 'bin/world_executable');
    const path644 = resolve(FIXTURES, 'foo_dir/bar.txt');

    // we're seeing flaky failures because the resulting files sometimes have
    // 755 permissions. Unless there's a bug in vinyl-fs I can't figure out
    // where the issue might be, so trying to validate the mode first to narrow
    // down where the issue might be
    expect(getCommonMode(path777)).toBe(isWindows ? '666' : '777');
    expect(getCommonMode(path644)).toBe(isWindows ? '666' : '644');

    const destination = resolve(TMP, 'a/b/c');
    await copyAll(FIXTURES, destination);

    expect((await getChildPaths(resolve(destination, 'foo_dir'))).sort()).toEqual([
      resolve(destination, 'foo_dir/bar.txt'),
      resolve(destination, 'foo_dir/foo'),
    ]);

    expect(getCommonMode(path777)).toBe(isWindows ? '666' : '777');
    expect(getCommonMode(path644)).toBe(isWindows ? '666' : '644');
  });

  it('applies select globs if specified, ignores dot files', async () => {
    const destination = resolve(TMP, 'a/b/c/d');
    await copyAll(FIXTURES, destination, {
      select: ['**/*bar*'],
    });

    try {
      statSync(resolve(destination, 'bin/world_executable'));
      throw new Error('expected bin/world_executable to not by copied');
    } catch (error) {
      expect(error).toHaveProperty('code', 'ENOENT');
    }

    try {
      statSync(resolve(destination, 'foo_dir/.bar'));
      throw new Error('expected foo_dir/.bar to not by copied');
    } catch (error) {
      expect(error).toHaveProperty('code', 'ENOENT');
    }

    expect(await read(resolve(destination, 'foo_dir/bar.txt'))).toBe('bar\n');
  });

  it('supports select globs and dot option together', async () => {
    const destination = resolve(TMP, 'a/b/c/d');
    await copyAll(FIXTURES, destination, {
      select: ['**/*bar*'],
      dot: true,
    });

    try {
      statSync(resolve(destination, 'bin/world_executable'));
      throw new Error('expected bin/world_executable to not by copied');
    } catch (error) {
      expect(error).toHaveProperty('code', 'ENOENT');
    }

    expect(await read(resolve(destination, 'foo_dir/bar.txt'))).toBe('bar\n');
    expect(await read(resolve(destination, 'foo_dir/.bar'))).toBe('dotfile\n');
  });

  it('supports atime and mtime', async () => {
    const destination = resolve(TMP, 'a/b/c/d/e');
    const time = new Date(1425298511000);
    await copyAll(FIXTURES, destination, {
      time,
    });
    const barTxt = statSync(resolve(destination, 'foo_dir/bar.txt'));
    const fooDir = statSync(resolve(destination, 'foo_dir'));

    // precision is platform specific
    const oneDay = 86400000;
    expect(Math.abs(barTxt.atimeMs - time.getTime())).toBeLessThan(oneDay);
    expect(Math.abs(fooDir.atimeMs - time.getTime())).toBeLessThan(oneDay);
    expect(Math.abs(barTxt.mtimeMs - time.getTime())).toBeLessThan(oneDay);
  });
});

describe('getFileHash()', () => {
  it('rejects if path is not absolute', async () => {
    try {
      await getFileHash('foo/bar', 'some content');
      throw new Error('Expected getFileHash() to reject');
    } catch (error) {
      assertNonAbsoluteError(error);
    }
  });

  it('resolves with the sha1 hash of a file', async () => {
    expect(await getFileHash(BAR_TXT_PATH, 'sha1')).toBe(
      'e242ed3bffccdf271b7fbaf34ed72d089537b42f'
    );
  });
  it('resolves with the sha256 hash of a file', async () => {
    expect(await getFileHash(BAR_TXT_PATH, 'sha256')).toBe(
      '7d865e959b2466918c9863afca942d0fb89d7c9ac0c99bafc3749504ded97730'
    );
  });
  it('resolves with the md5 hash of a file', async () => {
    expect(await getFileHash(BAR_TXT_PATH, 'md5')).toBe('c157a79031e1c40f85931829bc5fc552');
  });
});

describe('untar()', () => {
  it('rejects if source path is not absolute', async () => {
    try {
      await untar('foo/bar', '**/*');
      throw new Error('Expected untar() to reject');
    } catch (error) {
      assertNonAbsoluteError(error);
    }
  });

  it('rejects if destination path is not absolute', async () => {
    try {
      await untar(__dirname, '**/*');
      throw new Error('Expected untar() to reject');
    } catch (error) {
      assertNonAbsoluteError(error);
    }
  });

  it('rejects if neither path is not absolute', async () => {
    try {
      await untar('foo/bar', '**/*');
      throw new Error('Expected untar() to reject');
    } catch (error) {
      assertNonAbsoluteError(error);
    }
  });

  it('extracts tarbar from source into destination, creating destination if necessary', async () => {
    const destination = resolve(TMP, 'a/b/c/d/e/f');
    await untar(FOO_TAR_PATH, destination);
    expect(await read(resolve(destination, 'foo_dir/bar.txt'))).toBe('bar\n');
    expect(await read(resolve(destination, 'foo_dir/foo/foo.txt'))).toBe('foo\n');
  });

  it('passed thrid argument to Extract class, overriding path with destination', async () => {
    const destination = resolve(TMP, 'a/b/c');

    await untar(FOO_TAR_PATH, destination, {
      path: '/dev/null',
      strip: 1,
    });

    expect(await read(resolve(destination, 'bar.txt'))).toBe('bar\n');
    expect(await read(resolve(destination, 'foo/foo.txt'))).toBe('foo\n');
  });
});

describe('gunzip()', () => {
  it('rejects if source path is not absolute', async () => {
    try {
      await gunzip('foo/bar', '**/*');
      throw new Error('Expected gunzip() to reject');
    } catch (error) {
      assertNonAbsoluteError(error);
    }
  });

  it('rejects if destination path is not absolute', async () => {
    try {
      await gunzip(__dirname, '**/*');
      throw new Error('Expected gunzip() to reject');
    } catch (error) {
      assertNonAbsoluteError(error);
    }
  });

  it('rejects if neither path is not absolute', async () => {
    try {
      await gunzip('foo/bar', '**/*');
      throw new Error('Expected gunzip() to reject');
    } catch (error) {
      assertNonAbsoluteError(error);
    }
  });

  it('extracts gzip from source into destination, creating destination if necessary', async () => {
    const destination = resolve(TMP, 'z/y/x/v/u/t/foo.txt');
    await gunzip(FOO_GZIP_PATH, destination);
    expect(await read(resolve(destination))).toBe('foo\n');
  });
});

describe('compressTar() pigz roundtrip', () => {
  const srcDir = resolve(TMP, 'compress_src');

  const setupSource = async () => {
    await mkdirp(srcDir);
    // include one small and one larger file so pigz parallel blocks exercise multi-thread
    await write(resolve(srcDir, 'small.txt'), 'hello world\n');
    await write(resolve(srcDir, 'big.txt'), 'x'.repeat(200 * 1024));
    await mkdirp(resolve(srcDir, 'sub'));
    await write(resolve(srcDir, 'sub/nested.txt'), 'nested\n');
  };

  it('produces standard gzip that is byte-identical after extraction under both paths', async () => {
    // Skip loudly when pigz isn't on PATH — otherwise this test silently degenerates
    // into Node-vs-Node which doesn't actually validate the pigz code path.
    if (!hasPigz()) {
      // eslint-disable-next-line no-console
      console.warn(
        '[pigz roundtrip] pigz not on PATH; skipping. Install pigz to exercise the parallel-gzip path.'
      );
      return;
    }
    await del([TMP]);
    await setupSource();

    const pigzDest = resolve(TMP, 'out-pigz.tar.gz');
    const nodeDest = resolve(TMP, 'out-node.tar.gz');

    // Pigz path.
    delete process.env.OSD_BUILD_NO_PIGZ;
    const pigzCount = await compressTar({
      source: srcDir,
      destination: pigzDest,
      archiverOptions: { gzip: true, gzipOptions: { level: 6 } },
      createRootDirectory: true,
    });

    // Force Node gzip path.
    process.env.OSD_BUILD_NO_PIGZ = '1';
    try {
      const nodeCount = await compressTar({
        source: srcDir,
        destination: nodeDest,
        archiverOptions: { gzip: true, gzipOptions: { level: 6 } },
        createRootDirectory: true,
      });
      expect(pigzCount).toBe(3);
      expect(nodeCount).toBe(3);
    } finally {
      delete process.env.OSD_BUILD_NO_PIGZ;
    }

    // Both archives must be valid gzip + tar, and extract to byte-identical trees.
    const pigzOut = resolve(TMP, 'extract-pigz');
    const nodeOut = resolve(TMP, 'extract-node');
    await mkdirp(pigzOut);
    await mkdirp(nodeOut);
    await untar(pigzDest, pigzOut);
    await untar(nodeDest, nodeOut);

    const pigzHash = await getFileHash(resolve(pigzOut, 'compress_src/big.txt'), 'sha256');
    const nodeHash = await getFileHash(resolve(nodeOut, 'compress_src/big.txt'), 'sha256');
    expect(pigzHash).toBe(nodeHash);
    expect(await read(resolve(pigzOut, 'compress_src/small.txt'))).toBe('hello world\n');
    expect(await read(resolve(nodeOut, 'compress_src/small.txt'))).toBe('hello world\n');
    expect(await read(resolve(pigzOut, 'compress_src/sub/nested.txt'))).toBe('nested\n');
  });
});
