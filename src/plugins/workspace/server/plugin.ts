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
  SharedGlobalConfig,
} from '../../../core/server';
import {
  WORKSPACE_SAVED_OBJECTS_CLIENT_WRAPPER_ID,
  WORKSPACE_CONFLICT_CONTROL_SAVED_OBJECTS_CLIENT_WRAPPER_ID,
} from '../common/constants';
import { cleanWorkspaceId, getWorkspaceIdFromUrl } from '../../../core/server/utils';
import { IWorkspaceClientImpl, WorkspacePluginSetup, WorkspacePluginStart } from './types';
import { WorkspaceClient } from './workspace_client';
import { registerRoutes } from './routes';
import { WorkspaceSavedObjectsClientWrapper } from './saved_objects';
import { WorkspaceConflictSavedObjectsClientWrapper } from './saved_objects/saved_objects_wrapper_for_check_workspace_conflict';
import {
  SavedObjectsPermissionControl,
  SavedObjectsPermissionControlContract,
} from './permission_control/client';

export class WorkspacePlugin implements Plugin<WorkspacePluginSetup, WorkspacePluginStart> {
  private readonly logger: Logger;
  private client?: IWorkspaceClientImpl;
  private workspaceConflictControl?: WorkspaceConflictSavedObjectsClientWrapper;
  private permissionControl?: SavedObjectsPermissionControlContract;
  private readonly globalConfig$: Observable<SharedGlobalConfig>;
  private workspaceSavedObjectsClientWrapper?: WorkspaceSavedObjectsClientWrapper;

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
    this.globalConfig$ = initializerContext.config.legacy.globalConfig$;
  }

  public async setup(core: CoreSetup) {
    this.logger.debug('Setting up Workspaces service');
    const globalConfig = await this.globalConfig$.pipe(first()).toPromise();
    const isPermissionControlEnabled = globalConfig.savedObjects.permission.enabled === true;

    this.client = new WorkspaceClient(core);

    await this.client.setup(core);

    this.workspaceConflictControl = new WorkspaceConflictSavedObjectsClientWrapper();

    core.savedObjects.addClientWrapper(
      -1,
      WORKSPACE_CONFLICT_CONTROL_SAVED_OBJECTS_CLIENT_WRAPPER_ID,
      this.workspaceConflictControl.wrapperFactory
    );
    this.proxyWorkspaceTrafficToRealHandler(core);

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
      isPermissionControlEnabled,
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
