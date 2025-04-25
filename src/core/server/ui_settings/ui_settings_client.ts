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

import { defaultsDeep, omit } from 'lodash';

import { SavedObjectsErrorHelpers } from '../saved_objects';
import { SavedObjectsClientContract } from '../saved_objects/types';
import { Logger } from '../logging';
import { createOrUpgradeSavedConfig } from './create_or_upgrade_saved_config';
import {
  IUiSettingsClient,
  UiSettingsParams,
  PublicUiSettingsParams,
  UiSettingScope,
} from './types';
import { CannotOverrideError } from './ui_settings_errors';
import { buildDocIdWithScope } from './utils';

export interface UiSettingsServiceOptions {
  type: string;
  id: string;
  buildNum: number;
  savedObjectsClient: SavedObjectsClientContract;
  overrides?: Record<string, any>;
  defaults?: Record<string, UiSettingsParams>;
  log: Logger;
}

interface ReadOptions {
  ignore401Errors?: boolean;
  autoCreateOrUpgradeIfMissing?: boolean;
  scope?: UiSettingScope;
  ignore404Errors?: boolean;
}

interface UserProvidedValue<T = unknown> {
  userValue?: T;
  isOverridden?: boolean;
}

type UiSettingsRawValue = UiSettingsParams & UserProvidedValue;

type UserProvided<T = unknown> = Record<string, UserProvidedValue<T>>;
type UiSettingsRaw = Record<string, UiSettingsRawValue>;

/**
 * default scope read options, order matters
 * for user setting, we don't want to create the record when user visit the dashboard that's get,
 * that will have too much records without any actual setting in it, instead do create when write at first time
 */
const UiSettingScopeReadOptions = [
  {
    scope: UiSettingScope.GLOBAL,
    ignore401Errors: false,
    autoCreateOrUpgradeIfMissing: true,
    ignore404Errors: false,
  },
  {
    scope: UiSettingScope.WORKSPACE,
    ignore401Errors: true,
    autoCreateOrUpgradeIfMissing: false,
    ignore404Errors: true,
  },
  {
    scope: UiSettingScope.USER,
    ignore401Errors: true,
    autoCreateOrUpgradeIfMissing: false,
    ignore404Errors: true,
  },
] as ReadOptions[];

export class UiSettingsClient implements IUiSettingsClient {
  private readonly type: UiSettingsServiceOptions['type'];
  private readonly id: UiSettingsServiceOptions['id'];
  private readonly buildNum: UiSettingsServiceOptions['buildNum'];
  private readonly savedObjectsClient: UiSettingsServiceOptions['savedObjectsClient'];
  private readonly overrides: NonNullable<UiSettingsServiceOptions['overrides']>;
  private readonly defaults: NonNullable<UiSettingsServiceOptions['defaults']>;
  private readonly log: Logger;
  private readonly userLevelSettingsKeys: string[] = [];
  private readonly workspaceLevelSettingsKeys: string[] = [];
  private readonly globalLevelSettingsKeys: string[] = [];
  private readonly uiSettingsKeysWithMoreThanOneScope: string[] = [];

  constructor(options: UiSettingsServiceOptions) {
    const { type, id, buildNum, savedObjectsClient, log, defaults = {}, overrides = {} } = options;

    this.type = type;
    this.id = id;
    this.buildNum = buildNum;
    this.savedObjectsClient = savedObjectsClient;
    this.defaults = defaults;
    this.overrides = overrides;
    this.log = log;
    this.groupSettingsKeys(this.defaults);
  }

  getRegistered() {
    const copiedDefaults: Record<string, PublicUiSettingsParams> = {};
    for (const [key, value] of Object.entries(this.defaults)) {
      copiedDefaults[key] = omit(value, 'schema');
    }
    return copiedDefaults;
  }

  getOverrideOrDefault<T = unknown>(key: string): T {
    // Note: this.overrides is an object with simple values, whereas this.defaults contains UiSettingsParams as the value for each key.
    return this.isOverridden(key) ? this.overrides[key] : this.defaults[key]?.value;
  }

  getDefault(key: string): unknown {
    return this.defaults[key]?.value;
  }

  async get<T = any>(key: string, scope?: UiSettingScope): Promise<T> {
    const all = await this.getAll(scope);
    return all[key];
  }

  async getAll<T = any>(scope?: UiSettingScope) {
    const raw = await this.getRaw(scope);

    return Object.keys(raw).reduce((all, key) => {
      const item = raw[key];
      all[key] = ('userValue' in item ? item.userValue : item.value) as T;
      return all;
    }, {} as Record<string, T>);
  }

  async getUserProvided<T = unknown>(scope?: UiSettingScope): Promise<UserProvided<T>> {
    let userProvided: UserProvided<T> = {};
    if (scope) {
      const readOptions = UiSettingScopeReadOptions.find((option) => option.scope === scope);
      userProvided = this.onReadHook<T>(await this.read(readOptions));
    } else {
      // default will get from all scope and merge
      // loop UiSettingScopeReadOptions
      for (const readOptions of UiSettingScopeReadOptions) {
        userProvided = { ...userProvided, ...this.onReadHook<T>(await this.read(readOptions)) };
      }
    }

    // write all overridden keys, dropping the userValue is override is null and
    // adding keys for overrides that are not in saved object
    for (const [key, value] of Object.entries(this.overrides)) {
      userProvided[key] =
        value === null ? { isOverridden: true } : { isOverridden: true, userValue: value };
    }

    return userProvided;
  }

  async setMany(changes: Record<string, any>, scope?: UiSettingScope) {
    this.onWriteHook(changes, scope);

    if (scope) {
      await this.write({ changes, scope });
    } else {
      // group changes into different scope
      const [global, personal, workspace] = this.groupChanges(changes);
      if (global && Object.keys(global).length > 0) {
        await this.write({ changes: global });
      }
      if (personal && Object.keys(personal).length > 0) {
        await this.write({ changes: personal, scope: UiSettingScope.USER });
      }
      if (workspace && Object.keys(workspace).length > 0) {
        await this.write({ changes: workspace, scope: UiSettingScope.WORKSPACE });
      }
    }
  }

  async set(key: string, value: any, scope?: UiSettingScope) {
    await this.setMany({ [key]: value }, scope);
  }

  async remove(key: string, scope?: UiSettingScope) {
    await this.set(key, null, scope);
  }

  async removeMany(keys: string[], scope?: UiSettingScope) {
    const changes: Record<string, null> = {};
    keys.forEach((key) => {
      changes[key] = null;
    });
    await this.setMany(changes, scope);
  }

  isOverridden(key: string) {
    return this.overrides.hasOwnProperty(key);
  }

  private assertUpdateAllowed(key: string) {
    if (this.isOverridden(key)) {
      throw new CannotOverrideError(`Unable to update "${key}" because it is overridden`);
    }
  }

  private async getRaw(scope?: UiSettingScope): Promise<UiSettingsRaw> {
    const userProvided = await this.getUserProvided(scope);
    return defaultsDeep(userProvided, this.defaults);
  }

  private validateKey(key: string, value: unknown) {
    const definition = this.defaults[key];
    if (value === null || definition === undefined) return;
    if (definition.schema) {
      definition.schema.validate(value, {}, `validation [${key}]`);
    }
  }

  private validateScope(key: string, value: unknown, scope?: UiSettingScope) {
    const definition = this.defaults[key];
    if (value === null || definition === undefined) return;
    const validScopes = Array.isArray(definition.scope)
      ? definition.scope
      : [definition.scope || UiSettingScope.GLOBAL];
    if (scope && !validScopes.includes(scope)) {
      throw new Error(
        `Unable to update "${key}" with "${scope}" because the valid scopes are "${validScopes}"`
      );
    }
  }

  private onWriteHook(changes: Record<string, unknown>, scope?: UiSettingScope) {
    for (const key of Object.keys(changes)) {
      this.assertUpdateAllowed(key);
    }

    for (const [key, value] of Object.entries(changes)) {
      this.validateKey(key, value);
    }

    for (const [key, value] of Object.entries(changes)) {
      this.validateScope(key, value, scope);
    }
  }

  private onReadHook<T = unknown>(values: Record<string, unknown>) {
    // write the userValue for each key stored in the saved object that is not overridden
    // validate value read from saved objects as it can be changed via SO API
    const filteredValues: UserProvided<T> = {};
    for (const [key, userValue] of Object.entries(values)) {
      if (userValue === null || this.isOverridden(key)) continue;
      try {
        this.validateKey(key, userValue);
        filteredValues[key] = {
          userValue: userValue as T,
        };
      } catch (error) {
        this.log.warn(`Ignore invalid UiSettings value. ${error}.`);
      }
    }

    return filteredValues;
  }

  private groupSettingsKeys(defaults: NonNullable<UiSettingsServiceOptions['defaults']>) {
    Object.entries(defaults).forEach(([key, value]) => {
      if (Array.isArray(value.scope) && (value.scope?.length ?? 0) > 1) {
        this.uiSettingsKeysWithMoreThanOneScope.push(key);
      }
      if (
        value.scope === UiSettingScope.USER ||
        (Array.isArray(value.scope) && value.scope.includes(UiSettingScope.USER))
      ) {
        this.userLevelSettingsKeys.push(key);
      }
      if (
        value.scope === UiSettingScope.WORKSPACE ||
        (Array.isArray(value.scope) && value.scope.includes(UiSettingScope.WORKSPACE))
      ) {
        this.workspaceLevelSettingsKeys.push(key);
      }
      if (
        value.scope === UiSettingScope.GLOBAL ||
        (Array.isArray(value.scope) && value.scope.includes(UiSettingScope.GLOBAL))
      ) {
        this.globalLevelSettingsKeys.push(key);
      }
    });
  }

  /**
   * group change into different scopes
   * @param changes ui setting changes
   * @returns [global, user]
   */
  private groupChanges(changes: Record<string, any>) {
    const userChanges = {} as Record<string, any>;
    const globalChanges = {} as Record<string, any>;
    const workspaceChanges = {} as Record<string, any>;

    Object.entries(changes).forEach(([key, val]) => {
      if (this.uiSettingsKeysWithMoreThanOneScope.includes(key)) {
        // if this setting has more than one scope, we should not update this setting without specifying scope
        throw new Error(`Unable to update "${key}", because it has multiple scopes`);
      } else if (this.userLevelSettingsKeys.includes(key)) {
        userChanges[key] = val;
      } else if (this.workspaceLevelSettingsKeys.includes(key)) {
        workspaceChanges[key] = val;
      } else {
        globalChanges[key] = val;
      }
    });

    return [globalChanges, userChanges, workspaceChanges];
  }

  private async write({
    changes,
    autoCreateOrUpgradeIfMissing = true,
    scope,
  }: {
    changes: Record<string, any>;
    autoCreateOrUpgradeIfMissing?: boolean;
    scope?: UiSettingScope;
  }) {
    changes = this.translateChanges(changes, 'timeline', 'timelion');
    try {
      const docId = buildDocIdWithScope(this.id, scope);
      await this.savedObjectsClient.update(this.type, docId, changes);
    } catch (error) {
      if (!SavedObjectsErrorHelpers.isNotFoundError(error) || !autoCreateOrUpgradeIfMissing) {
        throw error;
      }

      await createOrUpgradeSavedConfig({
        savedObjectsClient: this.savedObjectsClient,
        version: this.id,
        buildNum: this.buildNum,
        log: this.log,
        handleWriteErrors: false,
        scope,
      });

      await this.write({
        changes,
        autoCreateOrUpgradeIfMissing: false,
        scope,
      });
    }
  }

  private async read({
    ignore401Errors = false,
    autoCreateOrUpgradeIfMissing = true,
    ignore404Errors = false,
    scope,
  }: ReadOptions = {}): Promise<Record<string, any>> {
    try {
      const docId = buildDocIdWithScope(this.id, scope);
      const resp = await this.savedObjectsClient.get<Record<string, any>>(this.type, docId);
      return this.translateChanges(resp.attributes, 'timelion', 'timeline');
    } catch (error) {
      if (SavedObjectsErrorHelpers.isNotFoundError(error) && autoCreateOrUpgradeIfMissing) {
        const failedUpgradeAttributes = await createOrUpgradeSavedConfig({
          savedObjectsClient: this.savedObjectsClient,
          version: this.id,
          buildNum: this.buildNum,
          log: this.log,
          handleWriteErrors: true,
          scope,
        });

        if (!failedUpgradeAttributes) {
          return await this.read({
            ignore401Errors,
            autoCreateOrUpgradeIfMissing: false,
            scope,
          });
        }

        return failedUpgradeAttributes;
      }

      // ignore 404 and return an empty object
      if (ignore404Errors && SavedObjectsErrorHelpers.isNotFoundError(error)) {
        return {};
      }

      if (this.isIgnorableError(error, ignore401Errors)) {
        return {};
      }

      throw error;
    }
  }

  private isIgnorableError(error: Error, ignore401Errors: boolean) {
    const {
      isForbiddenError,
      isOpenSearchUnavailableError,
      isNotAuthorizedError,
    } = this.savedObjectsClient.errors;

    return (
      isForbiddenError(error) ||
      isOpenSearchUnavailableError(error) ||
      (ignore401Errors && isNotAuthorizedError(error))
    );
  }

  // TODO: [RENAMEME] Temporary code for backwards compatibility.
  // https://github.com/opensearch-project/OpenSearch-Dashboards/issues/334
  private translateChanges(changes: Record<string, any>, source: string, dest: string) {
    return Object.keys(changes).reduce((translatedChanges: Record<string, any>, key: string) => {
      translatedChanges[key.replace(source, dest)] = changes[key];
      return translatedChanges;
    }, {});
  }
}
