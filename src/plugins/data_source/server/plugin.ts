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
  ISavedObjectsRepository,
  Logger,
  LoggerContextConfigInput,
  OpenSearchDashboardsRequest,
  Plugin,
  PluginInitializerContext,
  RequestHandler,
  SharedGlobalConfig,
} from '../../../../src/core/server';
import { ConfigSchema, DataSourcePluginConfigType } from '../config';
import { LoggingAuditor } from './audit/logging_auditor';
import { CryptographyService, CryptographyServiceSetup } from './cryptography_service';
import { DataSourceService, DataSourceServiceSetup } from './data_source_service';
import { dataConnection, dataSource, DataSourceSavedObjectsClientWrapper } from './saved_objects';
import { AuthenticationMethod, DataSourcePluginSetup, DataSourcePluginStart } from './types';
import { DATA_SOURCE_SAVED_OBJECT_TYPE } from '../common';
import { ensureRawRequest } from '../../../../src/core/server/http/router';
import { createDataSourceError } from './lib/error';
import { registerTestConnectionRoute } from './routes/test_connection';
import { registerFetchDataSourceMetaDataRoute } from './routes/fetch_data_source_metadata';
import { AuthenticationMethodRegistry, IAuthenticationMethodRegistry } from './auth_registry';
import { CustomApiSchemaRegistry } from './schema_registry';
import { createOAuth2AuthMethod } from './auth_registry/oauth2_auth_method';
import { OAuth2TokenCache } from './auth_registry/oauth2_token_cache';
import { AuthType } from '../common/data_sources';

export class DataSourcePlugin implements Plugin<DataSourcePluginSetup, DataSourcePluginStart> {
  private readonly logger: Logger;
  private readonly cryptographyService: CryptographyService;
  private readonly dataSourceService: DataSourceService;
  private readonly config$: Observable<ConfigSchema>;
  private readonly globalConfig$: Observable<SharedGlobalConfig>;
  private started = false;
  private authMethodsRegistry = new AuthenticationMethodRegistry();
  private customApiSchemaRegistry = new CustomApiSchemaRegistry();
  private oauth2TokenCache = new OAuth2TokenCache();
  private internalSavedObjects: ISavedObjectsRepository | undefined;

  constructor(private initializerContext: PluginInitializerContext<DataSourcePluginConfigType>) {
    this.logger = this.initializerContext.logger.get();
    this.cryptographyService = new CryptographyService(this.logger.get('cryptography-service'));
    this.dataSourceService = new DataSourceService(this.logger.get('data-source-service'));
    this.config$ = this.initializerContext.config.create<ConfigSchema>();
    this.globalConfig$ = this.initializerContext.config.legacy.globalConfig$;
  }

  public async setup(core: CoreSetup<DataSourcePluginStart>) {
    this.logger.debug('dataSource: Setup');

    // Register data source saved object type
    core.savedObjects.registerType(dataSource);
    core.savedObjects.registerType(dataConnection);

    const pluginConfig: ConfigSchema = await this.config$.pipe(first()).toPromise();
    const globalConfig = await this.globalConfig$.pipe(first()).toPromise();
    const config = {
      ...pluginConfig,
      globalOpenSearchConfig: {
        requestTimeout: globalConfig.opensearch.requestTimeout,
        pingTimeout: globalConfig.opensearch.pingTimeout,
        requestCompression: globalConfig.opensearch.requestCompression,
      },
    };

    const cryptographyServiceSetup: CryptographyServiceSetup =
      this.cryptographyService.setup(config);

    const authRegistryPromise = core.getStartServices().then(([, , selfStart]) => {
      const dataSourcePluginStart = selfStart as DataSourcePluginStart;
      return dataSourcePluginStart.getAuthenticationMethodRegistry();
    });

    const dataSourceSavedObjectsClientWrapper = new DataSourceSavedObjectsClientWrapper(
      cryptographyServiceSetup,
      this.logger.get('data-source-saved-objects-client-wrapper-factory'),
      authRegistryPromise,
      config.endpointDeniedIPs,
      config.endpointAllowlistedSuffixes
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
    const endpointDeniedIPs = config.endpointDeniedIPs ?? ['169.254.0.0/16', 'fe80::/10'];
    registerTestConnectionRoute(
      router,
      dataSourceService,
      cryptographyServiceSetup,
      authRegistryPromise,
      customApiSchemaRegistryPromise,
      this.logger.get('test-connection'),
      endpointDeniedIPs,
      config.endpointAllowlistedSuffixes,
      () => this.internalSavedObjects
    );
    registerFetchDataSourceMetaDataRoute(
      router,
      dataSourceService,
      cryptographyServiceSetup,
      authRegistryPromise,
      customApiSchemaRegistryPromise,
      this.logger.get('fetch-data-source-metadata'),
      endpointDeniedIPs,
      config.endpointAllowlistedSuffixes,
      () => this.internalSavedObjects
    );

    let builtInOAuth2Registered = false;

    const registerCredentialProvider = (method: AuthenticationMethod) => {
      this.logger.debug(`Registered Credential Provider for authType = ${method.name}`);
      if (this.started) {
        throw new Error('cannot call `registerCredentialProvider` after service startup.');
      }
      // A plugin registering its own OAuth2 provider replaces the built-in one. Checking the
      // registry before registering ours cannot work - this contract is only handed out once
      // setup() returns, so nothing else can have registered yet - and leaving the built-in in
      // place would make the registry's duplicate-name check throw during the other plugin's
      // setup and take down startup.
      if (method.name === AuthType.OAuth2 && builtInOAuth2Registered) {
        this.logger.info(
          'Replacing the built-in OAuth2 credential provider with the one registered by another plugin'
        );
        this.authMethodsRegistry.removeAuthenticationMethod(AuthType.OAuth2);
        builtInOAuth2Registered = false;
      }
      this.authMethodsRegistry.registerAuthenticationMethod(method);
    };

    // Initialize OAuth2 token cache cleanup scheduler immediately after creation
    // This prevents race condition where requests between setup() and start() would use uninitialized cache
    this.oauth2TokenCache.initialize();

    // Register the built-in OAuth2 authentication method.
    //
    // authTypes.OAuth2.enabled is honoured here as well as in the browser. The browser flag
    // only hides the option in the data source form; without this check a deployment that
    // turned OAuth2 off would still mint tokens for any OAuth2 data source already stored,
    // so the setting would not actually be a kill switch.
    if (config.authTypes.OAuth2.enabled) {
      const oauth2AuthMethod = createOAuth2AuthMethod(
        this.oauth2TokenCache,
        // Use the same computed list as the routes above: config.endpointDeniedIPs is
        // optional, and endpoint_validator skips the check entirely when it is undefined,
        // so passing the raw value would let OAuth2 token URLs reach link-local and
        // cloud-metadata addresses that the routes reject.
        endpointDeniedIPs,
        config.endpointAllowlistedSuffixes
      );
      registerCredentialProvider(oauth2AuthMethod);
      builtInOAuth2Registered = true;
    }

    return {
      createDataSourceError: (e: any) => createDataSourceError(e),
      registerCredentialProvider,
      registerCustomApiSchema: (schema: any) => this.customApiSchemaRegistry.register(schema),
      dataSourceEnabled: () => config.enabled,
      oauth2AuthEnabled: () => config.authTypes.OAuth2.enabled,
    };
  }

  public start(core: CoreStart) {
    this.logger.debug('dataSource: Started');
    this.started = true;

    // Create an internal repository that bypasses the credential-stripping SavedObjects wrapper.
    // Used exclusively by getClient / getLegacyClient to read encrypted credentials after the
    // scoped client has already confirmed the calling user has access to the data source.
    this.internalSavedObjects = core.savedObjects.createInternalRepository([
      DATA_SOURCE_SAVED_OBJECT_TYPE,
    ]);
    // backendCompatibility (when enabled) registers a custom Transport on core's client.
    // Apply the same Transport to modern data-source clients so legacy ES (6.x/7.x)
    // connections get identical request/response interception (e.g. /_resolve/index
    // synthesis). Undefined when no Transport is registered → data-source clients are
    // built exactly as before (no behavior change).
    this.dataSourceService.setCustomTransport(core.opensearch.getClientTransport?.());
    return {
      getAuthenticationMethodRegistry: () => this.authMethodsRegistry,
      getCustomApiSchemaRegistry: () => this.customApiSchemaRegistry,
    };
  }

  public stop() {
    // Clean up OAuth2 token cache and scheduler
    this.oauth2TokenCache.dispose();
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
              internalSavedObjects: this.internalSavedObjects,
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
                internalSavedObjects: this.internalSavedObjects,
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
