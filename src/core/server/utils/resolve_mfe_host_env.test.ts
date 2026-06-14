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

import Fs from 'fs';
import Os from 'os';
import Path from 'path';

import { computeHostSharedDeps, resolveMfeHostEnv } from './resolve_mfe_host_env';

/**
 * Write a throwaway `package.json` into a temp repo root and return its path. The
 * helper reads `<repoRoot>/package.json` `dependencies`/`devDependencies` to
 * derive the host shared-singleton ranges.
 */
function makeRepoRoot(pkg: Record<string, unknown>): string {
  const dir = Fs.mkdtempSync(Path.join(Os.tmpdir(), 'mfe-host-env-'));
  Fs.writeFileSync(Path.join(dir, 'package.json'), JSON.stringify(pkg), 'utf8');
  return dir;
}

describe('resolveMfeHostEnv', () => {
  it('passes through the OSD version and derives shared-singleton ranges', () => {
    const repoRoot = makeRepoRoot({
      name: 'opensearch-dashboards',
      version: '3.5.0',
      dependencies: {
        react: '^16.14.0',
        'react-dom': '^16.14.0',
        // An `npm:` alias cannot be expressed as a range => must be OMITTED.
        '@elastic/eui': 'npm:@opensearch-project/oui@1.22.1',
      },
    });

    const host = resolveMfeHostEnv('3.5.0', repoRoot);

    expect(host.osdVersion).toBe('3.5.0');
    // react is a shared singleton root and has a plain range => included.
    expect(host.sharedDeps.react).toBe('^16.14.0');
    expect(host.sharedDeps['react-dom']).toBe('^16.14.0');
    // The npm: alias is excluded (no expressible range to satisfy).
    expect(host.sharedDeps['@elastic/eui']).toBeUndefined();

    Fs.rmSync(repoRoot, { recursive: true, force: true });
  });

  it('only emits non-empty string ranges and never an npm: alias', () => {
    const repoRoot = makeRepoRoot({
      version: '3.5.0',
      devDependencies: { react: '^16.14.0', lodash: '^4.17.21' },
      dependencies: { moment: '^2.24.0' },
    });

    const shared = computeHostSharedDeps(repoRoot);

    expect(Object.keys(shared).length).toBeGreaterThan(0);
    for (const [root, range] of Object.entries(shared)) {
      expect(typeof root).toBe('string');
      expect(typeof range).toBe('string');
      expect(range.length).toBeGreaterThan(0);
      expect(range.includes(':')).toBe(false);
    }

    Fs.rmSync(repoRoot, { recursive: true, force: true });
  });

  it('merges dependencies over devDependencies (dependencies win)', () => {
    const repoRoot = makeRepoRoot({
      version: '3.5.0',
      devDependencies: { react: '^15.0.0' },
      dependencies: { react: '^16.14.0' },
    });

    const host = resolveMfeHostEnv('3.5.0', repoRoot);
    expect(host.sharedDeps.react).toBe('^16.14.0');

    Fs.rmSync(repoRoot, { recursive: true, force: true });
  });
});
