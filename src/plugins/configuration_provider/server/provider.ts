/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IScopedClusterClient, Logger } from '../../../../src/core/server';

import { ConfigurationClient } from './types';

const CSP_RULES_DOC_ID = 'csp.rules';

export class OpenSearchConfigurationClient implements ConfigurationClient {
  private client: IScopedClusterClient;
  private configurationIndexName: string;
  private readonly logger: Logger;

  constructor(
    inputOpenSearchClient: IScopedClusterClient,
    inputConfigurationIndexName: string,
    inputLogger: Logger
  ) {
    this.client = inputOpenSearchClient;
    this.configurationIndexName = inputConfigurationIndexName;
    this.logger = inputLogger;
  }

  async existsCspRules(): Promise<boolean> {
    try {
      const exists = await this.client.asInternalUser.exists({
        index: this.configurationIndexName,
        id: CSP_RULES_DOC_ID,
      });

      return exists.body;
    } catch (e) {
      const errorMessage = `Failed to call cspRulesExists due to error ${e}`;

      this.logger.error(errorMessage);

      throw e;
    }
  }

  async getCspRules(): Promise<string> {
    try {
      const data = await this.client.asInternalUser.get({
        index: this.configurationIndexName,
        id: CSP_RULES_DOC_ID,
      });

      return data.body._source.value || '';
    } catch (e) {
      const errorMessage = `Failed to call getCspRules due to error ${e}`;

      this.logger.error(errorMessage);

      throw e;
    }
  }

  async updateCspRules(cspRules: string): Promise<string> {
    try {
      await this.client.asCurrentUser.index({
        index: this.configurationIndexName,
        id: CSP_RULES_DOC_ID,
        body: {
          value: cspRules,
        },
      });

      return cspRules;
    } catch (e) {
      const errorMessage = `Failed to call updateCspRules with cspRules ${cspRules} due to error ${e}`;

      this.logger.error(errorMessage);

      throw e;
    }
  }

  async deleteCspRules(): Promise<string> {
    try {
      await this.client.asCurrentUser.delete({
        index: this.configurationIndexName,
        id: CSP_RULES_DOC_ID,
      });

      return CSP_RULES_DOC_ID;
    } catch (e) {
      const errorMessage = `Failed to call deleteCspRules due to error ${e}`;

      this.logger.error(errorMessage);

      throw e;
    }
  }
}
