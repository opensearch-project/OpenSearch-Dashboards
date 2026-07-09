/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import Os from 'os';
import Fs from 'fs';
import Path from 'path';

const TEST_OUT = Path.resolve(Os.tmpdir(), `osd-create-archives-${process.pid}`);

// Counters updated by the mocked archive functions so we can assert parallelism.
let mockInFlight = 0;
let mockPeakInFlight = 0;
const mockCallArgs: Array<{ fn: string; source: string; destination: string }> = [];

// Mock ../lib: keep everything real except compressTar/compressZip (so we don't touch disk)
// and mkdirp (so the destination dir check is a no-op).
jest.mock('../lib', () => {
  const real = jest.requireActual('../lib');
  // Require fs/path lazily inside the factory to avoid referencing outer bindings.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mockFs = require('fs');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mockPath = require('path');
  const fake = async (fn: 'tar' | 'zip', opts: { source: string; destination: string }) => {
    mockInFlight += 1;
    mockPeakInFlight = Math.max(mockPeakInFlight, mockInFlight);
    mockCallArgs.push({ fn, source: opts.source, destination: opts.destination });
    // Yield long enough that the parallel queue can start other workers.
    await new Promise((r) => setTimeout(r, 20));
    // Write a placeholder file so the post-archive asyncStat size probe succeeds.
    mockFs.mkdirSync(mockPath.dirname(opts.destination), { recursive: true });
    mockFs.writeFileSync(opts.destination, 'fake');
    mockInFlight -= 1;
    return 1; // fileCount
  };
  return {
    ...real,
    mkdirp: async () => {},
    compressTar: (opts: { source: string; destination: string }) => fake('tar', opts),
    compressZip: (opts: { source: string; destination: string }) => fake('zip', opts),
    // Keep hasPigz controllable via env so the concurrency default is predictable.
    hasPigz: () => process.env.__TEST_HAS_PIGZ === '1',
  };
});

// CiStats calls would try to report over the network — stub them out.
jest.mock('@osd/dev-utils', () => ({
  ...jest.requireActual('@osd/dev-utils'),
  CiStatsReporter: { fromEnv: () => ({ metrics: async () => {} }) },
}));

import { CreateArchives } from './create_archives_task';

interface Platform {
  getNodeArch: () => string;
}
const mockPlatforms = (n: number): Platform[] =>
  Array.from({ length: n }, (_, i) => ({ getNodeArch: () => `arch-${i}` }));

const makeConfig = (platforms: Platform[], isRelease = false) =>
  ({
    isRelease,
    getTargetPlatforms: () => platforms,
    getBuildVersion: () => '1.2.3',
    getBuildSha: () => 'abc',
    // Needed by CiStatsReporter.fromEnv path; our mock ignores this anyway.
    getRepoInfo: () => ({}),
  } as any);

const makeBuild = () =>
  ({
    resolvePathForPlatform: (p: Platform) => `/tmp/build/${p.getNodeArch()}`,
    getPlatformArchivePath: (p: Platform) =>
      p.getNodeArch() === 'arch-0'
        ? Path.resolve(TEST_OUT, `${p.getNodeArch()}.zip`)
        : Path.resolve(TEST_OUT, `${p.getNodeArch()}.tar.gz`),
    getName: () => 'opensearch-dashboards',
  } as any);

const log = {
  info: () => {},
  debug: () => {},
  warning: () => {},
  error: () => {},
  success: () => {},
  verbose: () => {},
  write: () => {},
  indent: () => {},
} as any;

beforeEach(() => {
  mockInFlight = 0;
  mockPeakInFlight = 0;
  mockCallArgs.length = 0;
  delete process.env.OSD_BUILD_ARCHIVE_CONCURRENCY;
  delete process.env.OSD_BUILD_GZIP_LEVEL;
  delete process.env.__TEST_HAS_PIGZ;
  Fs.rmSync(TEST_OUT, { recursive: true, force: true });
});

afterAll(() => {
  Fs.rmSync(TEST_OUT, { recursive: true, force: true });
});

it('archives every requested platform exactly once', async () => {
  const platforms = mockPlatforms(5);
  await CreateArchives.run(makeConfig(platforms), log, makeBuild());

  expect(mockCallArgs).toHaveLength(5);
  const archivedArches = mockCallArgs.map((c) => c.source.split('/').pop()).sort();
  expect(archivedArches).toEqual(['arch-0', 'arch-1', 'arch-2', 'arch-3', 'arch-4']);
  // arch-0 is our .zip case, rest are .tar.gz
  expect(mockCallArgs.filter((c) => c.fn === 'zip')).toHaveLength(1);
  expect(mockCallArgs.filter((c) => c.fn === 'tar')).toHaveLength(4);
});

it('honors the explicit OSD_BUILD_ARCHIVE_CONCURRENCY cap', async () => {
  process.env.OSD_BUILD_ARCHIVE_CONCURRENCY = '2';
  const platforms = mockPlatforms(5);
  await CreateArchives.run(makeConfig(platforms), log, makeBuild());

  expect(mockPeakInFlight).toBeLessThanOrEqual(2);
  expect(mockPeakInFlight).toBe(2); // proves it actually ran in parallel
});

it('caps default concurrency at 2 when pigz is available', async () => {
  process.env.__TEST_HAS_PIGZ = '1';
  const platforms = mockPlatforms(5);
  await CreateArchives.run(makeConfig(platforms), log, makeBuild());

  expect(mockPeakInFlight).toBeLessThanOrEqual(2);
});

it('uses up to cpuCount workers when pigz is not available', async () => {
  process.env.__TEST_HAS_PIGZ = '0';
  const platforms = mockPlatforms(5);
  await CreateArchives.run(makeConfig(platforms), log, makeBuild());

  // Ceiling is min(cpuCount, platforms.length). On a 1-vCPU runner the ceiling
  // is 1, so we assert peak is in [1, min(cpuCount,5)] rather than requiring ≥2.
  const cpuCount = Math.max(1, Os.cpus().length);
  expect(mockPeakInFlight).toBeGreaterThanOrEqual(1);
  expect(mockPeakInFlight).toBeLessThanOrEqual(Math.min(cpuCount, 5));
  // On >1-vCPU runners (all realistic CI), assert the task actually ran in parallel.
  if (cpuCount > 1) expect(mockPeakInFlight).toBeGreaterThanOrEqual(2);
});
