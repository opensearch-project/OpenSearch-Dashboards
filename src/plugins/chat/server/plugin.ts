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
  OpenSearchDashboardsRequest,
} from '../../../core/server';

import { ChatPluginSetup, ChatPluginStart } from './types';
import { defineRoutes } from './routes';
import { ChatConfigType } from './config';

/**
 * @experimental
 * Chat plugin for AI-powered interactions. This plugin is experimental and will change in future releases.
 */
export class ChatPlugin implements Plugin<ChatPluginSetup, ChatPluginStart> {
  private readonly logger: Logger;
  private readonly config$: Observable<ChatConfigType>;
  private capabilitiesResolver?: (request: OpenSearchDashboardsRequest) => Promise<Capabilities>;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
    this.config$ = initializerContext.config.create<ChatConfigType>();
  }

  public async setup(core: CoreSetup) {
    this.logger.debug('chat: Setup');
    const config = await this.config$.pipe(first()).toPromise();
    const router = core.http.createRouter();
    const getCapabilitiesResolver = () => this.capabilitiesResolver;

    defineRoutes(
      router,
      this.logger,
      config.agUiUrl,
      getCapabilitiesResolver,
      config.mlCommonsAgentId
    );

    return {};
  }

  public start(core: CoreStart) {
    this.logger.debug('chat: Started');

    this.capabilitiesResolver = (request: OpenSearchDashboardsRequest) =>
      core.capabilities.resolveCapabilities(request);

    return {};
  }

  public stop() {}
}
