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

import { createHash } from 'crypto';
import Fs from 'fs';
import Os from 'os';
import Path from 'path';
import Zlib from 'zlib';

import { ResolvedCdnConfig } from './cdn_config';
import { buildDeployPlan } from './plan';
import { computeIntegrity } from '../registry/generate';

const CDN: ResolvedCdnConfig = {
  bucket: 'test-bucket',
  region: 'us-west-2',
  baseUrl: 'https://cdn.example.net',
  keyPrefix: 'mfe',
  distributionId: 'EDIST123',
  domain: 'cdn.example.net',
};

/** Materialise a fake repo with built remotes + shared-deps; return its root. */
function makeFixtureRepo(remotes: Record<string, Record<string, string>>): string {
  const root = Fs.mkdtempSync(Path.join(Os.tmpdir(), 'mfe-deploy-plan-'));
  Fs.writeFileSync(Path.join(root, 'package.json'), JSON.stringify({ version: '3.5.0' }), 'utf8');

  const mfeDir = Path.join(root, 'target', 'mfe');
  for (const [id, files] of Object.entries(remotes)) {
    const dir = Path.join(mfeDir, id);
    Fs.mkdirSync(dir, { recursive: true });
    for (const [name, contents] of Object.entries(files)) {
      Fs.writeFileSync(Path.join(dir, name), contents, 'utf8');
    }
  }

  const sharedDir = Path.join(root, 'packages', 'osd-ui-shared-deps', 'target');
  Fs.mkdirSync(Path.join(sharedDir, 'fonts'), { recursive: true });
  Fs.writeFileSync(Path.join(sharedDir, 'osd-ui-shared-deps.js'), 'shared', 'utf8');
  Fs.writeFileSync(Path.join(sharedDir, 'fonts', 'a.woff2'), 'font', 'utf8');

  return root;
}

function sha12(text: string): string {
  return createHash('sha256').update(Buffer.from(text, 'utf8')).digest('hex').slice(0, 12);
}

describe('buildDeployPlan', () => {
  it('content-addresses each remote and lays out immutable versioned keys', () => {
    const root = makeFixtureRepo({
      inspector: { 'remoteEntry.js': 'INSPECTOR', 'inspector.chunk.js': 'chunk' },
      data: { 'remoteEntry.js': 'DATA' },
    });

    const plan = buildDeployPlan({ repoRoot: root, cdn: CDN });

    expect(plan.osdVersion).toBe('3.5.0');
    // Sorted by id.
    expect(plan.remotes.map((r) => r.id)).toEqual(['data', 'inspector']);

    const inspector = plan.remotes.find((r) => r.id === 'inspector')!;
    const hash = sha12('INSPECTOR');
    expect(inspector.contentHash).toBe(hash);
    expect(inspector.version).toBe(`3.5.0+${hash}`);
    expect(inspector.keyPrefix).toBe(`mfe/inspector/${hash}`);
    expect(inspector.remoteEntryKey).toBe(`mfe/inspector/${hash}/remoteEntry.js`);
    expect(inspector.cdnUrl).toBe(`https://cdn.example.net/mfe/inspector/${hash}/remoteEntry.js`);
    // Every file in the dir is mapped under the versioned prefix.
    expect(inspector.files.map((f) => f.key).sort()).toEqual(
      [`mfe/inspector/${hash}/inspector.chunk.js`, `mfe/inspector/${hash}/remoteEntry.js`].sort()
    );
  });

  it('computes SRI integrity over the UNCOMPRESSED remoteEntry.js bytes (not the gzip temp)', () => {
    // SRI is verified by the browser against the DECODED body, so integrity
    // MUST be sha384 of the original bytes — never the gzipped upload. Prove
    // the plan's integrity equals the hash of the pre-gzip artifact and is
    // DISTINCT from the hash of the gzipped bytes.
    const root = makeFixtureRepo({ inspector: { 'remoteEntry.js': 'INSPECTOR' } });

    const plan = buildDeployPlan({ repoRoot: root, cdn: CDN });
    const inspector = plan.remotes.find((r) => r.id === 'inspector')!;

    const uncompressed = Buffer.from('INSPECTOR', 'utf8');
    expect(inspector.integrity).toBe(computeIntegrity(uncompressed));
    expect(inspector.integrity).toMatch(/^sha384-.+/);
    // The hash of the gzipped bytes would be WRONG — assert we did not use it.
    const gzipped = Zlib.gzipSync(uncompressed);
    expect(inspector.integrity).not.toBe(computeIntegrity(gzipped));
  });

  it('yields a DIFFERENT integrity when the remoteEntry.js content changes', () => {
    const a = buildDeployPlan({
      repoRoot: makeFixtureRepo({ inspector: { 'remoteEntry.js': 'ONE' } }),
      cdn: CDN,
    }).remotes.find((r) => r.id === 'inspector')!;
    const b = buildDeployPlan({
      repoRoot: makeFixtureRepo({ inspector: { 'remoteEntry.js': 'TWO' } }),
      cdn: CDN,
    }).remotes.find((r) => r.id === 'inspector')!;

    expect(a.integrity).not.toBe(b.integrity);
  });

  it('content-addresses shared-deps under <prefix>/shared-deps/<contentHash>/ including subdirs', () => {
    const root = makeFixtureRepo({ inspector: { 'remoteEntry.js': 'X' } });

    const { sharedDeps } = buildDeployPlan({ repoRoot: root, cdn: CDN });

    const sharedHash = sha12('shared');
    expect(sharedDeps!.version).toBe('3.5.0');
    expect(sharedDeps!.contentHash).toBe(sharedHash);
    expect(sharedDeps!.keyPrefix).toBe(`mfe/shared-deps/${sharedHash}`);
    expect(sharedDeps!.cdnUrl).toBe(`https://cdn.example.net/mfe/shared-deps/${sharedHash}/`);
    expect(sharedDeps!.files.map((f) => f.key).sort()).toEqual([
      `mfe/shared-deps/${sharedHash}/fonts/a.woff2`,
      `mfe/shared-deps/${sharedHash}/osd-ui-shared-deps.js`,
    ]);
  });

  it('ignores directories without a remoteEntry.js', () => {
    const root = makeFixtureRepo({
      inspector: { 'remoteEntry.js': 'X' },
      partial: { 'only.chunk.js': 'no remote entry here' },
    });

    const plan = buildDeployPlan({ repoRoot: root, cdn: CDN });
    expect(plan.remotes.map((r) => r.id)).toEqual(['inspector']);
  });

  it('honours an explicit osdVersion and a custom key prefix', () => {
    const root = makeFixtureRepo({ inspector: { 'remoteEntry.js': 'X' } });
    const plan = buildDeployPlan({
      repoRoot: root,
      cdn: { ...CDN, keyPrefix: 'assets/mfe' },
      osdVersion: '9.9.9',
    });
    const inspector = plan.remotes[0];
    expect(inspector.version.startsWith('9.9.9+')).toBe(true);
    expect(inspector.keyPrefix.startsWith('assets/mfe/inspector/')).toBe(true);
    // shared-deps is content-addressed (hash of its entry bundle), independent
    // of the version label, under the custom key prefix.
    expect(plan.sharedDeps!.version).toBe('9.9.9');
    expect(plan.sharedDeps!.keyPrefix).toMatch(/^assets\/mfe\/shared-deps\/[0-9a-f]{12}$/);
  });

  it('throws when there are no built remotes', () => {
    const root = Fs.mkdtempSync(Path.join(Os.tmpdir(), 'mfe-deploy-empty-'));
    Fs.writeFileSync(Path.join(root, 'package.json'), JSON.stringify({ version: '3.5.0' }), 'utf8');
    expect(() => buildDeployPlan({ repoRoot: root, cdn: CDN })).toThrow(
      /No built Module Federation remotes/
    );
  });
});
