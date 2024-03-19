/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IScopedClusterClient } from 'src/core/server';

export interface ApplicationConfigPluginSetup {
  getConfigurationClient: (inputOpenSearchClient: IScopedClusterClient) => ConfigurationClient;
  registerConfigurationClient: (inputConfigurationClient: ConfigurationClient) => void;
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ApplicationConfigPluginStart {}

/**
 * The interface defines the operations against the application configurations at both entity level and whole level.
 *
 */
export interface ConfigurationClient {
  /**
   * Get all the configurations.
   *
   * @param {array} array of connections
   * @returns {ConnectionPool}
   */
  getConfig(): Promise<Map<string, string>>;

  /**
   * Get the value for the input entity.
   *
   * @param {entity} name of the entity
   * @returns {string} value of the entity
   */
  getEntityConfig(entity: string): Promise<string>;

  /**
   * Update the input entity with a new value.
   *
   * @param {entity} name of the entity
   * @param {newValue} new configuration value of the entity
   * @returns {string} updated configuration value of the entity
   */
  updateEntityConfig(entity: string, newValue: string): Promise<string>;

  /**
   * Delete the input entity from configurations.
   *
   * @param {entity} name of the entity
   * @returns {string} name of the deleted entity
   */
  deleteEntityConfig(entity: string): Promise<string>;
}
