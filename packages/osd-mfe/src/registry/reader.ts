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
 * Registry reader interface + file-backed reference implementation.
 *
 * The browser does NOT see the registry document. The OSD server reads it,
 * RESOLVES it for the requesting host (across the {@link ResolutionDimensions}
 * dimensions), and injects the resulting flat {@link BootManifest} into the
 * boot HTML. This module is the SERVER-SIDE I/O wrapper around the pure
 * resolver.
 *
 * The {@link RegistryReader} interface is the swap point for a future
 * production registry service: a `HttpRegistryReader` (or `S3RegistryReader`,
 * `DynamoRegistryReader`) implementing the same interface plugs in without
 * any change to the OSD server code that calls `reader.resolve(dimensions)`.
 *
 * {@link FileRegistryReader} — the reference implementation — reads a
 * `schemaVersion: 1` document from disk on every call. Caching with
 * mtime-based hot-reload mirrors the `FileRegistryProvider` so a
 * registry edit is reflected on the very next request without a restart.
 */

import Fs from 'fs';

import { BootManifest } from './boot_manifest';
import { resolveBootManifest } from './resolve';
import {
  RegistryDocument,
  ResolutionDimensions,
  assertValidRegistryDocument,
} from './schema';

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
   * @throws Error if the backing store is missing or the document is invalid.
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
   * to its `registry/registry.json` (a `schemaVersion: 1` document);
   * production deployments should drop the document at a stable path and
   * re-write atomically (mv-into-place) so the mtime hot-reload works
   * without partial reads.
   */
  path: string;
  /** Injectable filesystem (for testing). Defaults to node `fs`. */
  fs?: RegistryReaderFs;
}

/** Internal cache slot: the validated document + the mtime it was read at. */
interface CacheSlot {
  mtimeMs: number;
  doc: RegistryDocument;
}

/**
 * File-backed {@link RegistryReader} with mtime-based hot-reload.
 *
 * The first {@link resolve} parses, validates and caches the document,
 * remembering its `mtimeMs`. Subsequent resolves `stat` the file and:
 *   - reuse the cached document when `mtimeMs` is unchanged (no re-parse,
 *     ~zero cost, just a per-call run of the pure resolver),
 *   - re-read and re-validate when `mtimeMs` changed.
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
        'FileRegistryReader: a non-empty `path` option is required (the registry file).'
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
   * Read the document from disk (or the cached copy if mtime unchanged) and
   * validate it as `schemaVersion: 1`. Throws a descriptive Error on any
   * filesystem, JSON, or schema-validation failure.
   */
  private readAndCacheDoc(): RegistryDocument {
    const { mtimeMs } = this.statOrThrow();

    if (this.cache && this.cache.mtimeMs === mtimeMs) {
      return this.cache.doc;
    }

    const doc = this.parseAndValidate();
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

  private parseAndValidate(): RegistryDocument {
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

    // Throws a descriptive Error (path-prefixed) on a malformed document or
    // wrong schemaVersion. The fail-closed posture is intentional: the
    // canonical CDN registry is `schemaVersion: 1` natively; no legacy
    // auto-migration to fall back on.
    return assertValidRegistryDocument(parsed);
  }
}
