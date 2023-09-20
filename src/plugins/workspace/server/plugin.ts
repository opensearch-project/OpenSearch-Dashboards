/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
  SavedObjectsClient,
} from '../../../core/server';
import { IWorkspaceDBImpl } from './types';
import { WorkspaceClientWithSavedObject } from './workspace_client';
import { WorkspaceSavedObjectsClientWrapper } from './saved_objects';
import { registerRoutes } from './routes';
import { WORKSPACE_SAVED_OBJECTS_CLIENT_WRAPPER_ID } from '../common/constants';
import {
  SavedObjectsPermissionControl,
  SavedObjectsPermissionControlContract,
} from './permission_control/client';
import { registerPermissionCheckRoutes } from './permission_control/routes';

export class WorkspacePlugin implements Plugin<{}, {}> {
  private readonly logger: Logger;
  private client?: IWorkspaceDBImpl;
  private permissionControl?: SavedObjectsPermissionControlContract;

  private proxyWorkspaceTrafficToRealHandler(setupDeps: CoreSetup) {
    /**
     * Proxy all {basePath}/w/{workspaceId}{osdPath*} paths to {basePath}{osdPath*}
     */
    setupDeps.http.registerOnPreRouting(async (request, response, toolkit) => {
      const regexp = /\/w\/([^\/]*)/;
      const matchedResult = request.url.pathname.match(regexp);

      if (matchedResult) {
        const requestUrl = new URL(request.url.toString());
        requestUrl.pathname = requestUrl.pathname.replace(regexp, '');
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

    this.client = new WorkspaceClientWithSavedObject(core, this.logger);

    await this.client.setup(core);
    this.permissionControl = new SavedObjectsPermissionControl(this.logger);

    registerPermissionCheckRoutes({
      http: core.http,
      permissionControl: this.permissionControl,
    });

    const workspaceSavedObjectsClientWrapper = new WorkspaceSavedObjectsClientWrapper(
      this.permissionControl
    );

    core.savedObjects.addClientWrapper(
      0,
      WORKSPACE_SAVED_OBJECTS_CLIENT_WRAPPER_ID,
      workspaceSavedObjectsClientWrapper.wrapperFactory
    );

    this.proxyWorkspaceTrafficToRealHandler(core);

    registerRoutes({
      http: core.http,
      logger: this.logger,
      client: this.client as IWorkspaceDBImpl,
    });

    core.savedObjects.setClientFactoryProvider((repositoryFactory) => () =>
      new SavedObjectsClient(repositoryFactory.createInternalRepository())
    );

    return {
      client: this.client,
    };
  }

  public start(core: CoreStart) {
    this.logger.debug('Starting SavedObjects service');
    this.permissionControl?.setup(core.savedObjects.getScopedClient);
    this.client?.setSavedObjects(core.savedObjects);

    return {
      client: this.client as IWorkspaceDBImpl,
    };
  }

  public stop() {}
}
