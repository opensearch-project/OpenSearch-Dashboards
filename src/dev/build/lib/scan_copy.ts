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
import { basename, join } from 'path';
import { promisify } from 'util';

import { ToolingLog } from '@osd/dev-utils';

// @ts-ignore
import { assertAbsolute, mkdirp } from './fs';

const statAsync = promisify(Fs.stat);
const mkdirAsync = promisify(Fs.mkdir);
const utimesAsync = promisify(Fs.utimes);
const copyFileAsync = promisify(Fs.copyFile);
const linkAsync = promisify(Fs.link);
const readdirAsync = promisify(Fs.readdir);

// Hardlinks share the inode so they're ~instant and use no extra disk. We fall back to a
// reflink-preferred copy if linking fails (cross-filesystem, permissions, etc.). Opt out
// entirely with OSD_BUILD_NO_HARDLINK=1 (optional) to force a full byte-for-byte copy.
// Read per-call (matching the other OSD_BUILD_* env vars) so operators/tests can flip it
// without needing a module reload.
const isHardlinkDisabled = () => process.env.OSD_BUILD_NO_HARDLINK === '1';

interface Options {
  /**
   * directory to copy from
   */
  source: string;
  /**
   * path to copy to
   */
  destination: string;
  /**
   * function that is called with each Record
   */
  filter?: (record: Record) => boolean;
  /**
   * Date to use for atime/mtime
   */
  time?: Date;
  /**
   * Optional logger. When set, the hardlink→copy fallback notice routes through
   * `log.warning` instead of writing a one-shot line to stderr.
   */
  log?: ToolingLog;
}

class Record {
  constructor(
    public isDirectory: boolean,
    public name: string,
    public absolute: string,
    public absoluteDest: string
  ) {}
}

/**
 * Copy all of the files from one directory to another, optionally filtered with a
 * function or modifying mtime/atime for each file.
 *
 * ⚠ HARDLINK CONTRACT — destination files MUST NOT be mutated in-place.
 *
 * By default (no `time` option, `OSD_BUILD_NO_HARDLINK` unset), each copied file is a
 * hardlink that shares its inode with the source. Writing to `dest` with `fs.writeFile`,
 * `sed -i`, `chmod`, `truncate`, etc. would therefore mutate the original source file
 * too — and, if multiple destinations were produced from the same source (e.g.
 * per-platform copies), every sibling destination.
 *
 * Safe downstream patterns:
 *   • Read-only operations (archiving, scanning, stat).
 *   • Delete-then-replace (`fs.unlink` + write new file) — `unlink` only decrements
 *     the link count, so the source copy is unaffected.
 *
 * Unsafe patterns:
 *   • In-place writes / chmods / truncations of copied files.
 *
 * If a caller genuinely needs to mutate copied files, either pass `time` (disables
 * linking) or set `OSD_BUILD_NO_HARDLINK=1`.
 */
export async function scanCopy(options: Options) {
  const { source, destination, filter, time, log } = options;

  assertAbsolute(source);
  assertAbsolute(destination);

  // get filtered Records for files/directories within a directory
  const getChildRecords = async (parent: Record) => {
    const names = await readdirAsync(parent.absolute);
    const records = await Promise.all(
      names.map(async (name) => {
        const absolute = join(parent.absolute, name);
        const stat = await statAsync(absolute);
        return new Record(stat.isDirectory(), name, absolute, join(parent.absoluteDest, name));
      })
    );

    return records.filter((record) => (filter ? filter(record) : true));
  };

  // create or copy each child of a directory
  const copyChildren = async (record: Record) => {
    const children = await getChildRecords(record);
    await Promise.all(children.map(async (child) => await copy(child)));
  };

  // Hardlink-preferred: hardlinks share the inode (no data copy, ~instant). We skip linking
  // when `time` is provided because updating mtime on a hardlink would also mutate the source's
  // mtime. Any failure (EXDEV, EPERM, EACCES, ENOTSUP, ...) falls back to a full byte copy.
  const shouldTryLink = !isHardlinkDisabled() && !time;
  let linkFallbackLogged = false;

  const copyFileOrLink = async (src: string, dest: string) => {
    if (shouldTryLink) {
      try {
        await linkAsync(src, dest);
        return;
      } catch (err) {
        const code = (err as NodeJS.ErrnoException).code;
        // EEXIST means the destination really exists — preserve the original
        // COPYFILE_EXCL semantic by re-throwing rather than silently overwriting.
        if (code === 'EEXIST') throw err;
        if (!linkFallbackLogged) {
          linkFallbackLogged = true;
          const msg =
            `[scan_copy] hardlink failed (${code || 'unknown'}); falling back to byte copy. ` +
            `Set OSD_BUILD_NO_HARDLINK=1 to silence.`;
          if (log) log.warning(msg);
          else process.stderr.write(`${msg}\n`);
        }
      }
    }
    await copyFileAsync(src, dest, Fs.constants.COPYFILE_EXCL);
  };

  // create or copy a record and recurse into directories
  const copy = async (record: Record) => {
    if (record.isDirectory) {
      await mkdirAsync(record.absoluteDest);
    } else {
      await copyFileOrLink(record.absolute, record.absoluteDest);
    }

    if (record.isDirectory) {
      await copyChildren(record);
    }

    if (time) {
      await utimesAsync(record.absoluteDest, time, time);
    }
  };

  await mkdirp(destination);
  await copyChildren(new Record(true, basename(source), source, destination));
}
