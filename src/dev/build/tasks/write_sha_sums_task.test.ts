/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import Fs from 'fs';
import Os from 'os';
import Path from 'path';
import { createHash } from 'crypto';

import { WriteShaSums } from './write_sha_sums_task';

const TMP = Path.resolve(Os.tmpdir(), `osd-write-sha-sums-${process.pid}`);

const hash = (content: Uint8Array, algo: string) => createHash(algo).update(content).digest('hex');

beforeEach(() => {
  Fs.rmSync(TMP, { recursive: true, force: true });
  Fs.mkdirSync(TMP, { recursive: true });
});

afterAll(() => {
  Fs.rmSync(TMP, { recursive: true, force: true });
});

const makeConfig = () =>
  ({
    resolveFromTarget: (...sub: string[]) => Path.resolve(TMP, ...sub),
  } as any);

it('writes both sha1 and sha256 sidecar files whose contents match the artifact', async () => {
  const artifacts = [
    { name: 'osd.tar.gz', body: new TextEncoder().encode('tar contents') },
    { name: 'osd.zip', body: new TextEncoder().encode('zip contents') },
    { name: 'osd.deb', body: new TextEncoder().encode('deb contents') },
    { name: 'osd.rpm', body: new TextEncoder().encode('rpm contents') },
  ];
  for (const a of artifacts) {
    Fs.writeFileSync(Path.resolve(TMP, a.name), a.body);
  }

  await WriteShaSums.run!(makeConfig(), undefined as any, undefined as any);

  for (const a of artifacts) {
    const sha1File = Path.resolve(TMP, `${a.name}.sha1.txt`);
    const sha256File = Path.resolve(TMP, `${a.name}.sha256.txt`);
    expect(Fs.readFileSync(sha1File, 'utf8')).toBe(hash(a.body, 'sha1'));
    expect(Fs.readFileSync(sha256File, 'utf8')).toBe(hash(a.body, 'sha256'));
  }
});

it('does not create sidecar files for non-archive paths', async () => {
  Fs.writeFileSync(Path.resolve(TMP, 'README.md'), 'nope');
  Fs.writeFileSync(Path.resolve(TMP, 'real.tar.gz'), 'real');

  await WriteShaSums.run!(makeConfig(), undefined as any, undefined as any);

  expect(Fs.existsSync(Path.resolve(TMP, 'README.md.sha256.txt'))).toBe(false);
  expect(Fs.existsSync(Path.resolve(TMP, 'real.tar.gz.sha256.txt'))).toBe(true);
});
