/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';
import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from '../../../core/server';

import { AssistantPluginSetup, AssistantPluginStart } from './types';
import { AssistantConfigType } from './config';
import { ConfigService, AgentClient } from './services';
import { defineRoutes } from './routes';

export class AssistantPlugin implements Plugin<AssistantPluginSetup, AssistantPluginStart> {
  private readonly logger: Logger;
  private readonly initializerContext: PluginInitializerContext;
  private readonly config$: Observable<AssistantConfigType>;
  private configService?: ConfigService;
  private agentClient?: AgentClient;

  constructor(initializerContext: PluginInitializerContext) {
    this.initializerContext = initializerContext;
    this.logger = initializerContext.logger.get();
    this.config$ = initializerContext.config.create<AssistantConfigType>();
  }

  public async setup(core: CoreSetup) {
    this.logger.debug('assistant: Setup');

    // Initialize configuration
    const config = await this.config$.pipe(first()).toPromise();
    this.configService = new ConfigService(config, this.logger);

    // Validate configuration
    const validationErrors = this.configService.validate();
    if (validationErrors.length > 0) {
      this.logger.error('Configuration validation failed:', validationErrors);
      throw new Error(
        `Invalid configuration: ${validationErrors.map((e) => e.message).join(', ')}`
      );
    }

    // Log configuration
    this.configService.logConfig();

    // Initialize AgentClient if enabled
    if (this.configService.isEnabled()) {
      this.agentClient = new AgentClient(this.configService, this.logger);
      this.logger.info('AI Agent client initialized');
    }

    const router = core.http.createRouter();

    // Register server side APIs
    defineRoutes(router, this.configService, this.agentClient);

    return {
      getConfig: () => this.configService!.getClientConfig(),
      getAgentClient: () => this.agentClient,
    };
  }

  public start(core: CoreStart) {
    this.logger.debug('assistant: Started');

    // Health check for agent client if enabled
    if (this.agentClient) {
      this.performHealthCheck();
    }

    return {};
  }

  public stop() {}

  private async performHealthCheck(): Promise<void> {
    if (!this.agentClient) return;

    try {
      const isHealthy = await this.agentClient.isHealthy();
      if (isHealthy) {
        this.logger.info('AI Agent service is healthy');
      } else {
        this.logger.warn('AI Agent service health check failed');
      }
    } catch (error) {
      this.logger.error('AI Agent health check error', error as Error);
    }
  }
}
