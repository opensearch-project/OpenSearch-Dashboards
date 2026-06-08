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
 * `update_registry` CLI logic (Phase 2, Story 4).
 *
 * This wraps the pure {@link generateRegistry} library in a DATA-ONLY writer: it
 * either regenerates the whole registry from the built Module Federation remotes
 * or patches a single plugin's version/url, then validates and writes the
 * registry JSON. Versions stay DATA — the operator flips a version by editing
 * data through this tool, never by changing code. See docs/01-MFE-DESIGN.md §5.
 *
 * The ONLY filesystem write this performs is the registry data file (resolved
 * from `--registry-path` or `MFE_REGISTRY_PATH`). It never touches OSD source,
 * the built artifacts, or the running server.
 *
 * The CLI logic lives here (TypeScript, unit-tested) so `scripts/update_registry.js`
 * can stay a thin, non-transpiled bootstrap, mirroring `scripts/build_mfe.js` ->
 * `cli.ts`.
 */

import Fs from 'fs';
import Path from 'path';

import { generateRegistry } from './generate';
import { assertValidRegistry, MfeEntry, Registry } from './schema';

const USAGE = `Usage: node scripts/update_registry [options]

Write/patch the external MFE registry DATA file. Versions are DATA: this tool is
the only sanctioned way to (re)generate or flip a version — no code change, no
rebuild, no restart.

Modes:
  (default)              Regenerate the whole registry from the built remotes
                         under target/mfe/<id>/remoteEntry.js (content-hash
                         versions). Use --base-url to point the remote URLs at a
                         specific origin.
  --plugin <id>          Patch a SINGLE existing entry in place. Requires at
                         least one of --version / --url. The entry's integrity
                         (SRI) is dropped because the recorded hash no longer
                         matches the manually supplied data.

Options:
  --base-url <url>       Origin the remotes are served from (full-regen mode).
                         Defaults to REGISTRY_BASE_URL env or http://localhost:8080.
  --plugin <id>          Plugin id to patch (e.g. "inspector").
  --version <version>    New version string for the patched plugin.
  --url <url>            New remoteEntry URL for the patched plugin.
  --registry-path <p>    Registry data file to write. Defaults to the
                         MFE_REGISTRY_PATH env var.
  --help, -h             Show this message`;

/** Minimal console surface, injectable so tests can assert/silence output. */
export interface UpdateCliConsole {
  log: (message: string) => void;
  error: (message: string) => void;
}

/**
 * Read a `--flag <value>` option from argv.
 *
 * @returns the value, or `undefined` when the flag is absent
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
 * Resolve the registry data file path: `--registry-path` arg wins over the
 * `MFE_REGISTRY_PATH` env var (mirrors {@link FileRegistryProvider}). The package
 * never hardcodes the absolute workspace path.
 *
 * @throws Error when neither source provides a path
 */
export function resolveRegistryPath(argv: string[], env: NodeJS.ProcessEnv): string {
  const fromArg = readOption(argv, '--registry-path');
  const fromEnv = env.MFE_REGISTRY_PATH;
  const path = fromArg ?? (typeof fromEnv === 'string' && fromEnv.length > 0 ? fromEnv : undefined);
  if (path === undefined) {
    throw new Error(
      'No registry path: pass --registry-path <p> or set the MFE_REGISTRY_PATH env var.'
    );
  }
  return path;
}

/**
 * Patch a single existing entry's version and/or remoteEntry URL in place.
 *
 * The recorded `integrity` is intentionally DROPPED: it is the SRI hash of the
 * previously built bytes, which no longer correspond to the operator-supplied
 * version/url. Keeping a stale hash would make the browser reject the bundle.
 * (A subsequent full regen recomputes integrity from the real artifact bytes.)
 *
 * @throws Error when neither --version nor --url is supplied, or the id is unknown
 */
function patchEntry(
  registryPath: string,
  pluginId: string,
  version: string | undefined,
  url: string | undefined,
  now: Date
): Registry {
  if (version === undefined && url === undefined) {
    throw new Error(
      `--plugin "${pluginId}" requires at least one of --version <v> or --url <u> to patch.`
    );
  }

  const raw = Fs.readFileSync(registryPath, 'utf8');
  const registry = assertValidRegistry(JSON.parse(raw));

  const existing = registry.mfes[pluginId];
  if (existing === undefined) {
    const known = Object.keys(registry.mfes).sort().join(', ');
    throw new Error(
      `No registry entry for plugin "${pluginId}" in ${registryPath}. Known ids: ${known}`
    );
  }

  const patched: MfeEntry = {
    version: version ?? existing.version,
    remoteEntry: url ?? existing.remoteEntry,
    scope: existing.scope,
    module: existing.module,
    // `integrity` deliberately omitted — see the docstring above.
  };

  registry.mfes[pluginId] = patched;
  registry.generatedAt = now.toISOString();
  return registry;
}

/** Write the registry as pretty JSON (trailing newline) to `registryPath`. */
function writeRegistry(registryPath: string, registry: Registry): void {
  Fs.mkdirSync(Path.dirname(registryPath), { recursive: true });
  Fs.writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
}

/**
 * Entry point for the `update_registry` CLI. Data-only: validates then writes
 * the registry file and nothing else.
 *
 * @param argv CLI arguments (typically `process.argv.slice(2)`)
 * @param repoRoot absolute path to the OpenSearch Dashboards repo root
 * @param env environment to read MFE_REGISTRY_PATH / REGISTRY_BASE_URL from
 * @param out console surface (injectable for tests)
 * @param now timestamp for `generatedAt` on patch (injectable for tests)
 * @returns the process exit code (0 = success, non-zero = error)
 */
export function runUpdateCli(
  argv: string[],
  repoRoot: string,
  env: NodeJS.ProcessEnv = process.env,
  out: UpdateCliConsole = console,
  now: Date = new Date()
): number {
  if (argv.includes('--help') || argv.includes('-h')) {
    out.log(USAGE);
    return 0;
  }

  try {
    const registryPath = resolveRegistryPath(argv, env);
    const pluginId = readOption(argv, '--plugin');

    let registry: Registry;
    let summary: string;
    if (pluginId !== undefined) {
      const version = readOption(argv, '--version');
      const url = readOption(argv, '--url');
      registry = patchEntry(registryPath, pluginId, version, url, now);
      summary = `Patched "${pluginId}" -> version=${registry.mfes[pluginId].version}, remoteEntry=${registry.mfes[pluginId].remoteEntry}`;
    } else {
      const baseUrl = readOption(argv, '--base-url');
      registry = generateRegistry({
        repoRoot,
        baseUrl: baseUrl ?? env.REGISTRY_BASE_URL,
      });
      summary = `Regenerated registry with ${Object.keys(registry.mfes).length} entrie(s)`;
    }

    // Defensive re-validate before writing (patchEntry already validates input;
    // this guards generate output and the patched result equally).
    assertValidRegistry(registry);
    writeRegistry(registryPath, registry);

    out.log(`${summary} -> ${registryPath}`);
    return 0;
  } catch (error) {
    out.error(error instanceof Error ? error.message : String(error));
    out.error('');
    out.error(USAGE);
    return 1;
  }
}
