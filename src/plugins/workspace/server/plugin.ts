/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { PluginInitializerContext, CoreSetup, Plugin, Logger } from '../../../core/server';
import { IWorkspaceDBImpl } from './types';
import { WorkspaceClientWithSavedObject } from './workspace_client';
import { registerRoutes } from './routes';

export class WorkspacePlugin implements Plugin<{}, {}> {
  private readonly logger: Logger;
  private client?: IWorkspaceDBImpl;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get('plugins', 'workspace');
  }

  public async setup(core: CoreSetup) {
    this.logger.debug('Setting up Workspaces service');

    this.client = new WorkspaceClientWithSavedObject(core);

    await this.client.setup(core);

    registerRoutes({
      http: core.http,
      logger: this.logger,
      client: this.client as IWorkspaceDBImpl,
    });

    return {
      client: this.client,
    };
  }

  public start() {
    this.logger.debug('Starting SavedObjects service');

    return {
      client: this.client as IWorkspaceDBImpl,
    };
  }

  public stop() {}
}
