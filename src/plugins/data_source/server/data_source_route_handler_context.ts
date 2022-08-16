/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// eslint-disable-next-line max-classes-per-file
import { IContextProvider, Logger, RequestHandler } from 'src/core/server';
import { IDataSourceClient } from './client/data_source_client';
import { DataSourceService } from './data_source_service';

class OpenSearchDataSourceRouteHandlerContext {
  constructor(private dataSourceClient: IDataSourceClient, private logger: Logger) {}

  public async getClient(dataSourceId: string) {
    try {
      const client = await this.dataSourceClient.asDataSource(dataSourceId);
      return client;
    } catch (error: any) {
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

export const createDataSourceRouteHandlerContext = (
  dataSourceService: DataSourceService,
  logger: Logger
): IContextProvider<RequestHandler<unknown, unknown, unknown>, 'data_source'> => {
  return async (context, req) => {
    const dataSourceClient = dataSourceService!.getDataSourceClient(
      logger,
      context.core.savedObjects.client
    );
    return new DataSourceRouteHandlerContext(dataSourceClient, logger);
  };
};
