/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Headers, OpenSearchDashboardsRequest } from 'src/core/server';

export interface ApplicationConfigPluginSetup {
  getConfigurationClient: (request?: OpenSearchDashboardsRequest) => ConfigurationClient;
  registerConfigurationClient: (inputConfigurationClient: ConfigurationClient) => void;
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ApplicationConfigPluginStart {}

export interface ConfigurationClientOptions {
  headers: Headers;
}

/**
 * The interface defines the operations against the application configurations at both entity level and whole level.
 *
 */
export interface ConfigurationClient {
  /**
   * Get all the configurations.
   *
   * @param {options} options, an optional parameter
   * @returns {Map<string, string>} all the configurations
   */
  getConfig(options?: ConfigurationClientOptions): Promise<Map<string, string>>;

  /**
   * Get the value for the input entity.
   *
   * @param {entity} name of the entity
   * @param {options} options, an optional parameter
   * @returns {string} value of the entity
   */
  getEntityConfig(entity: string, options?: ConfigurationClientOptions): Promise<string>;

  /**
   * Update the input entity with a new value.
   *
   * @param {entity} name of the entity
   * @param {newValue} new configuration value of the entity
   * @param {options} options, an optional parameter
   * @returns {string} updated configuration value of the entity
   */
  updateEntityConfig(
    entity: string,
    newValue: string,
    options?: ConfigurationClientOptions
  ): Promise<string>;

  /**
   * Delete the input entity from configurations.
   *
   * @param {entity} name of the entity
   * @param {options} options, an optional parameter
   * @returns {string} name of the deleted entity
   */
  deleteEntityConfig(entity: string, options?: ConfigurationClientOptions): Promise<string>;
}
