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
 * RegistryProvider (Phase 2, Story 2).
 *
 * The registry is DYNAMIC DATA read at serve time — never a code constant. This
 * module defines the {@link RegistryProvider} interface that decouples callers
 * (`resolve()`, the Phase 3 render path, the harness mock service) from the
 * backing store, plus a file-backed implementation with **mtime-based
 * hot-reload**: each {@link RegistryProvider.read} re-reads the file ONLY when
 * its modification time changed, and serves a cached, validated copy otherwise.
 *
 * Because the backing store sits behind the interface, the same callers can
 * later be pointed at an S3 object / DynamoDB / HTTP registry service (with a
 * TTL/poll cadence) without any code change on their side. See
 * docs/01-MFE-DESIGN.md §5 ("Registry is DYNAMIC — data, not code").
 */

import Fs from 'fs';

import { MfeEntry, Registry, assertValidRegistry } from './schema';

/**
 * A source of the current MFE registry, read at serve time.
 *
 * Implementations are responsible for freshness (file mtime hot-reload, HTTP
 * TTL/poll, …). Callers simply ask for the current data and must tolerate it
 * changing between calls — that is the whole point of a dynamic registry.
 */
export interface RegistryProvider {
  /**
   * Return the CURRENT registry. May re-read the backing store; implementations
   * should cache and only refetch when the source changed.
   *
   * @throws Error if the backing store is missing or holds an invalid registry
   */
  read(): Registry;

  /**
   * Look up a single plugin's remote descriptor in the current registry.
   *
   * @param id plugin id (e.g. `inspector`)
   * @returns the entry, or `undefined` when the id is not in the registry
   */
  getMfe(id: string): MfeEntry | undefined;

  /** List the plugin ids present in the current registry (insertion order). */
  list(): string[];
}

/**
 * The minimal filesystem surface {@link FileRegistryProvider} needs. Injectable
 * so tests can drive mtime/read-count deterministically without touching disk;
 * defaults to node's `fs`.
 */
export interface RegistryFs {
  statSync(path: string): { mtimeMs: number };
  readFileSync(path: string, encoding: 'utf8'): string;
}

/** Options for {@link FileRegistryProvider}. */
export interface FileRegistryProviderOptions {
  /**
   * Path to the registry DATA file. Defaults to the `MFE_REGISTRY_PATH` env var
   * (set by `harness/env.sh` to the workspace `registry/registry.json`). The
   * package intentionally does NOT hardcode an absolute workspace path.
   */
  path?: string;
  /** Injectable filesystem (for testing). Defaults to node `fs`. */
  fs?: RegistryFs;
}

/** Internal cache slot: the validated registry plus the mtime it was read at. */
interface CacheSlot {
  mtimeMs: number;
  registry: Registry;
}

/**
 * File-backed {@link RegistryProvider} with mtime-based hot-reload.
 *
 * The first {@link read} parses and validates the file and remembers its
 * `mtimeMs`. Subsequent reads `stat` the file and:
 * - return the cached registry when `mtimeMs` is unchanged (no parse, ~zero cost),
 * - re-read, re-validate and refresh the cache when `mtimeMs` changed.
 *
 * This makes flipping a version a pure DATA edit: write the file, and the very
 * next `read()` reflects it — no provider re-creation, no restart, no rebuild.
 */
export class FileRegistryProvider implements RegistryProvider {
  private readonly path: string;
  private readonly fs: RegistryFs;
  private cache: CacheSlot | undefined;

  /**
   * @param options see {@link FileRegistryProviderOptions}
   * @throws Error when no path is given and `MFE_REGISTRY_PATH` is unset
   */
  constructor(options: FileRegistryProviderOptions = {}) {
    const path = options.path ?? process.env.MFE_REGISTRY_PATH;
    if (!path) {
      throw new Error(
        'FileRegistryProvider: no registry path. Pass { path } or set MFE_REGISTRY_PATH ' +
          '(harness/env.sh sets it to the workspace registry/registry.json).'
      );
    }
    this.path = path;
    this.fs = options.fs ?? Fs;
  }

  /** The resolved registry file path this provider reads from. */
  public get filePath(): string {
    return this.path;
  }

  /** @inheritdoc */
  public read(): Registry {
    const { mtimeMs } = this.statOrThrow();

    // Cache hit: the file has not changed since we last parsed it.
    if (this.cache && this.cache.mtimeMs === mtimeMs) {
      return this.cache.registry;
    }

    // Cache miss / stale: re-read, parse and validate, then refresh the cache.
    const registry = this.readAndValidate();
    this.cache = { mtimeMs, registry };
    return registry;
  }

  /** @inheritdoc */
  public getMfe(id: string): MfeEntry | undefined {
    return this.read().mfes[id];
  }

  /** @inheritdoc */
  public list(): string[] {
    return Object.keys(this.read().mfes);
  }

  /** `stat` the file, wrapping a missing file in a clear, actionable error. */
  private statOrThrow(): { mtimeMs: number } {
    try {
      return this.fs.statSync(this.path);
    } catch (cause) {
      throw new Error(
        `FileRegistryProvider: cannot stat registry at ${this.path}: ${(cause as Error).message}`
      );
    }
  }

  /** Read + JSON.parse + schema-validate the file, with precise error context. */
  private readAndValidate(): Registry {
    let raw: string;
    try {
      raw = this.fs.readFileSync(this.path, 'utf8');
    } catch (cause) {
      throw new Error(
        `FileRegistryProvider: cannot read registry at ${this.path}: ${(cause as Error).message}`
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (cause) {
      throw new Error(
        `FileRegistryProvider: registry at ${this.path} is not valid JSON: ${
          (cause as Error).message
        }`
      );
    }

    // Throws a descriptive Error listing every schema problem when invalid.
    return assertValidRegistry(parsed);
  }
}
