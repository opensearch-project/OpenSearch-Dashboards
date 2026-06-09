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

/**
 * `deploy_mfe` CLI logic (Phase 4, Story 1).
 *
 * Publishes the built Module Federation remotes + the shared-deps bundle to the
 * PRE-PROVISIONED CDN (S3 bucket + CloudFront created separately by
 * `harness/provision_cdn.sh` / future CDK) and emits a deploy manifest mapping
 * each plugin id to its published `{version, contentHash, key, cdnUrl}`.
 *
 * This command is PUBLISH-ONLY and INFRA-AGNOSTIC. It:
 *   - reads the provisioned location from the environment / `cdn_outputs.env`
 *     (never hardcoded — see {@link resolveCdnConfig}),
 *   - refreshes short-lived Isengard creds (`ada ... --once`) before any write,
 *   - uploads each artifact dir to an IMMUTABLE, versioned key
 *     (`<prefix>/<id>/<contentHash>/...`), skipping any version already present
 *     so a published artifact is never overwritten in place,
 *   - writes the deploy manifest next to the registry data file.
 *
 * It MUST NEVER create or mutate infra: the ONLY AWS subcommands it runs are
 * `aws s3api head-object` (read, immutability check) and `aws s3 cp --recursive`
 * (object upload). It never calls create-bucket, create-distribution,
 * put-bucket-policy or put-public-access-block. See docs/01-MFE-DESIGN.md §6.
 */

import Fs from 'fs';
import Path from 'path';
import { spawnSync } from 'child_process';

import { parseEnvFile, resolveCdnConfig, ResolvedCdnConfig } from './cdn_config';
import { buildDeployPlan, DeployPlan, RemotePlan, SharedDepsPlan } from './plan';

/** Manifest schema version; bump on incompatible shape changes. */
export const DEPLOY_MANIFEST_SCHEMA_VERSION = 1;

const USAGE = `Usage: node scripts/deploy_mfe [options]

Publish the built MFE remotes + shared-deps to the PRE-PROVISIONED CDN and emit a
deploy manifest. PUBLISH-ONLY: this never creates or mutates infra (no
create-bucket / create-distribution / put-bucket-policy). The provisioned
location is read from the environment (source harness/env.sh) or --cdn-outputs.

Options:
  --dry-run            Plan only: print the intended versioned keys for every
                       remote + shared-deps and exit. Makes ZERO AWS calls and
                       writes nothing (no manifest).
  --skip-creds         Do not refresh Isengard creds (assume the osd-mfe profile
                       is already valid). Ignored under --dry-run.
  --cdn-outputs <p>    Path to cdn_outputs.env to read the CDN location from when
                       the CDN_* env vars are absent. Defaults to
                       <repoRoot>/../harness/cdn_outputs.env when it exists.
  --manifest-path <p>  Where to write deploy-manifest.json. Defaults to the
                       directory of MFE_REGISTRY_PATH, else <repoRoot>/registry.
  --target-mfe-dir <p> Override the built remotes dir (default <repoRoot>/target/mfe).
  --shared-deps-dir <p> Override the shared-deps dir
                       (default <repoRoot>/packages/osd-ui-shared-deps/target).
  --help, -h           Show this message`;

/** Minimal console surface, injectable so tests can assert/silence output. */
export interface DeployCliConsole {
  log: (message: string) => void;
  error: (message: string) => void;
}

/** Result of running an external command. */
export interface CommandResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

/**
 * Runs an external command. Injectable so tests never touch `ada`/`aws`.
 * `stdio: 'inherit'` streams child output straight to the terminal (used for the
 * potentially long uploads); the default captures stdout/stderr.
 */
export type CommandRunner = (
  command: string,
  args: string[],
  options?: { stdio?: 'inherit' | 'pipe' }
) => CommandResult;

/** Minimal filesystem surface used by the CLI (injectable for tests). */
export interface DeployCliFs {
  existsSync: (path: string) => boolean;
  readFileSync: (path: string, encoding: 'utf8') => string;
  mkdirSync: (path: string, options: { recursive: true }) => void;
  writeFileSync: (path: string, data: string, encoding: 'utf8') => void;
}

/** Injectable dependencies for {@link runDeployCli} (all default to real impls). */
export interface DeployCliDeps {
  env?: NodeJS.ProcessEnv;
  out?: DeployCliConsole;
  exec?: CommandRunner;
  fs?: DeployCliFs;
  now?: Date;
}

/** The emitted deploy-manifest.json document shape. */
export interface DeployManifest {
  schemaVersion: number;
  generatedAt: string;
  cdn: {
    bucket: string;
    region: string;
    baseUrl: string;
    keyPrefix: string;
    distributionId?: string;
    domain?: string;
  };
  sharedDeps: { version: string; key: string; cdnUrl: string; fileCount: number };
  mfes: Record<
    string,
    { version: string; contentHash: string; key: string; cdnUrl: string; fileCount: number }
  >;
}

/** Default {@link CommandRunner}: a thin, shell-free `spawnSync` wrapper. */
const defaultExec: CommandRunner = (command, args, options) => {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: options?.stdio ?? 'pipe',
  });
  if (result.error) {
    // e.g. command not found — surface as a non-zero status the caller handles.
    return { status: 127, stdout: '', stderr: String(result.error.message ?? result.error) };
  }
  return {
    status: result.status,
    stdout: typeof result.stdout === 'string' ? result.stdout : '',
    stderr: typeof result.stderr === 'string' ? result.stderr : '',
  };
};

/** Default filesystem: the real `fs` module, typed to the minimal surface. */
const defaultFs: DeployCliFs = {
  existsSync: (path) => Fs.existsSync(path),
  readFileSync: (path, encoding) => Fs.readFileSync(path, encoding),
  mkdirSync: (path, opts) => {
    Fs.mkdirSync(path, opts);
  },
  writeFileSync: (path, data, encoding) => Fs.writeFileSync(path, data, encoding),
};

/**
 * Read a `--flag <value>` option from argv.
 *
 * @throws Error when the flag is present but its value is missing/another flag
 */
function readOption(argv: string[], flag: string): string | undefined {
  const index = argv.indexOf(flag);
  if (index === -1) {
    return undefined;
  }
  const value = argv[index + 1];
  if (value === undefined || value.startsWith('-')) {
    throw new Error(`${flag} requires a value (e.g. "${flag} <value>")`);
  }
  return value;
}

/**
 * Resolve the deploy-manifest.json path: `--manifest-path` wins, else the
 * directory of `MFE_REGISTRY_PATH` (the manifest lives next to the registry it
 * feeds), else `<repoRoot>/registry/deploy-manifest.json`.
 */
function resolveManifestPath(argv: string[], env: NodeJS.ProcessEnv, repoRoot: string): string {
  const fromArg = readOption(argv, '--manifest-path');
  if (fromArg !== undefined) {
    return fromArg;
  }
  const registryPath = env.MFE_REGISTRY_PATH;
  if (typeof registryPath === 'string' && registryPath.length > 0) {
    return Path.join(Path.dirname(registryPath), 'deploy-manifest.json');
  }
  return Path.join(repoRoot, 'registry', 'deploy-manifest.json');
}

/**
 * Resolve the `cdn_outputs.env` fallback path: `--cdn-outputs` wins, else the
 * conventional `<repoRoot>/../harness/cdn_outputs.env` when it exists. Returns
 * undefined when there is no file to read (env-only resolution).
 */
function resolveCdnOutputsPath(
  argv: string[],
  repoRoot: string,
  fs: DeployCliFs
): string | undefined {
  const fromArg = readOption(argv, '--cdn-outputs');
  if (fromArg !== undefined) {
    return fromArg;
  }
  const conventional = Path.resolve(repoRoot, '..', 'harness', 'cdn_outputs.env');
  return fs.existsSync(conventional) ? conventional : undefined;
}

/** Read + parse a cdn_outputs.env file if a path is given; else an empty map. */
function loadFileEnv(path: string | undefined, fs: DeployCliFs): Record<string, string> {
  if (path === undefined || !fs.existsSync(path)) {
    return {};
  }
  return parseEnvFile(fs.readFileSync(path, 'utf8'));
}

/**
 * Refresh short-lived Isengard creds via `ada credentials update ... --once`,
 * reading the account/provider/role/profile from the environment (exported by
 * harness/env.sh). This is the node equivalent of the `mfe_refresh_creds` shell
 * function — that function is not visible to a child node process.
 *
 * @throws Error when required env vars are missing or `ada` exits non-zero. Per
 *   the loop rules we STOP rather than work around a creds failure.
 */
function refreshCreds(exec: CommandRunner, env: NodeJS.ProcessEnv, out: DeployCliConsole): void {
  const account = env.ADA_ACCOUNT;
  const provider = env.ADA_PROVIDER;
  const role = env.ADA_ROLE;
  const profile = env.AWS_PROFILE;
  const missing = [
    account ? undefined : 'ADA_ACCOUNT',
    provider ? undefined : 'ADA_PROVIDER',
    role ? undefined : 'ADA_ROLE',
    profile ? undefined : 'AWS_PROFILE',
  ].filter((entry): entry is string => entry !== undefined);
  if (missing.length > 0) {
    throw new Error(
      `Cannot refresh creds: missing ${missing.join(', ')}. Source harness/env.sh first ` +
        '(or pass --skip-creds if the osd-mfe profile is already valid).'
    );
  }

  out.log(`Refreshing Isengard creds (ada, profile ${profile})...`);
  const result = exec('ada', [
    'credentials',
    'update',
    `--account=${account}`,
    `--provider=${provider}`,
    `--role=${role}`,
    `--profile=${profile}`,
    '--once',
  ]);
  if (result.status !== 0) {
    throw new Error(
      `ada credentials update failed (exit ${result.status}). STOP and refresh creds manually.\n` +
        `${result.stderr || result.stdout}`.trim()
    );
  }
}

/** Build `aws` base flags shared by every subcommand (region + profile). */
function awsBaseFlags(cdn: ResolvedCdnConfig, env: NodeJS.ProcessEnv): string[] {
  const flags = ['--region', cdn.region];
  if (typeof env.AWS_PROFILE === 'string' && env.AWS_PROFILE.length > 0) {
    flags.push('--profile', env.AWS_PROFILE);
  }
  return flags;
}

/**
 * True when an object already exists at `key` (immutability guard). Uses
 * `aws s3api head-object`, a READ — a non-zero exit means "not found".
 */
function objectExists(
  exec: CommandRunner,
  cdn: ResolvedCdnConfig,
  env: NodeJS.ProcessEnv,
  key: string
): boolean {
  const result = exec('aws', [
    's3api',
    'head-object',
    '--bucket',
    cdn.bucket,
    '--key',
    key,
    ...awsBaseFlags(cdn, env),
  ]);
  return result.status === 0;
}

/**
 * Upload a whole local directory to `s3://<bucket>/<keyPrefix>/` recursively.
 * `aws s3 cp --recursive` writes objects only — it never touches bucket config.
 *
 * @throws Error when the upload exits non-zero
 */
function uploadDir(
  exec: CommandRunner,
  cdn: ResolvedCdnConfig,
  env: NodeJS.ProcessEnv,
  localDir: string,
  keyPrefix: string
): void {
  const destination = `s3://${cdn.bucket}/${keyPrefix}/`;
  const result = exec(
    'aws',
    ['s3', 'cp', localDir, destination, '--recursive', ...awsBaseFlags(cdn, env)],
    { stdio: 'inherit' }
  );
  if (result.status !== 0) {
    throw new Error(`Upload failed for ${localDir} -> ${destination} (exit ${result.status}).`);
  }
}

/** Assemble the {@link DeployManifest} document from a completed plan. */
function buildManifest(plan: DeployPlan, now: Date): DeployManifest {
  const mfes: DeployManifest['mfes'] = {};
  for (const remote of plan.remotes) {
    mfes[remote.id] = {
      version: remote.version,
      contentHash: remote.contentHash,
      key: remote.remoteEntryKey,
      cdnUrl: remote.cdnUrl,
      fileCount: remote.files.length,
    };
  }
  return {
    schemaVersion: DEPLOY_MANIFEST_SCHEMA_VERSION,
    generatedAt: now.toISOString(),
    cdn: {
      bucket: plan.cdn.bucket,
      region: plan.cdn.region,
      baseUrl: plan.cdn.baseUrl,
      keyPrefix: plan.cdn.keyPrefix,
      ...(plan.cdn.distributionId !== undefined ? { distributionId: plan.cdn.distributionId } : {}),
      ...(plan.cdn.domain !== undefined ? { domain: plan.cdn.domain } : {}),
    },
    sharedDeps: {
      version: plan.sharedDeps.version,
      key: plan.sharedDeps.keyPrefix,
      cdnUrl: plan.sharedDeps.cdnUrl,
      fileCount: plan.sharedDeps.files.length,
    },
    mfes,
  };
}

/** Write the manifest as pretty JSON (trailing newline), mkdir -p its dir. */
function writeManifest(fs: DeployCliFs, manifestPath: string, manifest: DeployManifest): void {
  fs.mkdirSync(Path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

/** Print the plan as intended keys without making any AWS call (dry-run). */
function printDryRun(plan: DeployPlan, manifestPath: string, out: DeployCliConsole): void {
  out.log(`[dry-run] Target bucket: s3://${plan.cdn.bucket} (region ${plan.cdn.region})`);
  out.log(`[dry-run] CloudFront base: ${plan.cdn.baseUrl}  key prefix: ${plan.cdn.keyPrefix}`);
  out.log(`[dry-run] OSD version: ${plan.osdVersion}`);
  out.log('');
  out.log(`[dry-run] ${plan.remotes.length} remote(s) would be published:`);
  for (const remote of plan.remotes) {
    out.log(
      `  ${remote.id}  ${remote.version}  (${remote.files.length} file(s)) -> ` +
        `s3://${plan.cdn.bucket}/${remote.remoteEntryKey}`
    );
  }
  out.log('');
  const shared = plan.sharedDeps;
  out.log(
    `[dry-run] shared-deps ${shared.version} (${shared.files.length} file(s)) -> ` +
      `s3://${plan.cdn.bucket}/${shared.keyPrefix}/`
  );
  out.log('');
  out.log(`[dry-run] would write manifest -> ${manifestPath}`);
  out.log('[dry-run] no AWS calls made; nothing was uploaded or written.');
}

/** Publish a single artifact dir unless its version already exists. Returns 'uploaded'|'skipped'. */
function publishArtifact(
  exec: CommandRunner,
  cdn: ResolvedCdnConfig,
  env: NodeJS.ProcessEnv,
  out: DeployCliConsole,
  label: string,
  localDir: string,
  keyPrefix: string,
  markerKey: string
): 'uploaded' | 'skipped' {
  if (objectExists(exec, cdn, env, markerKey)) {
    out.log(`  = ${label}: already published at ${keyPrefix}/ (immutable, skipping)`);
    return 'skipped';
  }
  out.log(`  + ${label}: uploading -> s3://${cdn.bucket}/${keyPrefix}/`);
  uploadDir(exec, cdn, env, localDir, keyPrefix);
  return 'uploaded';
}

/**
 * Entry point for the `deploy_mfe` CLI.
 *
 * @param argv CLI arguments (typically `process.argv.slice(2)`)
 * @param repoRoot absolute path to the OpenSearch Dashboards repo root
 * @param deps injectable env/console/exec/fs/now (default to real implementations)
 * @returns the process exit code (0 = success, non-zero = error)
 */
export function runDeployCli(argv: string[], repoRoot: string, deps: DeployCliDeps = {}): number {
  const env = deps.env ?? process.env;
  const out = deps.out ?? console;
  const exec = deps.exec ?? defaultExec;
  const fs = deps.fs ?? defaultFs;
  const now = deps.now ?? new Date();

  if (argv.includes('--help') || argv.includes('-h')) {
    out.log(USAGE);
    return 0;
  }

  try {
    const dryRun = argv.includes('--dry-run');
    const skipCreds = argv.includes('--skip-creds');

    const cdnOutputsPath = resolveCdnOutputsPath(argv, repoRoot, fs);
    const fileEnv = loadFileEnv(cdnOutputsPath, fs);
    const cdn = resolveCdnConfig(env, fileEnv);

    const plan = buildDeployPlan({
      repoRoot,
      cdn,
      targetMfeDir: readOption(argv, '--target-mfe-dir'),
      sharedDepsDir: readOption(argv, '--shared-deps-dir'),
    });
    const manifestPath = resolveManifestPath(argv, env, repoRoot);

    if (dryRun) {
      printDryRun(plan, manifestPath, out);
      return 0;
    }

    if (!skipCreds) {
      refreshCreds(exec, env, out);
    } else {
      out.log('Skipping creds refresh (--skip-creds).');
    }

    out.log(`Publishing to s3://${cdn.bucket}/${cdn.keyPrefix}/ (region ${cdn.region})`);
    let uploaded = 0;
    let skipped = 0;
    const tally = (outcome: 'uploaded' | 'skipped'): void => {
      if (outcome === 'uploaded') {
        uploaded += 1;
      } else {
        skipped += 1;
      }
    };

    for (const remote of plan.remotes as RemotePlan[]) {
      tally(
        publishArtifact(
          exec,
          cdn,
          env,
          out,
          remote.id,
          remote.localDir,
          remote.keyPrefix,
          remote.remoteEntryKey
        )
      );
    }

    const shared = plan.sharedDeps as SharedDepsPlan;
    // Immutability marker for shared-deps: the primary bundle file when present,
    // otherwise the first planned file.
    const sharedMarker =
      shared.files.find((f) => f.relativePath === 'osd-ui-shared-deps.js')?.key ??
      shared.files[0].key;
    tally(
      publishArtifact(
        exec,
        cdn,
        env,
        out,
        `shared-deps ${shared.version}`,
        shared.localDir,
        shared.keyPrefix,
        sharedMarker
      )
    );

    const manifest = buildManifest(plan, now);
    writeManifest(fs, manifestPath, manifest);

    out.log('');
    out.log(
      `Done: ${uploaded} uploaded, ${skipped} already-published (skipped). ` +
        `Manifest -> ${manifestPath}`
    );
    return 0;
  } catch (error) {
    out.error(error instanceof Error ? error.message : String(error));
    out.error('');
    out.error(USAGE);
    return 1;
  }
}
