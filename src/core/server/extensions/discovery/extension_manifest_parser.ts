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

import { readFile, stat } from 'fs';
import { resolve } from 'path';
import { coerce } from 'semver';
import { promisify } from 'util';
import { snakeCase } from 'lodash';
import { isConfigPath, PackageInfo } from '../../config';
import { Logger } from '../../logging';
import { ExtensionManifest } from '../types';
import { ExtensionDiscoveryError } from './extension_discovery_error';
import { isCamelCase } from './is_camel_case';

const fsReadFileAsync = promisify(readFile);
const fsStatAsync = promisify(stat);

/**
 * Name of the JSON manifest file that should be located in the extension directory.
 */
const MANIFEST_FILE_NAME = 'opensearch_dashboards.json';

/**
 * The special "opensearchDashboards" version can be used by the extensions to be always compatible.
 */
const ALWAYS_COMPATIBLE_VERSION = 'opensearchDashboards';

/**
 * Names of the known manifest fields.
 */
const KNOWN_MANIFEST_FIELDS = (() => {
  // We use this trick to have type safety around the keys we use, if we forget to
  // add a new key here or misspell existing one, TypeScript compiler will complain.
  // We do this once at run time, so performance impact is negligible.
  const manifestFields: { [P in keyof ExtensionManifest]: boolean } = {
    extensionId: true,
    opensearchDashboardsVersion: true,
    version: true,
    configPath: true,
    requiredExtensions: true,
    optionalExtensions: true,
    requiredPlugins: true,
    optionalPlugins: true,
    ui: true,
    server: true,
    extraPublicDirs: true,
    requiredBundles: true,
  };

  return new Set(Object.keys(manifestFields));
})();

/**
 * Tries to load and parse the extension manifest file located at the provided extension
 * directory path and produces an error result if it fails to do so or extension manifest
 * isn't valid.
 * @param extensionPath Path to the extension directory where manifest should be loaded from.
 * @param packageInfo OpenSearch Dashboards package info.
 * @internal
 */
export async function parseManifest(
  extensionPath: string,
  packageInfo: PackageInfo,
  log: Logger
): Promise<ExtensionManifest> {
  const manifestPath = resolve(extensionPath, MANIFEST_FILE_NAME);

  let manifestContent;
  try {
    manifestContent = await fsReadFileAsync(manifestPath);
  } catch (err) {
    throw ExtensionDiscoveryError.missingManifest(manifestPath, err);
  }

  let manifest: Partial<ExtensionManifest>;
  try {
    manifest = JSON.parse(manifestContent.toString());
  } catch (err) {
    throw ExtensionDiscoveryError.invalidManifest(manifestPath, err);
  }

  if (!manifest || typeof manifest !== 'object') {
    throw ExtensionDiscoveryError.invalidManifest(
      manifestPath,
      new Error('Extension manifest must contain a JSON encoded object.')
    );
  }

  if (!manifest.extensionId || typeof manifest.extensionId !== 'string') {
    throw ExtensionDiscoveryError.invalidManifest(
      manifestPath,
      new Error('Extension manifest must contain an "extensionId" property.')
    );
  }

  // Extension extensionId can be used as a config path or as a logger context and having dots
  // in there may lead to various issues, so we forbid that.
  if (manifest.extensionId.includes('.')) {
    throw ExtensionDiscoveryError.invalidManifest(
      manifestPath,
      new Error('Extension "extensionId" must not include `.` characters.')
    );
  }

  if (!packageInfo.dist && !isCamelCase(manifest.extensionId)) {
    log.warn(`Expect extension "extensionId" in camelCase, but found: ${manifest.extensionId}`);
  }

  if (!manifest.version || typeof manifest.version !== 'string') {
    throw ExtensionDiscoveryError.invalidManifest(
      manifestPath,
      new Error(
        `Extension manifest for "${manifest.extensionId}" must contain a "version" property.`
      )
    );
  }

  if (manifest.configPath !== undefined && !isConfigPath(manifest.configPath)) {
    throw ExtensionDiscoveryError.invalidManifest(
      manifestPath,
      new Error(
        `The "configPath" in extension manifest for "${manifest.extensionId}" should either be a string or an array of strings.`
      )
    );
  }

  if (
    manifest.extraPublicDirs &&
    (!Array.isArray(manifest.extraPublicDirs) ||
      !manifest.extraPublicDirs.every((dir) => typeof dir === 'string'))
  ) {
    throw ExtensionDiscoveryError.invalidManifest(
      manifestPath,
      new Error(
        `The "extraPublicDirs" in extension manifest for "${manifest.extensionId}" should be an array of strings.`
      )
    );
  }

  const expectedOpenSearchDashboardsVersion =
    typeof manifest.opensearchDashboardsVersion === 'string' && manifest.opensearchDashboardsVersion
      ? manifest.opensearchDashboardsVersion
      : manifest.version;
  if (!isVersionCompatible(expectedOpenSearchDashboardsVersion, packageInfo.version)) {
    throw ExtensionDiscoveryError.incompatibleVersion(
      manifestPath,
      new Error(
        `Extension "${manifest.extensionId}" is only compatible with OpenSearch Dashboards version "${expectedOpenSearchDashboardsVersion}", but used OpenSearch Dashboards version is "${packageInfo.version}".`
      )
    );
  }

  const includesServerExtension = typeof manifest.server === 'boolean' ? manifest.server : false;
  const includesUiExtension = typeof manifest.ui === 'boolean' ? manifest.ui : false;
  if (!includesServerExtension && !includesUiExtension) {
    throw ExtensionDiscoveryError.invalidManifest(
      manifestPath,
      new Error(
        `Both "server" and "ui" are missing or set to "false" in extension manifest for "${manifest.extensionId}", but at least one of these must be set to "true".`
      )
    );
  }

  const unknownManifestKeys = Object.keys(manifest).filter(
    (key) => !KNOWN_MANIFEST_FIELDS.has(key)
  );
  if (unknownManifestKeys.length > 0) {
    throw ExtensionDiscoveryError.invalidManifest(
      manifestPath,
      new Error(
        `Manifest for extension "${manifest.extensionId}" contains the following unrecognized properties: ${unknownManifestKeys}.`
      )
    );
  }

  return {
    extensionId: manifest.extensionId,
    version: manifest.version,
    opensearchDashboardsVersion: expectedOpenSearchDashboardsVersion,
    configPath: manifest.configPath || snakeCase(manifest.extensionId),
    requiredExtensions: Array.isArray(manifest.requiredExtensions)
      ? manifest.requiredExtensions
      : [],
    optionalExtensions: Array.isArray(manifest.optionalExtensions)
      ? manifest.optionalExtensions
      : [],
    requiredBundles: Array.isArray(manifest.requiredBundles) ? manifest.requiredBundles : [],
    requiredPlugins: Array.isArray(manifest.requiredPlugins) ? manifest.requiredPlugins : [],
    optionalPlugins: Array.isArray(manifest.optionalPlugins) ? manifest.optionalPlugins : [],
    ui: includesUiExtension,
    server: includesServerExtension,
    extraPublicDirs: manifest.extraPublicDirs,
  };
}

/**
 * Checks whether specified folder contains OpenSearch Dashboards new platform extension. It's only
 * intended to be used by the legacy systems when they need to check whether specific
 * extension path is handled by the core extension system or not.
 * @param extensionPath Path to the extension.
 * @internal
 */
export async function isNewPlatformExtension(extensionPath: string) {
  try {
    return (await fsStatAsync(resolve(extensionPath, MANIFEST_FILE_NAME))).isFile();
  } catch (err) {
    return false;
  }
}

/**
 * Checks whether extension expected OpenSearch Dashboards version is compatible with the used OpenSearch Dashboards version.
 * @param expectedOpenSearchDashboardsVersion OpenSearch Dashboards version expected by the extension.
 * @param actualOpenSearchDashboardsVersion Used OpenSearch Dashboards version.
 */
function isVersionCompatible(
  expectedOpenSearchDashboardsVersion: string,
  actualOpenSearchDashboardsVersion: string
) {
  if (expectedOpenSearchDashboardsVersion === ALWAYS_COMPATIBLE_VERSION) {
    return true;
  }

  const coercedActualOpenSearchDashboardsVersion = coerce(actualOpenSearchDashboardsVersion);
  if (coercedActualOpenSearchDashboardsVersion == null) {
    return false;
  }

  const coercedExpectedOpenSearchDashboardsVersion = coerce(expectedOpenSearchDashboardsVersion);
  if (coercedExpectedOpenSearchDashboardsVersion == null) {
    return false;
  }

  // Compare coerced versions, e.g. `1.2.3` ---> `1.2.3` and `7.0.0-alpha1` ---> `7.0.0`.
  return (
    coercedActualOpenSearchDashboardsVersion.compare(coercedExpectedOpenSearchDashboardsVersion) ===
    0
  );
}
