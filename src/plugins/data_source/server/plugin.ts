/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchClientError } from '@opensearch-project/opensearch/lib/errors';
import { Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';
import {
  Auditor,
  AuditorFactory,
  CoreSetup,
  CoreStart,
  IContextProvider,
  Logger,
  LoggerContextConfigInput,
  OpenSearchDashboardsRequest,
  Plugin,
  PluginInitializerContext,
  RequestHandler,
} from '../../../../src/core/server';
import { DataSourcePluginConfigType } from '../config';
import { LoggingAuditor } from './audit/logging_auditor';
import { CryptographyClient } from './cryptography';
import { DataSourceService, DataSourceServiceSetup } from './data_source_service';
import { DataSourceSavedObjectsClientWrapper, dataSource } from './saved_objects';
import { DataSourcePluginSetup, DataSourcePluginStart } from './types';
import { DATA_SOURCE_SAVED_OBJECT_TYPE } from '../common';

// eslint-disable-next-line @osd/eslint/no-restricted-paths
import { ensureRawRequest } from '../../../../src/core/server/http/router';
export class DataSourcePlugin implements Plugin<DataSourcePluginSetup, DataSourcePluginStart> {
  private readonly logger: Logger;
  private readonly dataSourceService: DataSourceService;
  private readonly config$: Observable<DataSourcePluginConfigType>;

  constructor(private initializerContext: PluginInitializerContext<DataSourcePluginConfigType>) {
    this.logger = this.initializerContext.logger.get();
    this.dataSourceService = new DataSourceService(this.logger.get('data-source-service'));
    this.config$ = this.initializerContext.config.create<DataSourcePluginConfigType>();
  }

  public async setup(core: CoreSetup) {
    this.logger.debug('data_source: Setup');

    // Register data source saved object type
    core.savedObjects.registerType(dataSource);

    const config: DataSourcePluginConfigType = await this.config$.pipe(first()).toPromise();

    // Fetch configs used to create credential saved objects client wrapper
    const { wrappingKeyName, wrappingKeyNamespace, wrappingKey } = config.encryption;

    // Create data source saved objects client wrapper
    const cryptographyClient = new CryptographyClient(
      wrappingKeyName,
      wrappingKeyNamespace,
      wrappingKey
    );
    const dataSourceSavedObjectsClientWrapper = new DataSourceSavedObjectsClientWrapper(
      cryptographyClient
    );

    // Add data source saved objects client wrapper factory
    core.savedObjects.addClientWrapper(
      1,
      DATA_SOURCE_SAVED_OBJECT_TYPE,
      dataSourceSavedObjectsClientWrapper.wrapperFactory
    );

    const dataSourceService: DataSourceServiceSetup = await this.dataSourceService.setup(config);

    core.logging.configure(
      this.config$.pipe<LoggerContextConfigInput>(
        map((dataSourceConfig) => ({
          appenders: {
            auditTrailAppender: dataSourceConfig.audit.appender,
          },
          loggers: [
            {
              context: 'audit',
              level: dataSourceConfig.audit.enabled ? 'info' : 'off',
              appenders: ['auditTrailAppender'],
            },
          ],
        }))
      )
    );

    const auditorFactory: AuditorFactory = {
      asScoped: (request: OpenSearchDashboardsRequest) => {
        return new LoggingAuditor(request, this.logger.get('audit'));
      },
    };
    core.auditTrail.register(auditorFactory);
    const auditTrailPromise = core.getStartServices().then(([coreStart]) => coreStart.auditTrail);

    // Register data source plugin context to route handler context
    core.http.registerRouteHandlerContext(
      'dataSource',
      this.createDataSourceRouteHandlerContext(
        dataSourceService,
        cryptographyClient,
        this.logger,
        auditTrailPromise
      )
    );

    return {};
  }

  public start(core: CoreStart) {
    this.logger.debug('data_source: Started');

    return {};
  }

  public stop() {
    this.dataSourceService!.stop();
  }

  private createDataSourceRouteHandlerContext = (
    dataSourceService: DataSourceServiceSetup,
    cryptographyClient: CryptographyClient,
    logger: Logger,
    auditTrailPromise: Promise<AuditorFactory>
  ): IContextProvider<RequestHandler<unknown, unknown, unknown>, 'dataSource'> => {
    return (context, req) => {
      return {
        opensearch: {
          getClient: (dataSourceId: string) => {
            try {
              const auditor = auditTrailPromise.then((auditTrail) => auditTrail.asScoped(req));
              this.logAuditMessage(auditor, dataSourceId, req);

              return dataSourceService.getDataSourceClient(
                dataSourceId,
                context.core.savedObjects.client,
                cryptographyClient
              );
            } catch (error: any) {
              logger.error(
                `Fail to get data source client for dataSourceId: [${dataSourceId}]. Detail: ${error.messages}`
              );
              throw new OpenSearchClientError(error.message);
            }
          },
        },
      };
    };
  };

  private async logAuditMessage(
    auditorPromise: Promise<Auditor>,
    dataSourceId: string,
    request: OpenSearchDashboardsRequest
  ) {
    const auditor = await auditorPromise;
    const auditMessage = this.getAuditMessage(request, dataSourceId);

    auditor.add({
      message: auditMessage,
      type: 'opensearch.dataSourceClient.fetchClient',
    });
  }

  private getAuditMessage(request: OpenSearchDashboardsRequest, dataSourceId: string) {
    const rawRequest = ensureRawRequest(request);
    const remoteAddress = rawRequest?.info?.remoteAddress;
    const xForwardFor = request.headers['x-forwarded-for'];

    return xForwardFor
      ? `${remoteAddress} attempted accessing through ${xForwardFor} on data source: ${dataSourceId}`
      : `${remoteAddress} attempted accessing on data source: ${dataSourceId}`;
  }
}
