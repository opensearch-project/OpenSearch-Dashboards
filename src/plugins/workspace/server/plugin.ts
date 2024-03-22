/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';
import {
  PluginInitializerContext,
  CoreSetup,
  Plugin,
  Logger,
  CoreStart,
} from '../../../core/server';
import {
  WORKSPACE_SAVED_OBJECTS_CLIENT_WRAPPER_ID,
  WORKSPACE_CONFLICT_CONTROL_SAVED_OBJECTS_CLIENT_WRAPPER_ID,
} from '../common/constants';
import { IWorkspaceClientImpl } from './types';
import { WorkspaceClient } from './workspace_client';
import { registerRoutes } from './routes';
import { WorkspaceSavedObjectsClientWrapper } from './saved_objects';
import { cleanWorkspaceId, getWorkspaceIdFromUrl } from '../../../core/server/utils';
import { WorkspaceConflictSavedObjectsClientWrapper } from './saved_objects/saved_objects_wrapper_for_check_workspace_conflict';
import {
  SavedObjectsPermissionControl,
  SavedObjectsPermissionControlContract,
} from './permission_control/client';
import { WorkspacePluginConfigType } from '../config';

export class WorkspacePlugin implements Plugin<{}, {}> {
  private readonly logger: Logger;
  private client?: IWorkspaceClientImpl;
  private workspaceConflictControl?: WorkspaceConflictSavedObjectsClientWrapper;
  private permissionControl?: SavedObjectsPermissionControlContract;
  private readonly config$: Observable<WorkspacePluginConfigType>;
  private workspaceSavedObjectsClientWrapper?: WorkspaceSavedObjectsClientWrapper;

  private proxyWorkspaceTrafficToRealHandler(setupDeps: CoreSetup) {
    /**
     * Proxy all {basePath}/w/{workspaceId}{osdPath*} paths to {basePath}{osdPath*}
     */
    setupDeps.http.registerOnPreRouting(async (request, response, toolkit) => {
      const workspaceId = getWorkspaceIdFromUrl(
        request.url.toString(),
        '' // No need to pass basePath here because the request.url will be rewrite by registerOnPreRouting method in `src/core/server/http/http_server.ts`
      );

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
    this.config$ = initializerContext.config.create<WorkspacePluginConfigType>();
  }

  public async setup(core: CoreSetup) {
    this.logger.debug('Setting up Workspaces service');
    const config: WorkspacePluginConfigType = await this.config$.pipe(first()).toPromise();
    const isPermissionControlEnabled =
      config.permission.enabled === undefined ? true : config.permission.enabled;

    this.client = new WorkspaceClient(core, this.logger);

    await this.client.setup(core);

    this.proxyWorkspaceTrafficToRealHandler(core);
    this.workspaceConflictControl = new WorkspaceConflictSavedObjectsClientWrapper();

    core.savedObjects.addClientWrapper(
      -1,
      WORKSPACE_CONFLICT_CONTROL_SAVED_OBJECTS_CLIENT_WRAPPER_ID,
      this.workspaceConflictControl.wrapperFactory
    );

    this.logger.info('Workspace permission control enabled:' + isPermissionControlEnabled);
    if (isPermissionControlEnabled) {
      this.permissionControl = new SavedObjectsPermissionControl(this.logger);

      this.workspaceSavedObjectsClientWrapper = new WorkspaceSavedObjectsClientWrapper(
        this.permissionControl
      );

      core.savedObjects.addClientWrapper(
        0,
        WORKSPACE_SAVED_OBJECTS_CLIENT_WRAPPER_ID,
        this.workspaceSavedObjectsClientWrapper.wrapperFactory
      );
    }

    registerRoutes({
      http: core.http,
      logger: this.logger,
      client: this.client as IWorkspaceClientImpl,
      permissionControlClient: this.permissionControl,
    });

    core.capabilities.registerProvider(() => ({
      workspaces: {
        enabled: true,
        permissionEnabled: isPermissionControlEnabled,
      },
    }));

    return {
      client: this.client,
    };
  }

  public start(core: CoreStart) {
    this.logger.debug('Starting Workspace service');
    this.permissionControl?.setup(core.savedObjects.getScopedClient, core.http.auth);
    this.client?.setSavedObjects(core.savedObjects);
    this.workspaceConflictControl?.setSerializer(core.savedObjects.createSerializer());
    this.workspaceSavedObjectsClientWrapper?.setScopedClient(core.savedObjects.getScopedClient);

    return {
      client: this.client as IWorkspaceClientImpl,
    };
  }

  public stop() {}
}
