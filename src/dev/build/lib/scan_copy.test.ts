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

// Unit-level test for the three-tier copy ordering in scan_copy.ts.
// Unlike the integration test (which exercises the real filesystem and can only
// observe whichever tier happens to be chosen on the runner's FS), this test
// stubs fs.copyFile + fs.link via jest.mock so we can force each tier and
// assert the ordering — reflink (COPYFILE_FICLONE_FORCE) → hardlink → byte copy.

import Path from 'path';
import Os from 'os';

// Capture callbacks for each tier so individual tests can control outcomes.
interface State {
  reflinkSucceeds: boolean;
  hardlinkSucceeds: boolean;
  calls: Array<{ fn: 'copyFile' | 'link'; flags?: number }>;
}
const state: State = { reflinkSucceeds: true, hardlinkSucceeds: true, calls: [] };

jest.mock('fs', () => {
  const actual = jest.requireActual('fs');
  return {
    ...actual,
    copyFile: (src: string, dest: string, flags: number, cb: (err?: Error) => void) => {
      state.calls.push({ fn: 'copyFile', flags });
      // eslint-disable-next-line no-bitwise
      const isReflink = (flags & actual.constants.COPYFILE_FICLONE_FORCE) !== 0;
      if (isReflink && !state.reflinkSucceeds) {
        const err: NodeJS.ErrnoException = new Error('not supported');
        err.code = 'ENOTSUP';
        return cb(err);
      }
      // Strip FICLONE_FORCE so the real copy always works; keep EXCL.
      // eslint-disable-next-line no-bitwise
      actual.copyFile(src, dest, flags & actual.constants.COPYFILE_EXCL, cb);
    },
    link: (src: string, dest: string, cb: (err?: Error) => void) => {
      state.calls.push({ fn: 'link' });
      if (!state.hardlinkSucceeds) {
        const err: NodeJS.ErrnoException = new Error('cross-device');
        err.code = 'EXDEV';
        return cb(err);
      }
      actual.link(src, dest, cb);
    },
  };
});

// Import after jest.mock so scanCopy captures the mocked fs.

import Fs from 'fs';

import { scanCopy } from './scan_copy';

function stageSource() {
  const base = Fs.mkdtempSync(Path.join(Os.tmpdir(), 'osd-scan-copy-'));
  const src = Path.join(base, 'src');
  Fs.mkdirSync(src);
  Fs.writeFileSync(Path.join(src, 'a.txt'), 'a');
  return { base, src, dest: Path.join(base, 'dst') };
}

beforeEach(() => {
  state.reflinkSucceeds = true;
  state.hardlinkSucceeds = true;
  state.calls = [];
});

describe('scanCopy tier ordering', () => {
  it('tier 1: tries reflink first and skips hardlink on success', async () => {
    const { base, src, dest } = stageSource();
    try {
      state.reflinkSucceeds = true;
      await scanCopy({ source: src, destination: dest });
      expect(state.calls[0].fn).toBe('copyFile');
      // eslint-disable-next-line no-bitwise
      expect((state.calls[0].flags! & Fs.constants.COPYFILE_FICLONE_FORCE) !== 0).toBe(true);
      expect(state.calls.some((c) => c.fn === 'link')).toBe(false);
    } finally {
      Fs.rmSync(base, { recursive: true, force: true });
    }
  });

  it('tier 2: falls through to hardlink when reflink returns ENOTSUP', async () => {
    const { base, src, dest } = stageSource();
    try {
      state.reflinkSucceeds = false;
      state.hardlinkSucceeds = true;
      await scanCopy({ source: src, destination: dest });
      expect(state.calls[0].fn).toBe('copyFile');
      expect(state.calls[1].fn).toBe('link');
      // No tier-3 fallback copyFile should appear after the successful link.
      const extraCopy = state.calls.slice(2).find((c) => c.fn === 'copyFile');
      expect(extraCopy).toBeUndefined();
    } finally {
      Fs.rmSync(base, { recursive: true, force: true });
    }
  });

  it('tier 3: falls through to byte copy when reflink and hardlink both fail', async () => {
    const { base, src, dest } = stageSource();
    try {
      state.reflinkSucceeds = false;
      state.hardlinkSucceeds = false;
      await scanCopy({ source: src, destination: dest });
      expect(state.calls[0].fn).toBe('copyFile');
      // eslint-disable-next-line no-bitwise
      expect((state.calls[0].flags! & Fs.constants.COPYFILE_FICLONE_FORCE) !== 0).toBe(true);
      expect(state.calls[1].fn).toBe('link');
      expect(state.calls[2].fn).toBe('copyFile');
      // eslint-disable-next-line no-bitwise
      expect((state.calls[2].flags! & Fs.constants.COPYFILE_FICLONE_FORCE) === 0).toBe(true);
    } finally {
      Fs.rmSync(base, { recursive: true, force: true });
    }
  });
});
