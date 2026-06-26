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
import { computeIntegrity } from '../registry/generate';

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
    // Phase 12 Story 1: the manifest carries SRI integrity computed over the
    // UNCOMPRESSED remoteEntry.js bytes (the fixture's 'INSPECTOR'), NOT the
    // gzipped upload temp the deploy stages.
    expect(manifest.mfes.inspector.integrity).toBe(computeIntegrity(Buffer.from('INSPECTOR')));
    expect(manifest.mfes.inspector.integrity).toMatch(/^sha384-.+/);
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

  it('skips ada creds refresh when AWS_CONTAINER_CREDENTIALS_FULL_URI is set', () => {
    const { root, env } = makeFixtureRepo();
    env.AWS_CONTAINER_CREDENTIALS_FULL_URI = 'http://169.254.170.23/v1/credentials';
    const out = captureConsole();
    const { run, calls } = mockExec();

    const code = runDeployCli([], root, { env, out, exec: run });

    expect(code).toBe(0);
    // No ada call — container credentials are used instead.
    expect(calls.find((c) => c.command === 'ada')).toBeUndefined();
    expect(out.logs.join('\n')).toContain('AWS_CONTAINER_CREDENTIALS_FULL_URI');
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
    // Phase 12 Story 1: a single-plugin manifest also carries the uncompressed-
    // bytes SRI, so a per-plugin (`--merge`) registration keeps a real integrity.
    expect(manifest.mfes.inspector.integrity).toBe(computeIntegrity(Buffer.from('INSPECTOR')));
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

/* ------------------------------------------------------------------------- *
 * Phase 16 Story 2 — v3 asset deploy coverage
 * ------------------------------------------------------------------------- */

import {
  V3_ASSET_BUILD_MANIFEST_SCHEMA_VERSION,
  V3AssetBuildManifest,
  V3AssetKind,
} from '../registry/v3_asset_build';

/** Stage a v3 asset under target/mfe-...; return its manifest path. */
function writeV3StagedAsset(
  root: string,
  assetKind: V3AssetKind,
  contentHash: string,
  primaryFile: string,
  themeName?: string
): string {
  let stagingDir: string;
  if (assetKind === 'theme') {
    stagingDir = Path.join(root, 'target', 'mfe-themes', themeName!, contentHash);
  } else if (assetKind === 'shared-deps-css') {
    stagingDir = Path.join(root, 'target', 'mfe-shared-deps-css', contentHash);
  } else if (assetKind === 'orchestrator') {
    stagingDir = Path.join(root, 'target', 'mfe-bootstrap', contentHash);
  } else {
    stagingDir = Path.join(root, 'target', 'mfe-core', contentHash);
  }
  Fs.mkdirSync(stagingDir, { recursive: true });
  Fs.writeFileSync(Path.join(stagingDir, primaryFile), 'PAYLOAD');
  const manifest: V3AssetBuildManifest = {
    schemaVersion: V3_ASSET_BUILD_MANIFEST_SCHEMA_VERSION,
    generatedAt: '2026-06-26T12:00:00.000Z',
    assetKind,
    ...(themeName !== undefined ? { themeName } : {}),
    contentHash,
    integrity: 'sha384-MOCKINTEGRITY',
    version: `3.5.0+${contentHash}`,
    stagingDir,
    primaryFile,
    files: [{ localPath: Path.join(stagingDir, primaryFile), relativePath: primaryFile }],
  };
  const manifestPath = Path.join(stagingDir, 'build-manifest.json');
  Fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  return manifestPath;
}

describe('runDeployCli() — v3 asset publish (Phase 16 Story 2)', () => {
  it('--core <manifest> --dry-run prints the intended key + makes ZERO AWS calls', () => {
    const { root, env, manifestPath } = makeFixtureRepo();
    const buildManifest = writeV3StagedAsset(root, 'core', 'corehash1234', 'core.entry.js');
    const out = captureConsole();
    const { run, calls } = mockExec();
    const code = runDeployCli(['--core', buildManifest, '--dry-run'], root, {
      env,
      out,
      exec: run,
    });
    expect(code).toBe(0);
    expect(calls).toEqual([]); // ZERO aws/ada calls in dry-run
    const joined = out.logs.join('\n');
    expect(joined).toContain('v3 asset core 3.5.0+corehash1234');
    expect(joined).toContain('s3://test-bucket/mfe/core/corehash1234/core.entry.js');
    expect(joined).toContain('integrity: sha384-MOCKINTEGRITY');
    // Manifest NOT touched (no --update-manifest).
    expect(Fs.existsSync(manifestPath)).toBe(false);
  });

  it('--core <manifest> publishes + skips creds when --skip-creds (1 upload, 1 head-object call)', () => {
    const { root, env } = makeFixtureRepo();
    const buildManifest = writeV3StagedAsset(root, 'core', 'corehash9876', 'core.entry.js');
    const out = captureConsole();
    const { run, calls } = mockExec();
    const code = runDeployCli(['--core', buildManifest, '--skip-creds'], root, {
      env,
      out,
      exec: run,
    });
    expect(code).toBe(0);
    // Exactly one head-object (immutability) + one s3 cp upload; no ada call.
    expect(calls.some((c) => c.command === 'ada')).toBe(false);
    const headCalls = calls.filter(
      (c) => c.command === 'aws' && c.args[0] === 's3api' && c.args[1] === 'head-object'
    );
    expect(headCalls).toHaveLength(1);
    const cpCalls = calls.filter(
      (c) => c.command === 'aws' && c.args[0] === 's3' && c.args[1] === 'cp'
    );
    expect(cpCalls).toHaveLength(1);
    // Upload target uses the v3 asset path.
    expect(cpCalls[0].args.some((a) => a.includes('s3://test-bucket/mfe/core/corehash9876/'))).toBe(
      true
    );
  });

  it('--core <manifest> --skip-creds --update-manifest writes v3Assets.core into deploy-manifest.json', () => {
    const { root, manifestPath, env } = makeFixtureRepo();
    const buildManifest = writeV3StagedAsset(root, 'core', 'cmh777', 'core.entry.js');
    const out = captureConsole();
    const { run } = mockExec();
    const code = runDeployCli(
      ['--core', buildManifest, '--skip-creds', '--update-manifest'],
      root,
      { env, out, exec: run }
    );
    expect(code).toBe(0);
    expect(Fs.existsSync(manifestPath)).toBe(true);
    const manifest = JSON.parse(Fs.readFileSync(manifestPath, 'utf8'));
    expect(manifest.v3Assets).toBeDefined();
    expect(manifest.v3Assets.core).toBeDefined();
    expect(manifest.v3Assets.core.assetKind).toBe('core');
    expect(manifest.v3Assets.core.contentHash).toBe('cmh777');
    expect(manifest.v3Assets.core.integrity).toBe('sha384-MOCKINTEGRITY');
    expect(manifest.v3Assets.core.cdnUrl).toBe(
      'https://cdn.example.net/mfe/core/cmh777/core.entry.js'
    );
  });

  it('--theme <name> <manifest> --skip-creds --update-manifest writes v3Assets["theme:<name>"]', () => {
    const { root, manifestPath, env } = makeFixtureRepo();
    const buildManifest = writeV3StagedAsset(
      root,
      'theme',
      'darkhh',
      'legacy_dark_theme.css',
      'dark'
    );
    const out = captureConsole();
    const { run } = mockExec();
    const code = runDeployCli(
      ['--theme', 'dark', buildManifest, '--skip-creds', '--update-manifest'],
      root,
      { env, out, exec: run }
    );
    expect(code).toBe(0);
    const manifest = JSON.parse(Fs.readFileSync(manifestPath, 'utf8'));
    expect(manifest.v3Assets['theme:dark']).toBeDefined();
    expect(manifest.v3Assets['theme:dark'].themeName).toBe('dark');
    expect(manifest.v3Assets['theme:dark'].cdnUrl).toBe(
      'https://cdn.example.net/mfe/themes/dark/darkhh/legacy_dark_theme.css'
    );
  });

  it('--shared-deps-css preserves an existing v3Assets map on the manifest (additive)', () => {
    const { root, manifestPath, env } = makeFixtureRepo();
    // Seed the deploy manifest with an existing v3 entry (e.g. core was deployed earlier).
    Fs.mkdirSync(Path.dirname(manifestPath), { recursive: true });
    Fs.writeFileSync(
      manifestPath,
      JSON.stringify({
        schemaVersion: DEPLOY_MANIFEST_SCHEMA_VERSION,
        generatedAt: '2026-06-25T00:00:00.000Z',
        cdn: {
          bucket: 'test-bucket',
          region: 'us-west-2',
          baseUrl: 'https://cdn.example.net',
          keyPrefix: 'mfe',
        },
        mfes: {},
        v3Assets: {
          core: {
            assetKind: 'core',
            contentHash: 'priorcore',
            integrity: 'sha384-PRIOR',
            version: '3.5.0+priorcore',
            key: 'mfe/core/priorcore/core.entry.js',
            cdnUrl: 'https://cdn.example.net/mfe/core/priorcore/core.entry.js',
            fileCount: 1,
          },
        },
      })
    );
    const buildManifest = writeV3StagedAsset(
      root,
      'shared-deps-css',
      'cssh',
      'osd-ui-shared-deps.css'
    );
    const out = captureConsole();
    const { run } = mockExec();
    const code = runDeployCli(
      ['--shared-deps-css', buildManifest, '--skip-creds', '--update-manifest'],
      root,
      { env, out, exec: run }
    );
    expect(code).toBe(0);
    const m = JSON.parse(Fs.readFileSync(manifestPath, 'utf8'));
    // Pre-existing entry preserved.
    expect(m.v3Assets.core.contentHash).toBe('priorcore');
    // New entry added.
    expect(m.v3Assets.sharedDepsCss).toBeDefined();
    expect(m.v3Assets.sharedDepsCss.assetKind).toBe('shared-deps-css');
  });

  it('rejects mixing v3 asset flags with --plugin in one invocation', () => {
    const { root, env } = makeFixtureRepo();
    const buildManifest = writeV3StagedAsset(root, 'core', 'mix0', 'core.entry.js');
    const out = captureConsole();
    const { run, calls } = mockExec();
    const code = runDeployCli(['--core', buildManifest, '--plugin', 'inspector'], root, {
      env,
      out,
      exec: run,
    });
    expect(code).toBe(1);
    expect(out.errors.join('\n')).toMatch(/mutually exclusive/);
    expect(calls).toEqual([]);
  });

  it('rejects two v3 asset flags in one invocation', () => {
    const { root, env } = makeFixtureRepo();
    const coreM = writeV3StagedAsset(root, 'core', 'aaaaaa', 'core.entry.js');
    const orchM = writeV3StagedAsset(root, 'orchestrator', 'bbbbbb', 'osd_bootstrap_mfe.js');
    const out = captureConsole();
    const { run, calls } = mockExec();
    const code = runDeployCli(['--core', coreM, '--orchestrator', orchM, '--skip-creds'], root, {
      env,
      out,
      exec: run,
    });
    expect(code).toBe(1);
    expect(out.errors.join('\n')).toMatch(/Only one --core\/--orchestrator/);
    expect(calls).toEqual([]);
  });
});
