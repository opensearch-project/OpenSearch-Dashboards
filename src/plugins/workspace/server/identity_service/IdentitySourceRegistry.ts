/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Logger, OpenSearchClient } from '../../../../core/server';

interface IdentitySourceHandler<T> {
  getUsers?: (
    params: { filter?: string; page?: number; size?: number },
    client: T
  ) => Promise<Array<{ name: string; id?: string }> | []>;
  getRoles?: (
    params: { filter?: string; page?: number; size?: number },
    client: T
  ) => Promise<Array<{ name: string; id?: string }> | []>;
}

export class IdentitySourceRegistry {
  private registry: Record<string, IdentitySourceHandler<any>> = {};
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  private registerSource<T>(source: string, handler: IdentitySourceHandler<T>): void {
    this.registry[source] = handler;
    this.logger.info(`Register ${source} type handler`);
  }

  public setup(): void {
    this.registerSource<OpenSearchClient>('localCluster', {
      getUsers: async ({}, client: OpenSearchClient) => {
        try {
          const response = await client.transport.request({
            method: 'GET',
            path: '/_plugins/_security/api/internalusers',
          });
          return Object.keys(response.body).map((name) => ({ name }));
        } catch (error) {
          this.logger.error(`Failed to get users: ${error.message}`);
          return [];
        }
      },
      getRoles: async ({}, client: OpenSearchClient) => {
        try {
          const response = await client.transport.request({
            method: 'GET',
            path: '/_plugins/_security/api/internalusers',
          });

          return Array.from(
            new Set(
              Object.values(response.body)
                .flatMap((item) => item.backend_roles)
                .filter((role) => role)
            )
          ).map((role) => ({ name: role }));
        } catch (error) {
          this.logger.error(`Failed to get roles: ${error.message}`);
          return [];
        }
      },
    });
  }

  public getSourceHandler<T>(source: string): IdentitySourceHandler<T> {
    const handler = this.registry[source];
    if (!handler) {
      throw new Error(`Identity source '${source}' is not supported.`);
    }
    return handler;
  }
}
