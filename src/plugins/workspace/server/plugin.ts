/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  PluginInitializerContext,
  CoreSetup,
  Plugin,
  Logger,
  CoreStart,
} from '../../../core/server';
import { IWorkspaceClientImpl, WorkspacePluginSetup, WorkspacePluginStart } from './types';
import { WorkspaceClient } from './workspace_client';
import { registerRoutes } from './routes';
import { WORKSPACE_CONFLICT_CONTROL_SAVED_OBJECTS_CLIENT_WRAPPER_ID } from '../common/constants';
import { WorkspaceConflictSavedObjectsClientWrapper } from './saved_objects/saved_objects_wrapper_for_check_workspace_conflict';
import { cleanWorkspaceId, getWorkspaceIdFromUrl } from '../../../core/server/utils';

export class WorkspacePlugin implements Plugin<WorkspacePluginSetup, WorkspacePluginStart> {
  private readonly logger: Logger;
  private client?: IWorkspaceClientImpl;
  private workspaceConflictControl?: WorkspaceConflictSavedObjectsClientWrapper;

  private proxyWorkspaceTrafficToRealHandler(setupDeps: CoreSetup) {
    /**
     * Proxy all {basePath}/w/{workspaceId}{osdPath*} paths to {basePath}{osdPath*}
     */
    setupDeps.http.registerOnPreRouting(async (request, response, toolkit) => {
      const workspaceId = getWorkspaceIdFromUrl(request.url.toString());

      if (workspaceId) {
        const requestUrl = new URL(request.url.toString());
        requestUrl.pathname = cleanWorkspaceId(requestUrl.pathname);
        return toolkit.rewriteUrl(requestUrl.toString());
      }
      return toolkit.next();
    });
  }

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get('plugins', 'workspace');
  }

  public async setup(core: CoreSetup) {
    this.logger.debug('Setting up Workspaces service');

    this.client = new WorkspaceClient(core);

    await this.client.setup(core);

    this.workspaceConflictControl = new WorkspaceConflictSavedObjectsClientWrapper();

    core.savedObjects.addClientWrapper(
      -1,
      WORKSPACE_CONFLICT_CONTROL_SAVED_OBJECTS_CLIENT_WRAPPER_ID,
      this.workspaceConflictControl.wrapperFactory
    );
    this.proxyWorkspaceTrafficToRealHandler(core);

    registerRoutes({
      http: core.http,
      logger: this.logger,
      client: this.client as IWorkspaceClientImpl,
    });

    return {
      client: this.client,
    };
  }

  public start(core: CoreStart) {
    this.logger.debug('Starting Workspace service');
    this.client?.setSavedObjects(core.savedObjects);
    this.workspaceConflictControl?.setSerializer(core.savedObjects.createSerializer());

    return {
      client: this.client as IWorkspaceClientImpl,
    };
  }

  public stop() {}
}
