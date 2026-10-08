/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { UnwrapPromise } from '@osd/utility-types';
import { CoreSetup, Logger, OpenSearchDashboardsRequest } from '../../../../core/server';
import { ConfigSchema } from '../../config';
import { WORKSPACE_PLUGIN_CONFIG_PATH } from '../../common/constants';

/**
 * `DynamicConfigServiceSetup` and `DynamicConfigServiceStart` are not exported from
 * `core/server`, so derive them from the public `CoreSetup` contract.
 */
export type DynamicConfigServiceSetup = CoreSetup['dynamicConfigService'];
type DynamicConfigServiceStart = UnwrapPromise<
  ReturnType<DynamicConfigServiceSetup['getStartService']>
>;

/**
 * Reads the workspace plugin config for a single request.
 */
export interface IScopedWorkspaceConfigClient {
  /**
   * The effective workspace config, preferring the dynamic config values over the ones
   * read from `opensearch_dashboards.yml`.
   */
  get(): Promise<ConfigSchema>;
  /**
   * The effective `workspace.maximum_workspaces`, or undefined when neither source
   * configures a usable maximum, which callers read as "no limit".
   */
  getMaximumWorkspaces(): Promise<number | undefined>;
}

export interface ScopedWorkspaceConfigClientDeps {
  dynamicConfigService: DynamicConfigServiceSetup;
  /**
   * The config read from `opensearch_dashboards.yml`, used whenever the dynamic config
   * service cannot answer.
   */
  staticConfig: ConfigSchema;
  request: OpenSearchDashboardsRequest;
  logger: Logger;
}

const toPositiveNumber = (value: unknown): number | undefined => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

export class ScopedWorkspaceConfigClient implements IScopedWorkspaceConfigClient {
  /**
   * Memoizes the lookup so that the several consumers involved in a single request
   * resolve the config once.
   */
  private dynamicConfigPromise?: Promise<Partial<ConfigSchema> | undefined>;

  constructor(private readonly deps: ScopedWorkspaceConfigClientDeps) {}

  public async get(): Promise<ConfigSchema> {
    return { ...this.deps.staticConfig, ...(await this.getDynamicConfig()) };
  }

  public async getMaximumWorkspaces(): Promise<number | undefined> {
    const dynamicConfig = await this.getDynamicConfig();
    // Fall back to the static value instead of to "no limit" when the dynamic value is
    // missing or not a usable number.
    return (
      toPositiveNumber(dynamicConfig?.maximum_workspaces) ??
      toPositiveNumber(this.deps.staticConfig.maximum_workspaces)
    );
  }

  private async getDynamicConfig(): Promise<Partial<ConfigSchema> | undefined> {
    if (!this.dynamicConfigPromise) {
      this.dynamicConfigPromise = this.fetchDynamicConfig();
    }
    return this.dynamicConfigPromise;
  }

  /**
   * The dynamic config client merges the config store value over the value from
   * `opensearch_dashboards.yml`, so the yml value is still the effective one when the
   * service is disabled (`dynamic_config_service.enabled: false`, the default) or when
   * the store holds no override for this plugin.
   *
   * Returns undefined when the config cannot be resolved, so callers fall back to the
   * statically read config rather than lose the setting entirely.
   */
  private async fetchDynamicConfig(): Promise<Partial<ConfigSchema> | undefined> {
    const { dynamicConfigService, request, logger } = this.deps;

    try {
      const dynamicConfigServiceStart: DynamicConfigServiceStart =
        await dynamicConfigService.getStartService();
      // The async local store is only populated for authenticated requests, so derive
      // the context from the request when it is absent.
      const asyncLocalStorageContext =
        dynamicConfigServiceStart.getAsyncLocalStore() ??
        dynamicConfigServiceStart.createStoreFromRequest(request);

      if (!asyncLocalStorageContext) {
        throw new Error('Invalid request, not able to identify request context');
      }

      return (await dynamicConfigServiceStart
        .getClient()
        .getConfig(
          { pluginConfigPath: WORKSPACE_PLUGIN_CONFIG_PATH },
          { asyncLocalStorageContext }
        )) as Partial<ConfigSchema>;
    } catch (error) {
      logger.warn(
        `Failed to get ${WORKSPACE_PLUGIN_CONFIG_PATH} config from dynamic config service: ${error}`
      );
      return undefined;
    }
  }
}
