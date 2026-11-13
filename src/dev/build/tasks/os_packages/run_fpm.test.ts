/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ToolingLog } from '@osd/dev-utils';

import { runFpm } from './run_fpm';

jest.mock('../../lib/exec', () => ({ exec: jest.fn() }));
const { exec } = jest.requireMock('../../lib/exec');

const config = {
  getPlatform: jest.fn(() => ({})),
  getBuildVersion: () => '3.0.0',
  resolveFromTarget: (path: string) => `/target/${path}`,
  resolveFromRepo: (path: string) => `/repo/${path}`,
};
const build = { resolvePathForPlatform: (_: unknown, ...paths: string[]) => paths.join('/') };

const fpmArgs = async (type: 'rpm' | 'deb') => {
  exec.mockClear();
  await runFpm(config as any, new ToolingLog(), build as any, type, 'x64', []);
  return exec.mock.calls[0][2] as string[];
};

it.each([
  ['rpm', 'libatomic'],
  ['deb', 'libatomic1'],
] as const)(
  'makes the %s package depend on %s, which the bundled Node.js links',
  async (type, pkg) => {
    const args = await fpmArgs(type);
    expect(args[args.indexOf('--depends') + 1]).toBe(pkg);
  }
);
