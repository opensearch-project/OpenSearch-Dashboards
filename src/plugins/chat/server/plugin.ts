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

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
    this.config$ = initializerContext.config.create<ChatConfigType>();
  }

  public async setup(core: CoreSetup) {
    this.logger.debug('chat: Setup');
    const config = await this.config$.pipe(first()).toPromise();
    const router = core.http.createRouter();

    const [coreStart] = await core.getStartServices();
    const capabilitiesResolver = (request: OpenSearchDashboardsRequest) =>
      coreStart.capabilities.resolveCapabilities(request);

    // Register server side APIs with config
    defineRoutes(router, this.logger, config.agUiUrl, capabilitiesResolver);

    return {};
  }

  public start(core: CoreStart) {
    this.logger.debug('chat: Started');
    return {};
  }

  public stop() {}
}
