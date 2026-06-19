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
 * Registry reader interface + file-backed reference implementation
 * (Phase 13, Story 3).
 *
 * The browser does NOT see the v2 registry document. The OSD server reads it,
 * RESOLVES it for the requesting host (across the {@link ResolutionDimensions}
 * dimensions), and injects the resulting flat {@link BootManifest} into the
 * boot HTML. This module is the SERVER-SIDE I/O wrapper around the pure
 * resolver from story 2.
 *
 * The {@link RegistryReader} interface is the swap point for a future
 * production registry service: a `HttpRegistryReader` (or `S3RegistryReader`,
 * `DynamoRegistryReader`) implementing the same interface plugs in without
 * any change to the OSD server code that calls `reader.resolve(dimensions)`.
 *
 * {@link FileRegistryReader} — the reference implementation — reads a v2 (or
 * v1, auto-migrated via {@link coerceToV2Document}) document from disk on
 * every call. Caching with mtime-based hot-reload mirrors the Phase 2
 * `FileRegistryProvider` so a registry edit is reflected on the very next
 * request without a restart. The auto-migration is what lets the canonical
 * CDN registry (v1 shape) keep working unchanged.
 */

import Fs from 'fs';

import { BootManifest } from './boot_manifest';
import { resolveBootManifest } from './resolve_v2';
import {
  ResolutionDimensions,
  V2Document,
  coerceToV2Document,
} from './schema_v2';

/**
 * A source of resolved boot manifests, parameterised on the requesting host's
 * dimensions. Implementations are responsible for freshness (file mtime
 * hot-reload, HTTP TTL/poll, ...). Callers ask for the current resolution and
 * must tolerate it changing between calls — that is the point of a dynamic
 * registry.
 *
 * Note this interface is INTENTIONALLY narrow: a single async method.
 * Everything below the surface (file I/O, HTTP, signature verification on the
 * doc bytes if any) lives in the implementation.
 */
export interface RegistryReader {
  /**
   * Return the resolved boot manifest for the requesting host. May read the
   * backing store; implementations should cache and only refresh when the
   * source changed.
   *
   * @throws Error if the backing store is missing, the document is invalid, or
   *   the auto-migration fails (a malformed v1 doc is not silently coerced).
   */
  resolve(dimensions: ResolutionDimensions): Promise<BootManifest>;
}

/**
 * Minimal filesystem surface {@link FileRegistryReader} needs. Injectable so
 * tests can drive mtime/read-count deterministically without touching disk.
 * Defaults to node's `fs`.
 */
export interface RegistryReaderFs {
  statSync(path: string): { mtimeMs: number };
  readFileSync(path: string, encoding: 'utf8'): string;
}

/** Options for {@link FileRegistryReader}. */
export interface FileRegistryReaderOptions {
  /**
   * Path to the registry document on disk. Required. The harness sets this
   * to its `registry/registry.json` (the v1 canonical doc, auto-migrated on
   * read); production deployments should drop the v2 doc at a stable path
   * and re-write atomically (mv-into-place) so the mtime hot-reload works
   * without partial reads.
   */
  path: string;
  /** Injectable filesystem (for testing). Defaults to node `fs`. */
  fs?: RegistryReaderFs;
}

/** Internal cache slot: the validated v2 doc + the mtime it was read at. */
interface CacheSlot {
  mtimeMs: number;
  doc: V2Document;
}

/**
 * File-backed {@link RegistryReader} with mtime-based hot-reload.
 *
 * The first {@link resolve} parses, validates and (if needed) auto-migrates
 * the file, remembering its `mtimeMs`. Subsequent resolves `stat` the file
 * and:
 *   - reuse the cached v2 doc when `mtimeMs` is unchanged (no re-parse,
 *     ~zero cost, just a per-call run of the pure resolver),
 *   - re-read, re-validate and re-migrate when `mtimeMs` changed.
 *
 * The PURE resolver (`resolveBootManifest`) runs on every call regardless of
 * cache state — a different `dimensions` pair must yield a different manifest
 * even from the same document. The cache only avoids the I/O + parse cost.
 */
export class FileRegistryReader implements RegistryReader {
  private readonly path: string;
  private readonly fs: RegistryReaderFs;
  private cache: CacheSlot | undefined;

  constructor(options: FileRegistryReaderOptions) {
    if (!options || !options.path) {
      throw new Error(
        'FileRegistryReader: a non-empty `path` option is required (the v2/v1 registry file).'
      );
    }
    this.path = options.path;
    this.fs = options.fs ?? Fs;
  }

  /** The resolved registry file path this reader reads from. */
  public get filePath(): string {
    return this.path;
  }

  /** @inheritdoc */
  public async resolve(dimensions: ResolutionDimensions): Promise<BootManifest> {
    const doc = this.readAndCacheDoc();
    return resolveBootManifest(doc, dimensions);
  }

  /**
   * Read the v2 doc from disk (or the cached copy if mtime unchanged), running
   * `coerceToV2Document` to auto-migrate v1 inputs. Made public-ish via the
   * private wrapper so the read+cache logic is shared with the resolve path.
   */
  private readAndCacheDoc(): V2Document {
    const { mtimeMs } = this.statOrThrow();

    if (this.cache && this.cache.mtimeMs === mtimeMs) {
      return this.cache.doc;
    }

    const doc = this.parseAndCoerce();
    this.cache = { mtimeMs, doc };
    return doc;
  }

  private statOrThrow(): { mtimeMs: number } {
    try {
      return this.fs.statSync(this.path);
    } catch (cause) {
      throw new Error(
        `FileRegistryReader: cannot stat registry at ${this.path}: ${
          (cause as Error).message
        }`
      );
    }
  }

  private parseAndCoerce(): V2Document {
    let raw: string;
    try {
      raw = this.fs.readFileSync(this.path, 'utf8');
    } catch (cause) {
      throw new Error(
        `FileRegistryReader: cannot read registry at ${this.path}: ${
          (cause as Error).message
        }`
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (cause) {
      throw new Error(
        `FileRegistryReader: registry at ${this.path} is not valid JSON: ${
          (cause as Error).message
        }`
      );
    }

    // Throws a descriptive Error (path-prefixed) on a malformed v1/v2 doc.
    return coerceToV2Document(parsed);
  }
}
