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

// Three-tier fast-copy strategy (first that succeeds wins):
//   1. Reflink (CoW) via COPYFILE_FICLONE_FORCE — destinations are independent of the source
//      at the page level (writes on either side trigger a copy-on-write). Works on xfs w/
//      reflink=1 (RHEL 8+ default), btrfs, APFS. Fails fast with ENOTSUP on ext4 so we fall
//      through to hardlink without silently byte-copying.
//   2. Hardlink — shares the inode (~instant, no extra disk), but destinations MUST NOT be
//      mutated in-place; see HARDLINK CONTRACT below.
//   3. Byte copy — always works; used when both of the above fail (cross-filesystem,
//      permissions, ENOTSUP, etc.).
// OSD_BUILD_NO_HARDLINK=1 (optional) skips both fast paths and forces a plain byte copy.
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
 * ⚠ HARDLINK CONTRACT — applies only when the hardlink tier is used.
 *
 * Default copy order (no `time`, `OSD_BUILD_NO_HARDLINK` unset):
 *   1. **Reflink** via `COPYFILE_FICLONE_FORCE` on CoW filesystems (xfs w/ reflink=1,
 *      btrfs, APFS). Reflinked files are independent on the first write (copy-on-write),
 *      so in-place mutation of `dest` is SAFE and does NOT affect `source`.
 *   2. **Hardlink** when reflink isn't supported (ext4, cross-FS, etc.). Hardlinks share
 *      the inode — writing to `dest` with `fs.writeFile`, `sed -i`, `chmod`, `truncate`,
 *      etc. mutates the original source file too, and every sibling destination.
 *   3. **Byte copy** as the final fallback (linking failed entirely — `EXDEV`, `EPERM`,
 *      `EACCES`, `ENOTSUP`, etc.).
 *
 * Because tier 2 might be selected on ext4 / cross-FS runners, callers should treat
 * destinations as if they were hardlinks unless they're certain every target filesystem
 * is CoW. Safe and unsafe patterns:
 *
 * Safe downstream patterns:
 *   • Read-only operations (archiving, scanning, stat).
 *   • Delete-then-replace (`fs.unlink` + write new file) — `unlink` only decrements the
 *     link count, so the source copy is unaffected on both reflink and hardlink.
 *
 * Unsafe patterns (under hardlink tier only — safe under reflink, but don't rely on it):
 *   • In-place writes / chmods / truncations of copied files.
 *
 * If a caller genuinely needs to mutate copied files regardless of filesystem, either
 * pass `time` (disables both fast paths) or set `OSD_BUILD_NO_HARDLINK=1`.
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

  // See the three-tier strategy at the top of this file. We skip both fast paths when
  // `time` is provided (updating mtime on a hardlink mutates the source's mtime) or when
  // the caller opted out via OSD_BUILD_NO_HARDLINK. Note: reflink + utimes would actually
  // be safe (reflinked dest has an independent inode), but disabling both tiers together
  // keeps `shouldTryFast` a single flag; the `time` code path is rare enough that the
  // few hundred ms lost isn't worth splitting it.
  const shouldTryFast = !isHardlinkDisabled() && !time;
  let linkFallbackLogged = false;

  const copyFileOrLink = async (src: string, dest: string) => {
    if (shouldTryFast) {
      // Tier 1: reflink (CoW). FICLONE_FORCE errors with ENOTSUP on non-CoW filesystems
      // (ext4, NTFS, HFS+), so we fall through cleanly. Plain FICLONE would silently
      // byte-copy on those, which would be slower than the hardlink tier below.
      let reflinkCode: string | undefined;
      try {
        await copyFileAsync(
          src,
          dest,
          // eslint-disable-next-line no-bitwise
          Fs.constants.COPYFILE_FICLONE_FORCE | Fs.constants.COPYFILE_EXCL
        );
        return;
      } catch (err) {
        reflinkCode = (err as NodeJS.ErrnoException).code;
        if (reflinkCode === 'EEXIST') throw err;
        // Any other error (ENOTSUP on ext4/NTFS expected; also EXDEV, EPERM, etc.)
        // → try hardlink. The code is captured so the eventual fallback log reports
        // both reflink and hardlink reasons, not just the last one.
      }
      // Tier 2: hardlink.
      try {
        await linkAsync(src, dest);
        return;
      } catch (err) {
        const linkCode = (err as NodeJS.ErrnoException).code;
        // EEXIST means the destination really exists — preserve the original
        // COPYFILE_EXCL semantic by re-throwing rather than silently overwriting.
        if (linkCode === 'EEXIST') throw err;
        if (!linkFallbackLogged) {
          linkFallbackLogged = true;
          // Honest phrasing: reflink returning ENOTSUP is expected on non-CoW
          // filesystems (not a "failure" in the operator sense). Only call it out
          // as a failure when both tiers gave errors and we're actually degrading.
          const msg =
            `[scan_copy] fast-path copy failed ` +
            `(reflink=${reflinkCode || 'unknown'}, hardlink=${linkCode || 'unknown'}); ` +
            `falling back to byte copy. Set OSD_BUILD_NO_HARDLINK=1 to silence.`;
          if (log) log.warning(msg);
          else process.stderr.write(`${msg}\n`);
        }
      }
    }
    // Tier 3: byte copy.
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
