/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'events';
import { PassThrough } from 'stream';
import Path from 'path';
import Fs from 'fs';
import Os from 'os';

// Hoist-friendly mock factory: we replace child_process.spawn with a controllable fake.
// Each test sets `mockSpawnImpl` to describe how the "pigz" child should behave.
// Note: jest only permits factory references to outer variables prefixed with `mock`.
let mockSpawnImpl: (() => FakePigz) | null = null;
jest.mock('child_process', () => {
  const real = jest.requireActual('child_process');
  return {
    ...real,
    spawn: (...args: unknown[]) => {
      if (!mockSpawnImpl) return real.spawn(...(args as Parameters<typeof real.spawn>));
      return mockSpawnImpl();
    },
    // spawnSync drives hasPigz(); report success so the pigz path is always taken.
    spawnSync: () => ({ status: 0 }),
  };
});

// Helper: construct a fake pigz child with controllable stdio and exit.
class FakePigz extends EventEmitter {
  public stdin = new PassThrough();
  public stdout = new PassThrough();
  public stderr = new PassThrough();
  public killed = false;
  public kill = jest.fn((_signal?: string) => {
    this.killed = true;
    return true;
  });
  // Drain stdin so archiver's writes don't backpressure-block.
  constructor() {
    super();
    this.stdin.resume();
  }
  public simulateExit(code: number | null, signal: NodeJS.Signals | null = null) {
    // Close stdout to unblock any downstream pipe, then emit 'exit' like a real child.
    this.stdout.end();
    process.nextTick(() => this.emit('exit', code, signal));
  }
}

// Import AFTER the mock so fs.ts picks up the mocked spawn/spawnSync.
import { compressTar } from './fs';

const TMP = Path.resolve(Os.tmpdir(), `osd-fs-pigz-${process.pid}`);
const SRC = Path.resolve(TMP, 'src');
const DEST = Path.resolve(TMP, 'out.tar.gz');

beforeAll(() => {
  Fs.mkdirSync(SRC, { recursive: true });
  Fs.writeFileSync(Path.resolve(SRC, 'a.txt'), 'hello');
});

afterAll(() => {
  Fs.rmSync(TMP, { recursive: true, force: true });
});

beforeEach(() => {
  mockSpawnImpl = null;
  // Ensure OSD_BUILD_NO_PIGZ doesn't leak from another test.
  delete process.env.OSD_BUILD_NO_PIGZ;
  // Force hasPigz() to re-check spawnSync every call so our mock always wins.
  process.env.OSD_BUILD_FORCE_PIGZ_PROBE = '1';
});

afterEach(() => {
  delete process.env.OSD_BUILD_FORCE_PIGZ_PROBE;
  delete process.env.OSD_BUILD_PIGZ_STALL_MS;
  Fs.rmSync(DEST, { force: true });
});

const defaultOpts = {
  source: SRC,
  destination: DEST,
  archiverOptions: { gzip: true, gzipOptions: { level: 6 } },
  createRootDirectory: false,
};

it('rejects with pigz exit code and captured stderr', async () => {
  mockSpawnImpl = () => {
    const p = new FakePigz();
    process.nextTick(() => {
      p.stderr.write('pigz: invalid option\n');
      p.stderr.end();
      p.simulateExit(2);
    });
    return p;
  };

  await expect(compressTar(defaultOpts)).rejects.toThrow(
    /pigz exited with code 2:.*invalid option/s
  );
});

it('rejects with signal name when pigz is killed', async () => {
  mockSpawnImpl = () => {
    const p = new FakePigz();
    process.nextTick(() => p.simulateExit(null, 'SIGTERM'));
    return p;
  };

  await expect(compressTar(defaultOpts)).rejects.toThrow(/pigz exited with signal SIGTERM/);
});

it('rejects with a stall error and kills pigz when no output flows', async () => {
  // 150 ms stall threshold — well under jest's default 5s per-test timeout.
  process.env.OSD_BUILD_PIGZ_STALL_MS = '150';
  let capturedChild: FakePigz | undefined;
  mockSpawnImpl = () => {
    const p = new FakePigz();
    capturedChild = p;
    // Never emit data, never exit: simulate pigz hung.
    return p;
  };

  await expect(compressTar(defaultOpts)).rejects.toThrow(/pigz stalled/);
  expect(capturedChild?.kill).toHaveBeenCalledWith('SIGTERM');
}, 3000);

it('rejects when the source directory does not exist', async () => {
  mockSpawnImpl = () => {
    // Behave like a real pigz: drain stdin, copy through, exit 0. The failure must
    // come from archiver's directory walk, not from pigz.
    const p = new FakePigz();
    p.stdin.on('end', () => p.simulateExit(0));
    p.stdin.on('data', () => {
      /* discard */
    });
    return p;
  };

  await expect(
    compressTar({ ...defaultOpts, source: Path.resolve(TMP, 'does-not-exist') })
  ).rejects.toBeDefined();
});
