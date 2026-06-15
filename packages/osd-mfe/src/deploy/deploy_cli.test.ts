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

/** List every file under `dir` recursively (absolute paths). */
function listFilesRecursive(dir: string): string[] {
  const out: string[] = [];
  for (const entry of Fs.readdirSync(dir, { withFileTypes: true })) {
    const full = Path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listFilesRecursive(full));
    } else {
      out.push(full);
    }
  }
  return out;
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
    // upload targets the versioned prefix, recursively, with Content-Encoding: gzip
    expect(cps[0].args).toEqual(
      expect.arrayContaining(['s3', 'cp', '--recursive', '--content-encoding', 'gzip', '--region'])
    );
    // every artifact upload is marked gzip (pre-compressed transit, Phase 7 Story 4)
    expect(cps.every((c) => c.args.includes('--content-encoding') && c.args.includes('gzip'))).toBe(
      true
    );
    expect(
      cps.some((c) => c.args.some((a) => /s3:\/\/test-bucket\/mfe\/inspector\//.test(a)))
    ).toBe(true);
    // shared-deps is content-addressed: s3://.../mfe/shared-deps/<hash>/
    expect(
      cps.some((c) =>
        c.args.some((a) => /^s3:\/\/test-bucket\/mfe\/shared-deps\/[0-9a-f]{12}\/$/.test(a))
      )
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
    expect(manifest.sharedDeps.version).toBe('3.5.0');
    expect(manifest.sharedDeps.key).toMatch(/^mfe\/shared-deps\/[0-9a-f]{12}$/);
    expect(manifest.sharedDeps.cdnUrl).toMatch(
      /^https:\/\/cdn\.example\.net\/mfe\/shared-deps\/[0-9a-f]{12}\/$/
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

  it('gzip-compresses every upload and never stages source maps for the CDN', () => {
    const { root, env } = makeFixtureRepo();
    // A source map alongside the remote must NOT be published to the public CDN.
    Fs.writeFileSync(
      Path.join(root, 'target', 'mfe', 'inspector', 'inspector.chunk.js.map'),
      '{"version":3,"sources":[]}',
      'utf8'
    );
    const out = captureConsole();

    // Custom exec that inspects the staging dir handed to `aws s3 cp` at the
    // moment of upload (before the CLI removes it), recording the staged file
    // list and whether each .js body carries the gzip magic bytes.
    const stagedByDest: Record<string, { files: string[]; jsAreGzip: boolean[] }> = {};
    const run = (command: string, args: string[]): CommandResult => {
      if (command === 'ada') {
        return { status: 0, stdout: '', stderr: '' };
      }
      if (command === 'aws' && args[0] === 's3api' && args[1] === 'head-object') {
        return { status: 254, stdout: '', stderr: '' };
      }
      if (command === 'aws' && args[0] === 's3' && args[1] === 'cp') {
        const stagingDir = args[2];
        const dest = args[3];
        const files = listFilesRecursive(stagingDir).map((p) => Path.relative(stagingDir, p));
        const jsAreGzip = files
          .filter((f) => f.endsWith('.js'))
          .map((f) => {
            const buf = Fs.readFileSync(Path.join(stagingDir, f));
            return buf[0] === 0x1f && buf[1] === 0x8b; // gzip magic
          });
        stagedByDest[dest] = { files, jsAreGzip };
        return { status: 0, stdout: '', stderr: '' };
      }
      return { status: 0, stdout: '', stderr: '' };
    };

    const code = runDeployCli([], root, { env, out, exec: run });
    expect(code).toBe(0);

    const allStaged = Object.values(stagedByDest).flatMap((s) => s.files);
    // Source maps are NEVER published to the public CDN.
    expect(allStaged.some((f) => f.endsWith('.map'))).toBe(false);
    // The remote's .js files were still uploaded, all gzip-compressed.
    const allJsGzip = Object.values(stagedByDest).flatMap((s) => s.jsAreGzip);
    expect(allJsGzip.length).toBeGreaterThan(0);
    expect(allJsGzip.every(Boolean)).toBe(true);
    // The CLI reported excluding the one source map.
    expect(out.logs.join('\n')).toMatch(/excluded 1 source map/);
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

/** Add a second built remote to an existing fixture repo (Phase 10 Story 1). */
function addRemote(root: string, id: string, files: Record<string, string>): void {
  const dir = Path.join(root, 'target', 'mfe', id);
  Fs.mkdirSync(dir, { recursive: true });
  for (const [name, contents] of Object.entries(files)) {
    Fs.writeFileSync(Path.join(dir, name), contents, 'utf8');
  }
}

describe('runDeployCli --plugin (Phase 10 Story 1: single-plugin publish)', () => {
  it('--plugin <id> --dry-run plans ONLY that remote, skips shared-deps, makes ZERO calls', () => {
    const { root, manifestPath, env } = makeFixtureRepo();
    // A second built remote that MUST be excluded from a single-plugin plan.
    addRemote(root, 'data', { 'remoteEntry.js': 'DATA' });
    const out = captureConsole();
    const { run, calls } = mockExec();

    const code = runDeployCli(['--plugin', 'inspector', '--dry-run'], root, {
      env,
      out,
      exec: run,
    });

    expect(code).toBe(0);
    expect(calls).toEqual([]); // ZERO AWS / ada calls under dry-run
    expect(Fs.existsSync(manifestPath)).toBe(false); // nothing written
    const joined = out.logs.join('\n');
    expect(joined).toContain('1 remote(s) would be published');
    expect(joined).toContain('inspector');
    // The other built remote is NOT in the plan.
    expect(joined).not.toContain('  data  ');
    // Shared-deps is skipped by default for a single-plugin publish.
    expect(joined).not.toContain('shared-deps 3.5.0');
    expect(joined).toMatch(/shared-deps: skipped/);
  });

  it('--plugin <id> publishes ONLY that remote + writes a single-entry manifest (no shared-deps)', () => {
    const { root, manifestPath, env } = makeFixtureRepo();
    addRemote(root, 'data', { 'remoteEntry.js': 'DATA' });
    const out = captureConsole();
    const { run, calls } = mockExec({ headObjectExists: false });

    const code = runDeployCli(['--plugin', 'inspector', '--skip-creds'], root, {
      env,
      out,
      exec: run,
    });

    expect(code).toBe(0);

    // Exactly ONE upload — inspector only; shared-deps and the other remote are untouched.
    const cps = calls.filter((c) => c.command === 'aws' && c.args[1] === 'cp');
    expect(cps).toHaveLength(1);
    expect(cps[0].args.some((a) => /s3:\/\/test-bucket\/mfe\/inspector\//.test(a))).toBe(true);
    expect(cps.some((c) => c.args.some((a) => /shared-deps/.test(a)))).toBe(false);
    expect(cps.some((c) => c.args.some((a) => /\/mfe\/data\//.test(a)))).toBe(false);

    // No creds refresh under --skip-creds.
    expect(calls.find((c) => c.command === 'ada')).toBeUndefined();

    // Single-entry manifest: exactly inspector, and NO shared-deps key.
    const manifest = JSON.parse(Fs.readFileSync(manifestPath, 'utf8'));
    expect(Object.keys(manifest.mfes)).toEqual(['inspector']);
    expect(manifest.sharedDeps).toBeUndefined();
    expect(manifest.mfes.inspector.version).toMatch(/^3\.5\.0\+[0-9a-f]{12}$/);
    expect(manifest.mfes.inspector.cdnUrl).toMatch(
      /^https:\/\/cdn\.example\.net\/mfe\/inspector\/[0-9a-f]{12}\/remoteEntry\.js$/
    );
  });

  it('--plugin <id> --with-shared-deps also publishes shared-deps + includes it in the manifest', () => {
    const { root, manifestPath, env } = makeFixtureRepo();
    addRemote(root, 'data', { 'remoteEntry.js': 'DATA' });
    const out = captureConsole();
    const { run, calls } = mockExec({ headObjectExists: false });

    const code = runDeployCli(
      ['--plugin', 'inspector', '--with-shared-deps', '--skip-creds'],
      root,
      {
        env,
        out,
        exec: run,
      }
    );

    expect(code).toBe(0);

    // inspector + shared-deps = two uploads; the other remote is still excluded.
    const cps = calls.filter((c) => c.command === 'aws' && c.args[1] === 'cp');
    expect(cps).toHaveLength(2);
    expect(cps.some((c) => c.args.some((a) => /\/mfe\/inspector\//.test(a)))).toBe(true);
    expect(
      cps.some((c) =>
        c.args.some((a) => /^s3:\/\/test-bucket\/mfe\/shared-deps\/[0-9a-f]{12}\/$/.test(a))
      )
    ).toBe(true);
    expect(cps.some((c) => c.args.some((a) => /\/mfe\/data\//.test(a)))).toBe(false);

    const manifest = JSON.parse(Fs.readFileSync(manifestPath, 'utf8'));
    expect(Object.keys(manifest.mfes)).toEqual(['inspector']);
    expect(manifest.sharedDeps.version).toBe('3.5.0');
    expect(manifest.sharedDeps.key).toMatch(/^mfe\/shared-deps\/[0-9a-f]{12}$/);
  });

  it('--plugin <unknown> aborts with a clear error listing built remotes, ZERO calls', () => {
    const { root, manifestPath, env } = makeFixtureRepo();
    addRemote(root, 'data', { 'remoteEntry.js': 'DATA' });
    const out = captureConsole();
    const { run, calls } = mockExec();

    const code = runDeployCli(['--plugin', 'nope', '--dry-run'], root, { env, out, exec: run });

    expect(code).toBe(1);
    const errors = out.errors.join('\n');
    expect(errors).toMatch(/Plugin "nope" has no built Module Federation remote/);
    // The error lists the remotes that ARE built so the user can correct the id.
    expect(errors).toContain('data');
    expect(errors).toContain('inspector');
    expect(calls).toEqual([]);
    expect(Fs.existsSync(manifestPath)).toBe(false);
  });

  it('regression: WITHOUT --plugin still plans every built remote + shared-deps', () => {
    const { root, env } = makeFixtureRepo();
    addRemote(root, 'data', { 'remoteEntry.js': 'DATA' });
    const out = captureConsole();
    const { run, calls } = mockExec();

    const code = runDeployCli(['--dry-run'], root, { env, out, exec: run });

    expect(code).toBe(0);
    expect(calls).toEqual([]);
    const joined = out.logs.join('\n');
    expect(joined).toContain('2 remote(s) would be published');
    expect(joined).toContain('inspector');
    expect(joined).toContain('data');
    expect(joined).toContain('shared-deps 3.5.0');
  });
});
