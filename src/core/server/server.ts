/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import apm from 'elastic-apm-node';
import { config as pathConfig } from '@osd/utils';
import { mapToObject } from '@osd/std';
import { ConfigService, Env, RawConfigurationProvider, coreDeprecationProvider } from './config';
import { CoreApp } from './core_app';
import { AuditTrailService } from './audit_trail';
import { OpenSearchService } from './opensearch';
import { HttpService } from './http';
import { HttpResourcesService } from './http_resources';
import { RenderingService } from './rendering';
import { LegacyService, ensureValidConfiguration } from './legacy';
import { Logger, LoggerFactory, LoggingService, ILoggingSystem } from './logging';
import { UiSettingsService } from './ui_settings';
import {
  CompatibleEnginePluginVersions,
  PluginName,
  PluginsService,
  config as pluginsConfig,
} from './plugins';
import { SavedObjectsService } from '../server/saved_objects';
import { MetricsService, opsConfig } from './metrics';
import { CapabilitiesService } from './capabilities';
import { EnvironmentService, config as pidConfig } from './environment';
import { StatusService } from './status/status_service';
import { SecurityService } from './security/security_service';
import { CrossCompatibilityService } from './cross_compatibility';

import { config as cspConfig } from './csp';
import { config as opensearchConfig } from './opensearch';
import { config as httpConfig } from './http';
import { config as loggingConfig } from './logging';
import { config as devConfig } from './dev';
import { config as opensearchDashboardsConfig } from './opensearch_dashboards_config';
import { savedObjectsConfig, savedObjectsMigrationConfig } from './saved_objects';
import { config as uiSettingsConfig } from './ui_settings';
import { config as statusConfig } from './status';
import { config as dynamicConfigServiceConfig } from './config';
import { ContextService } from './context';
import { RequestHandlerContext } from '.';
import { InternalCoreSetup, InternalCoreStart, ServiceConfigDescriptor } from './internal_types';
import { CoreUsageDataService } from './core_usage_data';
import { CoreRouteHandlerContext } from './core_route_handler_context';
import { DynamicConfigService } from './config/dynamic_config_service';
import { WorkspaceService } from './workspace/workspace_service';

const coreId = Symbol('core');
const rootConfigPath = '';

export class Server {
  public readonly configService: ConfigService;
  public readonly dynamicConfigService: DynamicConfigService;
  private readonly capabilities: CapabilitiesService;
  private readonly context: ContextService;
  private readonly opensearch: OpenSearchService;
  private readonly http: HttpService;
  private readonly rendering: RenderingService;
  private readonly legacy: LegacyService;
  private readonly log: Logger;
  private readonly plugins: PluginsService;
  private readonly savedObjects: SavedObjectsService;
  private readonly uiSettings: UiSettingsService;
  private readonly workspace: WorkspaceService;
  private readonly environment: EnvironmentService;
  private readonly metrics: MetricsService;
  private readonly httpResources: HttpResourcesService;
  private readonly status: StatusService;
  private readonly logging: LoggingService;
  private readonly coreApp: CoreApp;
  private readonly auditTrail: AuditTrailService;
  private readonly coreUsageData: CoreUsageDataService;
  private readonly security: SecurityService;
  private readonly crossCompatibility: CrossCompatibilityService;

  #pluginsInitialized?: boolean;
  private coreStart?: InternalCoreStart;
  private readonly logger: LoggerFactory;

  private openSearchPluginDeps: Map<PluginName, CompatibleEnginePluginVersions> = new Map();

  constructor(
    rawConfigProvider: RawConfigurationProvider,
    public readonly env: Env,
    private readonly loggingSystem: ILoggingSystem
  ) {
    this.logger = this.loggingSystem.asLoggerFactory();
    this.log = this.logger.get('server');
    this.configService = new ConfigService(rawConfigProvider, env, this.logger);
    this.dynamicConfigService = new DynamicConfigService(this.configService, env, this.logger);

    const core = {
      coreId,
      configService: this.configService,
      dynamicConfigService: this.dynamicConfigService,
      env,
      logger: this.logger,
    };
    this.context = new ContextService(core);
    this.http = new HttpService(core);
    this.rendering = new RenderingService(core);
    this.plugins = new PluginsService(core);
    this.legacy = new LegacyService(core);
    this.opensearch = new OpenSearchService(core);
    this.savedObjects = new SavedObjectsService(core);
    this.uiSettings = new UiSettingsService(core);
    this.workspace = new WorkspaceService(core);
    this.capabilities = new CapabilitiesService(core);
    this.environment = new EnvironmentService(core);
    this.metrics = new MetricsService(core);
    this.status = new StatusService(core);
    this.coreApp = new CoreApp(core);
    this.httpResources = new HttpResourcesService(core);
    this.auditTrail = new AuditTrailService(core);
    this.logging = new LoggingService(core);
    this.coreUsageData = new CoreUsageDataService(core);
    this.security = new SecurityService(core);
    this.crossCompatibility = new CrossCompatibilityService(core);
  }

  public async setup() {
    this.log.debug('setting up server');
    const setupTransaction = apm.startTransaction('server_setup', 'opensearch_dashboards_platform');

    const environmentSetup = await this.environment.setup();

    // Discover any plugins before continuing. This allows other systems to utilize the plugin dependency graph.
    const { pluginTree, uiPlugins, requiredEnginePlugins } = await this.plugins.discover({
      environment: environmentSetup,
    });
    this.openSearchPluginDeps = requiredEnginePlugins;
    const legacyConfigSetup = await this.legacy.setupLegacyConfig();

    // Immediately terminate in case of invalid configuration
    // This needs to be done after plugin discovery
    await this.configService.validate();
    await ensureValidConfiguration(this.configService, legacyConfigSetup);

    // Once the configs have been validated, setup the dynamic config as schemas have also been verified
    const dynamicConfigServiceSetup = await this.dynamicConfigService.setup();

    const contextServiceSetup = this.context.setup({
      // We inject a fake "legacy plugin" with dependencies on every plugin so that legacy plugins:
      // 1) Can access context from any KP plugin
      // 2) Can register context providers that will only be available to other legacy plugins and will not leak into
      //    New Platform plugins.
      pluginDependencies: new Map([
        ...pluginTree.asOpaqueIds,
        [this.legacy.legacyId, [...pluginTree.asOpaqueIds.keys()]],
      ]),
    });

    const auditTrailSetup = this.auditTrail.setup();

    const httpSetup = await this.http.setup({
      context: contextServiceSetup,
    });

    // Once http is setup, register routes and async local storage
    await this.dynamicConfigService.registerRoutesAndHandlers({ http: httpSetup });

    const capabilitiesSetup = this.capabilities.setup({ http: httpSetup });

    const opensearchServiceSetup = await this.opensearch.setup({
      http: httpSetup,
    });

    const savedObjectsSetup = await this.savedObjects.setup({
      http: httpSetup,
      opensearch: opensearchServiceSetup,
    });

    const uiSettingsSetup = await this.uiSettings.setup({
      http: httpSetup,
      savedObjects: savedObjectsSetup,
    });
    const workspaceSetup = await this.workspace.setup();

    const metricsSetup = await this.metrics.setup({ http: httpSetup });

    const statusSetup = await this.status.setup({
      opensearch: opensearchServiceSetup,
      pluginDependencies: pluginTree.asNames,
      savedObjects: savedObjectsSetup,
      environment: environmentSetup,
      http: httpSetup,
      metrics: metricsSetup,
    });

    const renderingSetup = await this.rendering.setup({
      http: httpSetup,
      status: statusSetup,
      uiPlugins,
      dynamicConfig: dynamicConfigServiceSetup,
    });

    const httpResourcesSetup = this.httpResources.setup({
      http: httpSetup,
      rendering: renderingSetup,
    });

    const loggingSetup = this.logging.setup({
      loggingSystem: this.loggingSystem,
    });

    const securitySetup = this.security.setup();

    this.coreUsageData.setup({ metrics: metricsSetup });

    const coreSetup: InternalCoreSetup = {
      capabilities: capabilitiesSetup,
      context: contextServiceSetup,
      opensearch: opensearchServiceSetup,
      environment: environmentSetup,
      http: httpSetup,
      savedObjects: savedObjectsSetup,
      status: statusSetup,
      uiSettings: uiSettingsSetup,
      rendering: renderingSetup,
      httpResources: httpResourcesSetup,
      auditTrail: auditTrailSetup,
      logging: loggingSetup,
      metrics: metricsSetup,
      security: securitySetup,
      dynamicConfig: dynamicConfigServiceSetup,
      workspace: workspaceSetup,
    };

    const pluginsSetup = await this.plugins.setup(coreSetup);
    this.#pluginsInitialized = pluginsSetup.initialized;

    await this.legacy.setup({
      core: { ...coreSetup, plugins: pluginsSetup, rendering: renderingSetup },
      plugins: mapToObject(pluginsSetup.contracts),
      uiPlugins,
    });

    this.registerCoreContext(coreSetup);
    this.coreApp.setup(coreSetup);

    setupTransaction?.end();
    return coreSetup;
  }

  public async start() {
    this.log.debug('starting server');
    const startTransaction = apm.startTransaction('server_start', 'opensearch_dashboards_platform');

    const auditTrailStart = this.auditTrail.start();

    const opensearchStart = await this.opensearch.start({
      auditTrail: auditTrailStart,
    });
    const dynamicConfigServiceStart = await this.dynamicConfigService.start({
      opensearch: opensearchStart,
    });
    const soStartSpan = startTransaction?.startSpan('saved_objects.migration', 'migration');
    const savedObjectsStart = await this.savedObjects.start({
      opensearch: opensearchStart,
      pluginsInitialized: this.#pluginsInitialized,
    });
    soStartSpan?.end();
    const capabilitiesStart = this.capabilities.start();
    const uiSettingsStart = await this.uiSettings.start();
    const workspaceStart = await this.workspace.start();
    const metricsStart = await this.metrics.start();
    const httpStart = this.http.getStartContract();
    const coreUsageDataStart = this.coreUsageData.start({
      opensearch: opensearchStart,
      savedObjects: savedObjectsStart,
    });

    const crossCompatibilityServiceStart = this.crossCompatibility.start({
      opensearch: opensearchStart,
      plugins: this.openSearchPluginDeps,
    });

    this.coreStart = {
      capabilities: capabilitiesStart,
      opensearch: opensearchStart,
      http: httpStart,
      metrics: metricsStart,
      savedObjects: savedObjectsStart,
      uiSettings: uiSettingsStart,
      auditTrail: auditTrailStart,
      coreUsageData: coreUsageDataStart,
      crossCompatibility: crossCompatibilityServiceStart,
      dynamicConfig: dynamicConfigServiceStart,
      workspace: workspaceStart,
    };

    const pluginsStart = await this.plugins.start(this.coreStart);

    await this.legacy.start({
      core: {
        ...this.coreStart,
        plugins: pluginsStart,
      },
      plugins: mapToObject(pluginsStart.contracts),
    });

    await this.http.start({ dynamicConfigService: dynamicConfigServiceStart });

    await this.security.start();

    startTransaction?.end();
    return this.coreStart;
  }

  public async stop() {
    this.log.debug('stopping server');

    await this.legacy.stop();
    await this.plugins.stop();
    await this.savedObjects.stop();
    await this.opensearch.stop();
    await this.http.stop();
    await this.uiSettings.stop();
    await this.rendering.stop();
    await this.metrics.stop();
    await this.status.stop();
    await this.logging.stop();
    await this.auditTrail.stop();
    await this.security.stop();
  }

  private registerCoreContext(coreSetup: InternalCoreSetup) {
    coreSetup.http.registerRouteHandlerContext(
      coreId,
      'core',
      async (context, req, res): Promise<RequestHandlerContext['core']> => {
        return new CoreRouteHandlerContext(this.coreStart!, req);
      }
    );
  }

  public async setupCoreConfig() {
    const configDescriptors: Array<ServiceConfigDescriptor<unknown>> = [
      pathConfig,
      cspConfig,
      opensearchConfig,
      loggingConfig,
      httpConfig,
      pluginsConfig,
      devConfig,
      opensearchDashboardsConfig,
      savedObjectsConfig,
      savedObjectsMigrationConfig,
      uiSettingsConfig,
      opsConfig,
      statusConfig,
      pidConfig,
      dynamicConfigServiceConfig,
    ];

    this.configService.addDeprecationProvider(rootConfigPath, coreDeprecationProvider);
    for (const descriptor of configDescriptors) {
      if (descriptor.deprecations) {
        this.configService.addDeprecationProvider(descriptor.path, descriptor.deprecations);
      }
      await this.configService.setSchema(descriptor.path, descriptor.schema);
      this.dynamicConfigService.setSchema(descriptor.path, descriptor.schema);
    }
  }
}
