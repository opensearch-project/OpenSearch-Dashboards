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

import { readdir, stat } from 'fs';
import { resolve } from 'path';
import { bindNodeCallback, from, merge, Observable } from 'rxjs';
import { catchError, filter, map, mergeMap, shareReplay } from 'rxjs/operators';
import { CoreContext } from '../../core_context';
import { Logger } from '../../logging';
import { ExtensionWrapper } from '../extension';
import { createExtensionInitializerContext, InstanceInfo } from '../extension_context';
import { ExtensionsConfig } from '../extensions_config';
import { ExtensionDiscoveryError } from './extension_discovery_error';
import { parseManifest } from './extension_manifest_parser';

const fsReadDir$ = bindNodeCallback<string, string[]>(readdir);
const fsStat$ = bindNodeCallback(stat);

const maxScanDepth = 5;

interface ExtensionSearchPathEntry {
  dir: string;
  depth: number;
}

/**
 * Tries to discover all possible extensions based on the provided extension config.
 * Discovery result consists of two separate streams, the one (`extension$`) is
 * for the successfully discovered extensions and the other one (`error$`) is for
 * all the errors that occurred during discovery process.
 *
 * @param config Extension config instance.
 * @param coreContext OpenSearch Dashboards core values.
 * @internal
 */
export function discover(
  config: ExtensionsConfig,
  coreContext: CoreContext,
  instanceInfo: InstanceInfo
) {
  const log = coreContext.logger.get('extensions-discovery');
  log.debug('Discovering extensions...');

  if (config.additionalExtensionPaths.length && coreContext.env.mode.dev) {
    log.warn(
      `Explicit extension paths [${config.additionalExtensionPaths}] should only be used in development. Relative imports may not work properly in production.`
    );
  }

  const discoveryResults$ = merge(
    from(config.additionalExtensionPaths),
    processExtensionSearchPaths$(config.extensionSearchPaths, log)
  ).pipe(
    mergeMap((extensionPathOrError) => {
      return typeof extensionPathOrError === 'string'
        ? createExtension$(extensionPathOrError, log, coreContext, instanceInfo)
        : [extensionPathOrError];
    }),
    shareReplay()
  );

  return {
    extension$: discoveryResults$.pipe(
      filter((entry): entry is ExtensionWrapper => entry instanceof ExtensionWrapper)
    ),
    error$: discoveryResults$.pipe(
      filter((entry): entry is ExtensionDiscoveryError => !(entry instanceof ExtensionWrapper))
    ),
  };
}

/**
 * Recursively iterates over every extension search path and returns a merged stream of all
 * sub-directories containing a manifest file. If directory cannot be read or it's impossible to get stat
 * for any of the nested entries then error is added into the stream instead.
 *
 * @param extensionDirs List of the top-level directories to process.
 * @param log Extension discovery logger instance.
 */
function processExtensionSearchPaths$(
  extensionDirs: readonly string[],
  log: Logger
): Observable<string | ExtensionDiscoveryError> {
  function recursiveScanFolder(
    ent: ExtensionSearchPathEntry
  ): Observable<string | ExtensionDiscoveryError> {
    return from([ent]).pipe(
      mergeMap((entry) => {
        return findManifestInFolder(entry.dir, () => {
          if (entry.depth > maxScanDepth) {
            return [];
          }
          return mapSubdirectories(entry.dir, (subDir) =>
            recursiveScanFolder({ dir: subDir, depth: entry.depth + 1 })
          );
        });
      })
    );
  }

  return from(extensionDirs.map((dir) => ({ dir, depth: 0 }))).pipe(
    mergeMap((entry) => {
      log.debug(`Scanning "${entry.dir}" for extension sub-directories...`);
      return fsReadDir$(entry.dir).pipe(
        mergeMap(() => recursiveScanFolder(entry)),
        catchError((err) => [ExtensionDiscoveryError.invalidSearchPath(entry.dir, err)])
      );
    })
  );
}

/**
 * Attempts to read manifest file in specified directory or calls `notFound` and returns results if not found. For any
 * manifest files that cannot be read, a ExtensionDiscoveryError is added.
 * @param dir
 * @param notFound
 */
function findManifestInFolder(
  dir: string,
  notFound: () => never[] | Observable<string | ExtensionDiscoveryError>
): string[] | Observable<string | ExtensionDiscoveryError> {
  return fsStat$(resolve(dir, 'opensearch_dashboards.json')).pipe(
    mergeMap((stats: any) => {
      // `opensearch_dashboards.json` exists in given directory, we got a extension
      if (stats.isFile()) {
        return [dir];
      }
      return [];
    }),
    catchError((manifestStatError) => {
      // did not find manifest. recursively process sub directories until we reach max depth.
      if (manifestStatError.code !== 'ENOENT') {
        return [ExtensionDiscoveryError.invalidExtensionPath(dir, manifestStatError)];
      }
      return notFound();
    })
  );
}

/**
 * Finds all subdirectories in `dir` and executed `mapFunc` for each one. For any directories that cannot be read,
 * a ExtensionDiscoveryError is added.
 * @param dir
 * @param mapFunc
 */
function mapSubdirectories(
  dir: string,
  mapFunc: (subDir: string) => Observable<string | ExtensionDiscoveryError>
): Observable<string | ExtensionDiscoveryError> {
  return fsReadDir$(dir).pipe(
    mergeMap((subDirs: string[]) => subDirs.map((subDir) => resolve(dir, subDir))),
    mergeMap((subDir) =>
      fsStat$(subDir).pipe(
        mergeMap((pathStat: any) => (pathStat.isDirectory() ? mapFunc(subDir) : [])),
        catchError((subDirStatError) => [
          ExtensionDiscoveryError.invalidExtensionPath(subDir, subDirStatError),
        ])
      )
    )
  );
}

/**
 * Tries to load and parse the extension manifest file located at the provided extension
 * directory path and produces an error result if it fails to do so or extension manifest
 * isn't valid.
 * @param path Path to the extension directory where manifest should be loaded from.
 * @param log Extension discovery logger instance.
 * @param coreContext OpenSearch Dashboards core context.
 */
function createExtension$(
  path: string,
  log: Logger,
  coreContext: CoreContext,
  instanceInfo: InstanceInfo
) {
  return from(parseManifest(path, coreContext.env.packageInfo, log)).pipe(
    map((manifest) => {
      log.debug(`Successfully discovered extension "${manifest.extensionId}" at "${path}"`);
      const opaqueId = Symbol(manifest.extensionId);
      return new ExtensionWrapper({
        path,
        manifest,
        opaqueId,
        initializerContext: createExtensionInitializerContext(
          coreContext,
          opaqueId,
          manifest,
          instanceInfo
        ),
      });
    }),
    catchError((err) => [err])
  );
}
