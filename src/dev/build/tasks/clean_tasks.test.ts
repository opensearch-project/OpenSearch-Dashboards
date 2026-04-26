/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import Fs from 'fs';
import { resolve } from 'path';

import del from 'del';

import { mkdirp, write } from '../lib/fs';
import { runCleanExtraBuildFilesImpl } from './clean_tasks';

const TMP = resolve(__dirname, '__tmp_clean_tasks__');
const NM = resolve(TMP, 'node_modules');

const touch = async (p: string, content = '') => {
  await mkdirp(resolve(p, '..'));
  await write(p, content);
};

beforeEach(async () => {
  await del(TMP);

  // Outside node_modules: only TypeScript patterns should be deleted.
  await touch(resolve(TMP, 'index.ts'));
  await touch(resolve(TMP, 'index.js'));
  await touch(resolve(TMP, 'tsconfig.json'));
  await touch(resolve(TMP, 'src/foo.tsx'));
  await touch(resolve(TMP, 'src/foo.js'));
  // These would be deleted by ExtraFiles regexes, but must NOT be deleted
  // outside node_modules to preserve OSD source.
  await touch(resolve(TMP, 'src/__tests__/keep.js'));
  await touch(resolve(TMP, 'src/docs/readme.md'));

  // Inside node_modules: both TypeScript and ExtraFiles patterns apply.
  await touch(resolve(NM, 'pkg/lib.js'));
  await touch(resolve(NM, 'pkg/lib.ts'));
  await touch(resolve(NM, 'pkg/lib.d.ts'));
  await touch(resolve(NM, 'pkg/__tests__/t.js'));
  await touch(resolve(NM, 'pkg/docs/readme.md'));
  await touch(resolve(NM, 'pkg/CHANGELOG.md'));
  await touch(resolve(NM, 'pkg/index.js.map'));
});

afterAll(async () => {
  await del(TMP);
});

const exists = (p: string) => Fs.existsSync(p);

it('deletes TypeScript sources inside and outside node_modules', async () => {
  await runCleanExtraBuildFilesImpl(TMP, NM);

  expect(exists(resolve(TMP, 'index.ts'))).toBe(false);
  expect(exists(resolve(TMP, 'tsconfig.json'))).toBe(false);
  expect(exists(resolve(TMP, 'src/foo.tsx'))).toBe(false);
  expect(exists(resolve(NM, 'pkg/lib.ts'))).toBe(false);
  expect(exists(resolve(NM, 'pkg/lib.d.ts'))).toBe(false);
});

it('deletes ExtraFiles patterns only inside node_modules', async () => {
  await runCleanExtraBuildFilesImpl(TMP, NM);

  // Deleted inside node_modules.
  expect(exists(resolve(NM, 'pkg/__tests__'))).toBe(false);
  expect(exists(resolve(NM, 'pkg/docs'))).toBe(false);
  expect(exists(resolve(NM, 'pkg/CHANGELOG.md'))).toBe(false);
  expect(exists(resolve(NM, 'pkg/index.js.map'))).toBe(false);

  // Preserved outside node_modules (identical patterns must NOT match OSD src).
  expect(exists(resolve(TMP, 'src/__tests__/keep.js'))).toBe(true);
  expect(exists(resolve(TMP, 'src/docs/readme.md'))).toBe(true);
});

it('preserves JS sources everywhere', async () => {
  await runCleanExtraBuildFilesImpl(TMP, NM);

  expect(exists(resolve(TMP, 'index.js'))).toBe(true);
  expect(exists(resolve(TMP, 'src/foo.js'))).toBe(true);
  expect(exists(resolve(NM, 'pkg/lib.js'))).toBe(true);
});

it('returns total number of deleted paths', async () => {
  const count = await runCleanExtraBuildFilesImpl(TMP, NM);
  // TS in root (3) + TS in nm (2) + extras in nm (4) = 9
  expect(count).toBe(9);
});
