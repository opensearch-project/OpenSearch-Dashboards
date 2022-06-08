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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { get } from 'lodash';
import { set } from '@elastic/safer-lodash-set';
import { unset } from '@osd/std';
import { ConfigDeprecation, ConfigDeprecationLogger, ConfigDeprecationFactory } from './types';

const _rename = (
  config: Record<string, any>,
  rootPath: string,
  log: ConfigDeprecationLogger,
  oldKey: string,
  newKey: string,
  silent?: boolean
) => {
  const fullOldPath = getPath(rootPath, oldKey);
  const oldValue = get(config, fullOldPath);
  if (oldValue === undefined) {
    return config;
  }

  unset(config, fullOldPath);

  const fullNewPath = getPath(rootPath, newKey);
  const newValue = get(config, fullNewPath);
  if (newValue === undefined) {
    set(config, fullNewPath, oldValue);

    if (!silent) {
      log(`"${fullOldPath}" is deprecated and has been replaced by "${fullNewPath}"`);
    }
  } else {
    if (!silent) {
      log(
        `"${fullOldPath}" is deprecated and has been replaced by "${fullNewPath}". However both key are present, ignoring "${fullOldPath}"`
      );
    }
  }
  return config;
};

const _renameWithoutMap = (
  config: Record<string, any>,
  rootPath: string,
  log: ConfigDeprecationLogger,
  oldKey: string,
  newKey: string,
  silent?: boolean
) => {
  const fullOldPath = getPath(rootPath, oldKey);
  const oldValue = get(config, fullOldPath);

  const fullNewPath = getPath(rootPath, newKey);
  const newValue = get(config, fullNewPath);

  if (oldValue !== undefined) {
    if (!silent) {
      log(`"${fullOldPath}" is deprecated and has been replaced by "${fullNewPath}"`);
    }

    return config;
  }

  if (newValue === undefined) {
    return config;
  }

  unset(config, fullNewPath);
  set(config, fullOldPath, newValue);
  return config;
};

const _unused = (
  config: Record<string, any>,
  rootPath: string,
  log: ConfigDeprecationLogger,
  unusedKey: string
) => {
  const fullPath = getPath(rootPath, unusedKey);
  if (get(config, fullPath) === undefined) {
    return config;
  }
  unset(config, fullPath);
  log(`${fullPath} is deprecated and is no longer used`);
  return config;
};

const renameWithoutMap = (oldKey: string, newKey: string): ConfigDeprecation => (
  config,
  rootPath,
  log
) => _renameWithoutMap(config, rootPath, log, oldKey, newKey);

const renameFromRootWithoutMap = (
  oldKey: string,
  newKey: string,
  silent?: boolean
): ConfigDeprecation => (config, rootPath, log) =>
  _renameWithoutMap(config, '', log, oldKey, newKey, silent);

const rename = (oldKey: string, newKey: string): ConfigDeprecation => (config, rootPath, log) =>
  _rename(config, rootPath, log, oldKey, newKey);

const renameFromRoot = (oldKey: string, newKey: string, silent?: boolean): ConfigDeprecation => (
  config,
  rootPath,
  log
) => _rename(config, '', log, oldKey, newKey, silent);

const unused = (unusedKey: string): ConfigDeprecation => (config, rootPath, log) =>
  _unused(config, rootPath, log, unusedKey);

const unusedFromRoot = (unusedKey: string): ConfigDeprecation => (config, rootPath, log) =>
  _unused(config, '', log, unusedKey);

const getPath = (rootPath: string, subPath: string) =>
  rootPath !== '' ? `${rootPath}.${subPath}` : subPath;

/**
 * The actual platform implementation of {@link ConfigDeprecationFactory}
 *
 * @internal
 */
export const configDeprecationFactory: ConfigDeprecationFactory = {
  rename,
  renameFromRoot,
  renameWithoutMap,
  renameFromRootWithoutMap,
  unused,
  unusedFromRoot,
};
