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

import {
  runDeployCli,
  DeployCliConsole,
  CommandResult,
  DEPLOY_MANIFEST_SCHEMA_VERSION,
} from './deploy_cli';

/** A console that captures log/error lines for assertions. */
function captureConsole(): DeployCliConsole & { logs: string[]; errors: string[] } {
  const logs: string[] = [];
  const errors: string[] = [];
  return {
    logs,
    errors,
    log: (message: string) => logs.push(message),
    error: (message: string) => errors.push(message),
  };
}

/** A single recorded external command invocation. */
interface RecordedCommand {
  command: string;
  args: string[];
}

/**
 * Build a mock {@link CommandRunner} that records calls and returns canned
 * results. `headObjectExists` controls the immutability check; `adaStatus`/
 * `cpStatus` control creds + upload exit codes.
 */
function mockExec(opts?: {
  headObjectExists?: boolean;
  adaStatus?: number;
  cpStatus?: number;
}): { run: (c: string, a: string[]) => CommandResult; calls: RecordedCommand[] } {
  const calls: RecordedCommand[] = [];
  const headObjectExists = opts?.headObjectExists ?? false;
  const adaStatus = opts?.adaStatus ?? 0;
  const cpStatus = opts?.cpStatus ?? 0;

  const run = (command: string, args: string[]): CommandResult => {
    calls.push({ command, args });
    if (command === 'ada') {
      return { status: adaStatus, stdout: '', stderr: adaStatus === 0 ? '' : 'ada boom' };
    }
    if (command === 'aws' && args[0] === 's3api' && args[1] === 'head-object') {
      return { status: headObjectExists ? 0 : 254, stdout: '', stderr: '' };
    }
    if (command === 'aws' && args[0] === 's3' && args[1] === 'cp') {
      return { status: cpStatus, stdout: '', stderr: cpStatus === 0 ? '' : 'cp boom' };
    }
    return { status: 0, stdout: '', stderr: '' };
  };

  return { run, calls };
}

/** Materialise a fake repo with one built remote + shared-deps; return root + manifest path. */
function makeFixtureRepo(): { root: string; manifestPath: string; env: NodeJS.ProcessEnv } {
  const root = Fs.mkdtempSync(Path.join(Os.tmpdir(), 'mfe-deploy-cli-'));
  Fs.writeFileSync(Path.join(root, 'package.json'), JSON.stringify({ version: '3.5.0' }), 'utf8');

  const inspectorDir = Path.join(root, 'target', 'mfe', 'inspector');
  Fs.mkdirSync(inspectorDir, { recursive: true });
  Fs.writeFileSync(Path.join(inspectorDir, 'remoteEntry.js'), 'INSPECTOR', 'utf8');
  Fs.writeFileSync(Path.join(inspectorDir, 'inspector.chunk.js'), 'chunk', 'utf8');

  const sharedDir = Path.join(root, 'packages', 'osd-ui-shared-deps', 'target');
  Fs.mkdirSync(sharedDir, { recursive: true });
  Fs.writeFileSync(Path.join(sharedDir, 'osd-ui-shared-deps.js'), 'shared', 'utf8');

  const registryPath = Path.join(root, 'registry', 'registry.json');
  const manifestPath = Path.join(root, 'registry', 'deploy-manifest.json');

  const env: NodeJS.ProcessEnv = {
    CDN_BUCKET: 'test-bucket',
    CDN_REGION: 'us-west-2',
    CDN_BASE_URL: 'https://cdn.example.net',
    CDN_KEY_PREFIX: 'mfe',
    CDN_DISTRIBUTION_ID: 'EDIST123',
    CDN_DOMAIN: 'cdn.example.net',
    MFE_REGISTRY_PATH: registryPath,
    AWS_PROFILE: 'osd-mfe',
    ADA_ACCOUNT: '000000000000',
    ADA_PROVIDER: 'isengard',
    ADA_ROLE: 'Admin',
  };

  return { root, manifestPath, env };
}

describe('runDeployCli --dry-run', () => {
  it('lists remotes + shared-deps, makes zero external calls, writes nothing', () => {
    const { root, manifestPath, env } = makeFixtureRepo();
    const out = captureConsole();
    const { run, calls } = mockExec();

    const code = runDeployCli(['--dry-run'], root, { env, out, exec: run });

    expect(code).toBe(0);
    expect(calls).toEqual([]); // ZERO AWS / ada calls
    expect(Fs.existsSync(manifestPath)).toBe(false); // nothing written
    const joined = out.logs.join('\n');
    expect(joined).toContain('[dry-run]');
    expect(joined).toContain('inspector');
    expect(joined).toContain('shared-deps 3.5.0');
    expect(joined).toMatch(/s3:\/\/test-bucket\/mfe\/inspector\/[0-9a-f]{12}\/remoteEntry\.js/);
  });
});

describe('runDeployCli real publish', () => {
  it('refreshes creds, uploads every artifact, and writes the manifest', () => {
    const { root, manifestPath, env } = makeFixtureRepo();
    const out = captureConsole();
    const { run, calls } = mockExec({ headObjectExists: false });

    const code = runDeployCli([], root, { env, out, exec: run });

    expect(code).toBe(0);

    // creds refreshed via ada ... --once
    const ada = calls.find((c) => c.command === 'ada');
    expect(ada).toBeDefined();
    expect(ada!.args).toEqual(
      expect.arrayContaining(['credentials', 'update', '--profile=osd-mfe', '--once'])
    );

    // one head-object (immutability check) + one s3 cp per artifact (inspector + shared-deps)
    const cps = calls.filter((c) => c.command === 'aws' && c.args[1] === 'cp');
    expect(cps).toHaveLength(2);
    // upload targets the versioned prefix, recursively
    expect(cps[0].args).toEqual(expect.arrayContaining(['s3', 'cp', '--recursive', '--region']));
    expect(
      cps.some((c) => c.args.some((a) => /s3:\/\/test-bucket\/mfe\/inspector\//.test(a)))
    ).toBe(true);
    expect(
      cps.some((c) => c.args.some((a) => a === 's3://test-bucket/mfe/shared-deps/3.5.0/'))
    ).toBe(true);

    // NEVER any infra-creation subcommand
    const banned = [
      'create-bucket',
      'create-distribution',
      'put-bucket-policy',
      'put-public-access-block',
    ];
    for (const call of calls) {
      for (const arg of call.args) {
        expect(banned).not.toContain(arg);
      }
    }

    // manifest written with the expected shape
    const manifest = JSON.parse(Fs.readFileSync(manifestPath, 'utf8'));
    expect(manifest.schemaVersion).toBe(DEPLOY_MANIFEST_SCHEMA_VERSION);
    expect(manifest.cdn).toEqual({
      bucket: 'test-bucket',
      region: 'us-west-2',
      baseUrl: 'https://cdn.example.net',
      keyPrefix: 'mfe',
      distributionId: 'EDIST123',
      domain: 'cdn.example.net',
    });
    expect(manifest.mfes.inspector.version).toMatch(/^3\.5\.0\+[0-9a-f]{12}$/);
    expect(manifest.mfes.inspector.cdnUrl).toMatch(
      /^https:\/\/cdn\.example\.net\/mfe\/inspector\/[0-9a-f]{12}\/remoteEntry\.js$/
    );
    expect(manifest.sharedDeps).toEqual(
      expect.objectContaining({
        version: '3.5.0',
        key: 'mfe/shared-deps/3.5.0',
        cdnUrl: 'https://cdn.example.net/mfe/shared-deps/3.5.0/',
      })
    );
  });

  it('skips upload for an already-published (immutable) version', () => {
    const { root, env } = makeFixtureRepo();
    const out = captureConsole();
    const { run, calls } = mockExec({ headObjectExists: true });

    const code = runDeployCli(['--skip-creds'], root, { env, out, exec: run });

    expect(code).toBe(0);
    // No uploads when the object already exists.
    expect(calls.filter((c) => c.command === 'aws' && c.args[1] === 'cp')).toHaveLength(0);
    // No creds refresh under --skip-creds.
    expect(calls.find((c) => c.command === 'ada')).toBeUndefined();
    expect(out.logs.join('\n')).toContain('already published');
  });

  it('returns non-zero and aborts when creds refresh fails', () => {
    const { root, manifestPath, env } = makeFixtureRepo();
    const out = captureConsole();
    const { run, calls } = mockExec({ adaStatus: 1 });

    const code = runDeployCli([], root, { env, out, exec: run });

    expect(code).toBe(1);
    expect(out.errors.join('\n')).toMatch(/ada credentials update failed/);
    // Aborted before any upload.
    expect(calls.filter((c) => c.command === 'aws' && c.args[1] === 'cp')).toHaveLength(0);
    expect(Fs.existsSync(manifestPath)).toBe(false);
  });

  it('returns non-zero when the CDN location cannot be resolved', () => {
    const { root } = makeFixtureRepo();
    const out = captureConsole();
    const { run } = mockExec();

    const code = runDeployCli(['--dry-run'], root, { env: {}, out, exec: run });

    expect(code).toBe(1);
    expect(out.errors.join('\n')).toMatch(/Cannot resolve the provisioned CDN location/);
  });
});
