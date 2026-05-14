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

import fs from 'fs';
import { rm } from 'fs/promises';
import { createHash } from 'crypto';
import { pipeline, Writable } from 'stream';
import { resolve, dirname, isAbsolute, sep } from 'path';
import { createGunzip } from 'zlib';
import { inspect, promisify } from 'util';

import { spawn, spawnSync } from 'child_process';

import archiver from 'archiver';
import * as StreamZip from 'node-stream-zip';
import vfs from 'vinyl-fs';
import File from 'vinyl';
import del from 'del';
import deleteEmpty from 'delete-empty';
import * as tar from 'tar';
import { ToolingLog } from '@osd/dev-utils';
import { standardize } from '@osd/cross-platform';

const pipelineAsync = promisify(pipeline);
const mkdirAsync = promisify(fs.mkdir);
const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);
const readdirAsync = promisify(fs.readdir);
const utimesAsync = promisify(fs.utimes);
const copyFileAsync = promisify(fs.copyFile);
const statAsync = promisify(fs.stat);

export function assertAbsolute(path: string) {
  if (!isAbsolute(path)) {
    throw new TypeError(
      'Please use absolute paths to keep things explicit. You probably want to use `build.resolvePath()` or `config.resolveFromRepo()`.'
    );
  }
}

export function isFileAccessible(path: string) {
  assertAbsolute(path);

  try {
    fs.accessSync(path);
    return true;
  } catch (e) {
    return false;
  }
}

function longInspect(value: any) {
  return inspect(value, {
    maxArrayLength: Infinity,
  });
}

export async function mkdirp(path: string) {
  assertAbsolute(path);
  await mkdirAsync(path, { recursive: true });
}

export async function write(path: string, contents: string) {
  assertAbsolute(path);
  await mkdirp(dirname(path));
  await writeFileAsync(path, contents);
}

export async function read(path: string) {
  assertAbsolute(path);
  return await readFileAsync(path, 'utf8');
}

export async function getChildPaths(path: string) {
  assertAbsolute(path);
  const childNames = await readdirAsync(path);
  return childNames.map((name) => resolve(path, name));
}

export async function deleteAll(patterns: string[], log: ToolingLog) {
  if (!Array.isArray(patterns)) {
    throw new TypeError('Expected patterns to be an array');
  }

  if (log) {
    log.debug('Deleting patterns:', longInspect(patterns));
  }

  for (const pattern of patterns) {
    assertAbsolute(pattern.startsWith('!') ? pattern.slice(1) : pattern);
  }

  // Doing a dry run to get a list but `rm` will do the actual deleting
  const filesToDelete = await del(patterns, {
    concurrency: 4,
    dryRun: true,
  });

  await Promise.all(
    filesToDelete.map(async (folder) => {
      if (process.platform === 'win32') {
        folder = standardize(folder, false, false, true); // extended long path
      }

      for (let i = 0; i < 3; i++) {
        try {
          await rm(folder, { force: true, recursive: true });
          return;
        } catch (err) {
          if (i === 2) throw err;
          log.debug(`Retry ${i + 1}/3 on ${folder}, waiting for 1000ms`);
          await new Promise((resolveSleep) => setTimeout(resolveSleep, 1000));
        }
      }
    })
  );

  if (log) {
    log.debug('Deleted %d files/directories', filesToDelete.length);
    log.verbose('Deleted:', longInspect(filesToDelete));
  }
}

export async function deleteEmptyFolders(
  log: ToolingLog,
  rootFolderPath: string,
  foldersToKeep: string[]
) {
  if (typeof rootFolderPath !== 'string') {
    throw new TypeError('Expected root folder to be a string path');
  }

  log.debug(
    'Deleting all empty folders and their children recursively starting on ',
    rootFolderPath
  );
  assertAbsolute(rootFolderPath.startsWith('!') ? rootFolderPath.slice(1) : rootFolderPath);

  // `deleteEmpty` is used to gather all the empty folders then `rm` is used to actually delete them
  const emptyFoldersList = await deleteEmpty(rootFolderPath, {
    // @ts-expect-error DT package has incorrect types https://github.com/jonschlinkert/delete-empty/blob/6ae34547663e6845c3c98b184c606fa90ef79c0a/index.js#L160
    dryRun: true,
  });

  const foldersToDelete = Array.isArray(emptyFoldersList)
    ? emptyFoldersList.filter((folderToDelete: string[]) => {
        return !foldersToKeep.some((folderToKeep) => folderToDelete.includes(folderToKeep));
      })
    : [];

  await Promise.all(
    foldersToDelete.map(async (folder) => {
      if (process.platform === 'win32') {
        folder = standardize(folder, false, false, true); // extended long path
      }

      for (let i = 0; i < 3; i++) {
        try {
          await rm(folder, { force: true, recursive: true });
          return;
        } catch (err) {
          if (i === 2) throw err;
          log.debug(`Retry ${i + 1}/3 on ${folder}, waiting for 1000ms`);
          await new Promise((resolveSleep) => setTimeout(resolveSleep, 1000));
        }
      }
    })
  );

  log.debug('Deleted %d empty folders', foldersToDelete.length);
  log.verbose('Deleted:', longInspect(foldersToDelete));
}

interface CopyOptions {
  clone?: boolean;
}
export async function copy(source: string, destination: string, options: CopyOptions = {}) {
  assertAbsolute(source);
  assertAbsolute(destination);

  // ensure source exists before creating destination directory and copying source
  await statAsync(source);
  await mkdirp(dirname(destination));
  return await copyFileAsync(
    source,
    destination,
    options.clone ? fs.constants.COPYFILE_FICLONE : 0
  );
}

interface CopyAllOptions {
  select?: string[];
  dot?: boolean;
  time?: string | number | Date;
}

export async function copyAll(
  sourceDir: string,
  destination: string,
  options: CopyAllOptions = {}
) {
  const { select = ['**/*'], dot = false, time = Date.now() / 1000 } = options;

  assertAbsolute(sourceDir);
  assertAbsolute(destination);

  await pipelineAsync(
    vfs.src(select, {
      buffer: false,
      cwd: sourceDir,
      base: sourceDir,
      dot,
    }),
    vfs.dest(destination)
  );

  // we must update access and modified file times after the file copy
  // has completed, otherwise the copy action can effect modify times.
  if (Boolean(time)) {
    await pipelineAsync(
      vfs.src(select, {
        buffer: false,
        cwd: destination,
        base: destination,
        dot,
      }),
      new Writable({
        objectMode: true,
        write(file: File, _, cb) {
          utimesAsync(file.path, time, time).then(() => cb(), cb);
        },
      })
    );
  }
}

export async function getFileHash(path: string, algo: string) {
  assertAbsolute(path);

  const hash = createHash(algo);
  const readStream = fs.createReadStream(path);
  await new Promise((res, rej) => {
    readStream
      // @ts-expect-error TS2345 TODO(ts-upgrade): fixme
      .on('data', (chunk) => hash.update(chunk))
      .on('error', rej)
      .on('end', res);
  });

  return hash.digest('hex');
}

// Compute multiple digests from a single read-pass over `path`. Avoids the 2× disk I/O
// that `await getFileHash(p,'sha1'); await getFileHash(p,'sha256')` would cost per file.
export async function getFileHashes<A extends string>(
  path: string,
  algos: readonly A[]
): Promise<Record<A, string>> {
  assertAbsolute(path);

  const hashes = algos.map((algo) => createHash(algo));
  const readStream = fs.createReadStream(path);
  await new Promise((res, rej) => {
    readStream
      // @ts-expect-error TS2345 TODO(ts-upgrade): fixme — matches getFileHash pattern
      .on('data', (chunk) => hashes.forEach((h) => h.update(chunk)))
      .on('error', rej)
      .on('end', res);
  });

  const out = {} as Record<A, string>;
  algos.forEach((algo, i) => {
    out[algo] = hashes[i].digest('hex');
  });
  return out;
}

export async function untar(source: string, destination: string, extractOptions = {}) {
  assertAbsolute(source);
  assertAbsolute(destination);

  await mkdirAsync(destination, { recursive: true });

  await pipelineAsync(
    fs.createReadStream(source),
    createGunzip(),
    // @ts-expect-error TS2769 TODO(ts-upgrade): fixme
    tar.extract({
      ...extractOptions,
      cwd: destination,
    })
  );
}

export async function gunzip(source: string, destination: string) {
  assertAbsolute(source);
  assertAbsolute(destination);

  await mkdirAsync(dirname(destination), { recursive: true });

  await pipelineAsync(
    fs.createReadStream(source),
    createGunzip(),
    fs.createWriteStream(destination)
  );
}

interface UnzipOptions {
  strip?: boolean | number;
}

export async function unzip(source: string, destination: string, options: UnzipOptions) {
  assertAbsolute(source);
  assertAbsolute(destination);

  await mkdirAsync(destination, { recursive: true });

  const zip = new StreamZip.async({ file: source });

  if (!options.strip || !isFinite(options.strip as number)) {
    // Extract the entire archive
    await zip.extract(null, destination);
  } else {
    const stripLevels = options.strip === true ? 1 : options.strip;

    // Find the directories that are `stripLevels` deep and extract them only
    for (const entry of Object.values(await zip.entries())) {
      if (!entry.isDirectory) continue;

      const pathDepth = entry.name.replace(/\/+$/, '').split('/').length;
      if (stripLevels === pathDepth) {
        await zip.extract(entry.name, destination);
      }
    }
  }

  await zip.close();
}

interface CompressTarOptions {
  createRootDirectory: boolean;
  source: string;
  destination: string;
  archiverOptions?: archiver.TarOptions & archiver.CoreOptions;
  log?: ToolingLog;
}

let pigzAvailable: boolean | undefined;
const probePigz = () => spawnSync('pigz', ['--version']).status === 0;
export const hasPigz = () => {
  if (process.env.OSD_BUILD_NO_PIGZ === '1') return false;
  // Respect a test-side override first; otherwise cache the probe for the process lifetime.
  if (process.env.OSD_BUILD_FORCE_PIGZ_PROBE === '1') return probePigz();
  if (pigzAvailable === undefined) pigzAvailable = probePigz();
  return pigzAvailable;
};
// Stall timeout: if pigz neither emits output nor exits for this long, fail loudly
// so operators see a useful error instead of a hung build. Read per-call so tests
// (and operators) can override via OSD_BUILD_PIGZ_STALL_MS without re-importing.
const getPigzStallMs = () => Number(process.env.OSD_BUILD_PIGZ_STALL_MS) || 5 * 60 * 1000;

export async function compressTar({
  source,
  destination,
  archiverOptions,
  createRootDirectory,
  log,
}: CompressTarOptions) {
  // Fail-fast if source is missing so operators get a clean ENOENT instead of a silently
  // empty archive (archiver's directory walker tolerates missing dirs).
  await statAsync(source);
  const useGzip = !!archiverOptions?.gzip;
  const usingPigz = useGzip && hasPigz();
  log?.debug(
    `compressTar: ${destination} — ${useGzip ? (usingPigz ? 'pigz' : 'Node zlib') : 'no gzip'}`
  );
  const output = fs.createWriteStream(destination);

  // When gzipping, prefer pigz (parallel gzip) if available — output is standard gzip,
  // readable by any gunzip. Set OSD_BUILD_NO_PIGZ=1 to force pure Node path.
  if (usingPigz) {
    const level = archiverOptions?.gzipOptions?.level ?? 6;
    const threads = Number(process.env.OSD_BUILD_PIGZ_THREADS);
    const args = [`-${level}`, '-c'];
    if (Number.isInteger(threads) && threads >= 1) args.unshift('-p', String(threads));

    const pigz = spawn('pigz', args, { stdio: ['pipe', 'pipe', 'pipe'] });
    const archive = archiver('tar', { ...archiverOptions, gzip: false });
    const name = createRootDirectory ? source.split(sep).slice(-1)[0] : false;

    let fileCount = 0;
    archive.on('entry', (entry) => {
      if (entry.stats?.isFile()) fileCount += 1;
    });

    const stderrChunks: Uint8Array[] = [];
    // Cap stderr accumulation so a pathologically-chatty pigz can't OOM the build.
    let stderrBytes = 0;
    const STDERR_LIMIT = 64 * 1024;
    pigz.stderr.on('data', (chunk) => {
      if (stderrBytes >= STDERR_LIMIT) return;
      stderrBytes += chunk.length;
      stderrChunks.push(chunk);
    });

    const done = new Promise<void>((resolveDone, reject) => {
      let settled = false;
      let stallTimer: NodeJS.Timeout | undefined;
      const clearStall = () => {
        if (stallTimer) clearTimeout(stallTimer);
        stallTimer = undefined;
      };
      const fail = (err: Error) => {
        if (settled) return;
        settled = true;
        clearStall();
        // Archiver's documented cancel: abort() stops the entry walker and emits 'close'.
        try {
          archive.abort();
        } catch {
          /* noop */
        }
        try {
          pigz.kill('SIGTERM');
        } catch {
          /* noop */
        }
        output.destroy(err);
        reject(err);
      };
      const armStall = () => {
        clearStall();
        const stallMs = getPigzStallMs();
        stallTimer = setTimeout(() => {
          fail(
            new Error(
              `pigz stalled — no output for ${stallMs} ms (set OSD_BUILD_NO_PIGZ=1 to bypass)`
            )
          );
        }, stallMs);
      };

      archive.on('error', (e) => fail(e));
      pigz.stdin.on('error', (e) => {
        // EPIPE means pigz closed its stdin (e.g. it died); the pigz 'exit' handler
        // will produce the useful error. Swallow here to avoid a generic EPIPE.
        if ((e as NodeJS.ErrnoException).code !== 'EPIPE') fail(e);
      });
      pigz.stdout.on('error', (e) => fail(e));
      pigz.on('error', (e) => fail(e));
      output.on('error', (e) => fail(e));

      // Any forward progress (new bytes flushed to the archive) resets the stall timer.
      output.on('drain', armStall);
      pigz.stdout.on('data', armStall);

      pigz.on('exit', (code, signal) => {
        if (code === 0) return; // wait for output 'close'
        const detail = Buffer.concat(stderrChunks).toString('utf8').trim();
        const reason = signal ? `signal ${signal}` : `code ${code}`;
        fail(new Error(`pigz exited with ${reason}${detail ? `: ${detail}` : ''}`));
      });

      output.on('close', () => {
        if (settled) return;
        settled = true;
        clearStall();
        resolveDone();
      });
      armStall();
    });

    archive.pipe(pigz.stdin);
    pigz.stdout.pipe(output);

    // Start walking the source tree. finalize() resolves when archiver has flushed
    // all entries into pigz.stdin, but the pipeline isn't done until output 'close'
    // fires (see `done` above). If finalize rejects with anything archiver hasn't
    // already emitted as 'error', re-emit so the fail() path still sees it.
    archive.directory(source, name);
    archive.finalize().catch((e) => archive.emit('error', e));

    await done;
    return fileCount;
  }

  const archive = archiver('tar', archiverOptions);
  const name = createRootDirectory ? source.split(sep).slice(-1)[0] : false;

  archive.pipe(output);

  let fileCount = 0;
  archive.on('entry', (entry) => {
    if (entry.stats?.isFile()) {
      fileCount += 1;
    }
  });

  await archive.directory(source, name).finalize();

  return fileCount;
}

interface CompressZipOptions {
  createRootDirectory: boolean;
  source: string;
  destination: string;
  archiverOptions?: archiver.ZipOptions & archiver.CoreOptions;
}
export async function compressZip({
  source,
  destination,
  archiverOptions,
  createRootDirectory,
}: CompressZipOptions) {
  // Match compressTar: fail-fast on missing source for a clean ENOENT instead of a
  // silently empty archive. (No pigz-style parallel zip exists, so the rest of this
  // function is intentionally untouched.)
  await statAsync(source);
  const output = fs.createWriteStream(destination);
  const archive = archiver('zip', archiverOptions);
  const name = createRootDirectory ? source.split(sep).slice(-1)[0] : false;

  archive.pipe(output);

  let fileCount = 0;
  archive.on('entry', (entry) => {
    if (entry.stats?.isFile()) {
      fileCount += 1;
    }
  });

  await archive.directory(source, name).finalize();

  return fileCount;
}

export function normalizePath(loc: string) {
  return sep === '\\' ? loc.replace(/\\/g, '/') : loc;
}
