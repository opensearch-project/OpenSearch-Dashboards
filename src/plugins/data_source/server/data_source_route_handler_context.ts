/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// eslint-disable-next-line max-classes-per-file
import { Logger } from 'src/core/server';
import { IDataSourceClient } from './client/data_source_client';

class OpenSearchDataSourceRouteHandlerContext {
  constructor(private dataSourceClient: IDataSourceClient, private logger: Logger) {}

  public async getClient(dataSourceId: string) {
    try {
      const client = await this.dataSourceClient.asDataSource(dataSourceId);
      return client;
    } catch (error) {
      // TODO: convert as audit log when integrate with osd auditing
      // https://github.com/opensearch-project/OpenSearch-Dashboards/issues/1986
      this.logger.error(
        `Fail to get data source client for dataSource id: [${dataSourceId}]. Detail: ${error.messages}`
      );
      throw error;
    }
  }
}

export class DataSourceRouteHandlerContext {
  readonly opensearch: OpenSearchDataSourceRouteHandlerContext;

  constructor(private readonly dataSourceClient: IDataSourceClient, logger: Logger) {
    this.opensearch = new OpenSearchDataSourceRouteHandlerContext(
      this.dataSourceClient,
      logger.get('opensearch')
    );
  }
}
