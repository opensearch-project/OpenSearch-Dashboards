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

import Path from 'path';

import loadJsonFile from 'load-json-file';

import { ToolingLog } from '@osd/dev-utils';
import { Extension } from './load_opensearch_dashboards_platform_extension';

export interface Config {
  skipInstallDependencies: boolean;
  serverSourcePatterns?: string[];
}

const isArrayOfStrings = (v: any): v is string[] =>
  Array.isArray(v) && v.every((p) => typeof p === 'string');

export async function loadConfig(log: ToolingLog, extension: Extension): Promise<Config> {
  try {
    const path = Path.resolve(extension.directory, '.opensearch_dashboards-extension-helpers.json');
    const file = await loadJsonFile(path);

    if (!(typeof file === 'object' && file && !Array.isArray(file))) {
      throw new TypeError(`expected config at [${path}] to be an object`);
    }

    const {
      skipInstallDependencies = false,
      buildSourcePatterns,
      serverSourcePatterns,
      ...rest
    } = file;

    if (typeof skipInstallDependencies !== 'boolean') {
      throw new TypeError(`expected [skipInstallDependencies] at [${path}] to be a boolean`);
    }

    if (buildSourcePatterns) {
      log.warning(
        `DEPRECATED: rename [buildSourcePatterns] to [serverSourcePatterns] in [${path}]`
      );
    }
    const ssp = buildSourcePatterns || serverSourcePatterns;
    if (ssp !== undefined && !isArrayOfStrings(ssp)) {
      throw new TypeError(`expected [serverSourcePatterns] at [${path}] to be an array of strings`);
    }

    if (Object.keys(rest).length) {
      throw new TypeError(`unexpected key in [${path}]: ${Object.keys(rest).join(', ')}`);
    }

    log.info(`Loaded config file from [${path}]`);
    return {
      skipInstallDependencies,
      serverSourcePatterns: ssp,
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {
        skipInstallDependencies: false,
      };
    }

    throw error;
  }
}
