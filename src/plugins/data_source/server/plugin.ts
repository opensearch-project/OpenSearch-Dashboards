/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

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
import { CryptographyService, CryptographyServiceSetup } from './cryptography_service';
import { DataSourceService, DataSourceServiceSetup } from './data_source_service';
import { dataConnection, dataSource, DataSourceSavedObjectsClientWrapper } from './saved_objects';
import { AuthenticationMethod, DataSourcePluginSetup, DataSourcePluginStart } from './types';
import { DATA_SOURCE_SAVED_OBJECT_TYPE } from '../common';

// eslint-disable-next-line @osd/eslint/no-restricted-paths
import { ensureRawRequest } from '../../../../src/core/server/http/router';
import { createDataSourceError } from './lib/error';
import { registerTestConnectionRoute } from './routes/test_connection';
import { registerFetchDataSourceMetaDataRoute } from './routes/fetch_data_source_metadata';
import { AuthenticationMethodRegistry, IAuthenticationMethodRegistry } from './auth_registry';
import { CustomApiSchemaRegistry } from './schema_registry';

export class DataSourcePlugin implements Plugin<DataSourcePluginSetup, DataSourcePluginStart> {
  private readonly logger: Logger;
  private readonly cryptographyService: CryptographyService;
  private readonly dataSourceService: DataSourceService;
  private readonly config$: Observable<DataSourcePluginConfigType>;
  private started = false;
  private authMethodsRegistry = new AuthenticationMethodRegistry();
  private customApiSchemaRegistry = new CustomApiSchemaRegistry();

  constructor(private initializerContext: PluginInitializerContext<DataSourcePluginConfigType>) {
    this.logger = this.initializerContext.logger.get();
    this.cryptographyService = new CryptographyService(this.logger.get('cryptography-service'));
    this.dataSourceService = new DataSourceService(this.logger.get('data-source-service'));
    this.config$ = this.initializerContext.config.create<DataSourcePluginConfigType>();
  }

  public async setup(core: CoreSetup<DataSourcePluginStart>) {
    this.logger.debug('dataSource: Setup');

    // Register data source saved object type
    core.savedObjects.registerType(dataSource);
    core.savedObjects.registerType(dataConnection);

    const config: DataSourcePluginConfigType = await this.config$.pipe(first()).toPromise();

    const cryptographyServiceSetup: CryptographyServiceSetup = this.cryptographyService.setup(
      config
    );

    const authRegistryPromise = core.getStartServices().then(([, , selfStart]) => {
      const dataSourcePluginStart = selfStart as DataSourcePluginStart;
      return dataSourcePluginStart.getAuthenticationMethodRegistry();
    });

    const dataSourceSavedObjectsClientWrapper = new DataSourceSavedObjectsClientWrapper(
      cryptographyServiceSetup,
      this.logger.get('data-source-saved-objects-client-wrapper-factory'),
      authRegistryPromise,
      config.endpointDeniedIPs
    );

    // Add data source saved objects client wrapper factory
    core.savedObjects.addClientWrapper(
      1,
      DATA_SOURCE_SAVED_OBJECT_TYPE,
      dataSourceSavedObjectsClientWrapper.wrapperFactory
    );

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

    const dataSourceService: DataSourceServiceSetup = await this.dataSourceService.setup(config);

    const customApiSchemaRegistryPromise = core.getStartServices().then(([, , selfStart]) => {
      const dataSourcePluginStart = selfStart as DataSourcePluginStart;
      return dataSourcePluginStart.getCustomApiSchemaRegistry();
    });

    // Register data source plugin context to route handler context
    core.http.registerRouteHandlerContext(
      'dataSource',
      this.createDataSourceRouteHandlerContext(
        dataSourceService,
        cryptographyServiceSetup,
        this.logger,
        auditTrailPromise,
        authRegistryPromise,
        customApiSchemaRegistryPromise
      )
    );

    const router = core.http.createRouter();
    registerTestConnectionRoute(
      router,
      dataSourceService,
      cryptographyServiceSetup,
      authRegistryPromise,
      customApiSchemaRegistryPromise
    );
    registerFetchDataSourceMetaDataRoute(
      router,
      dataSourceService,
      cryptographyServiceSetup,
      authRegistryPromise,
      customApiSchemaRegistryPromise
    );

    const registerCredentialProvider = (method: AuthenticationMethod) => {
      this.logger.debug(`Registered Credential Provider for authType = ${method.name}`);
      if (this.started) {
        throw new Error('cannot call `registerCredentialProvider` after service startup.');
      }
      this.authMethodsRegistry.registerAuthenticationMethod(method);
    };

    return {
      createDataSourceError: (e: any) => createDataSourceError(e),
      registerCredentialProvider,
      registerCustomApiSchema: (schema: any) => this.customApiSchemaRegistry.register(schema),
      dataSourceEnabled: () => config.enabled,
    };
  }

  public start(core: CoreStart) {
    this.logger.debug('dataSource: Started');
    this.started = true;
    return {
      getAuthenticationMethodRegistry: () => this.authMethodsRegistry,
      getCustomApiSchemaRegistry: () => this.customApiSchemaRegistry,
    };
  }

  public stop() {
    this.dataSourceService!.stop();
  }

  private createDataSourceRouteHandlerContext = (
    dataSourceService: DataSourceServiceSetup,
    cryptography: CryptographyServiceSetup,
    logger: Logger,
    auditTrailPromise: Promise<AuditorFactory>,
    authRegistryPromise: Promise<IAuthenticationMethodRegistry>,
    customApiSchemaRegistryPromise: Promise<CustomApiSchemaRegistry>
  ): IContextProvider<RequestHandler<unknown, unknown, unknown>, 'dataSource'> => {
    return async (context, req) => {
      const authRegistry = await authRegistryPromise;
      return {
        opensearch: {
          getClient: (dataSourceId: string) => {
            const auditor = auditTrailPromise.then((auditTrail) => auditTrail.asScoped(req));

            this.logAuditMessage(auditor, dataSourceId, req);

            return dataSourceService.getDataSourceClient({
              dataSourceId,
              savedObjects: context.core.savedObjects.client,
              cryptography,
              customApiSchemaRegistryPromise,
              request: req,
              authRegistry,
            });
          },
          legacy: {
            getClient: (dataSourceId: string) => {
              return dataSourceService.getDataSourceLegacyClient({
                dataSourceId,
                savedObjects: context.core.savedObjects.client,
                cryptography,
                customApiSchemaRegistryPromise,
                request: req,
                authRegistry,
              });
            },
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
    const forwarded = request.headers.forwarded;
    const forwardedInfo = forwarded ? forwarded : xForwardFor;

    return forwardedInfo
      ? `${remoteAddress} attempted accessing through ${forwardedInfo} on data source: ${dataSourceId}`
      : `${remoteAddress} attempted accessing on data source: ${dataSourceId}`;
  }
}
