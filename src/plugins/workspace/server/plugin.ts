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
  WORKSPACE_ID_CONSUMER_WRAPPER_ID,
  PRIORITY_FOR_WORKSPACE_CONFLICT_CONTROL_WRAPPER,
  PRIORITY_FOR_WORKSPACE_ID_CONSUMER_WRAPPER,
  PRIORITY_FOR_PERMISSION_CONTROL_WRAPPER,
  WORKSPACE_UI_SETTINGS_CLIENT_WRAPPER_ID,
  PRIORITY_FOR_WORKSPACE_UI_SETTINGS_WRAPPER,
} from '../common/constants';
import { IWorkspaceClientImpl, WorkspacePluginSetup, WorkspacePluginStart } from './types';
import { WorkspaceClient } from './workspace_client';
import { registerRoutes } from './routes';
import { WorkspaceSavedObjectsClientWrapper } from './saved_objects';
import {
  cleanWorkspaceId,
  getWorkspaceIdFromUrl,
  updateWorkspaceState,
} from '../../../core/server/utils';
import { WorkspaceConflictSavedObjectsClientWrapper } from './saved_objects/saved_objects_wrapper_for_check_workspace_conflict';
import {
  SavedObjectsPermissionControl,
  SavedObjectsPermissionControlContract,
} from './permission_control/client';
import { WorkspaceIdConsumerWrapper } from './saved_objects/workspace_id_consumer_wrapper';
import { WorkspaceUiSettingsClientWrapper } from './saved_objects/workspace_ui_settings_client_wrapper';

export class WorkspacePlugin implements Plugin<WorkspacePluginSetup, WorkspacePluginStart> {
  private readonly logger: Logger;
  private client?: IWorkspaceClientImpl;
  private workspaceConflictControl?: WorkspaceConflictSavedObjectsClientWrapper;
  private permissionControl?: SavedObjectsPermissionControlContract;
  private readonly globalConfig$: Observable<SharedGlobalConfig>;
  private workspaceSavedObjectsClientWrapper?: WorkspaceSavedObjectsClientWrapper;
  private workspaceUiSettingsClientWrapper?: WorkspaceUiSettingsClientWrapper;

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
        updateWorkspaceState(request, {
          requestWorkspaceId: workspaceId,
        });
        const requestUrl = new URL(request.url.toString());
        requestUrl.pathname = cleanWorkspaceId(requestUrl.pathname);
        return toolkit.rewriteUrl(requestUrl.toString());
      }
      return toolkit.next();
    });
  }

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
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
      PRIORITY_FOR_WORKSPACE_CONFLICT_CONTROL_WRAPPER,
      WORKSPACE_CONFLICT_CONTROL_SAVED_OBJECTS_CLIENT_WRAPPER_ID,
      this.workspaceConflictControl.wrapperFactory
    );
    this.proxyWorkspaceTrafficToRealHandler(core);

    const workspaceUiSettingsClientWrapper = new WorkspaceUiSettingsClientWrapper();
    this.workspaceUiSettingsClientWrapper = workspaceUiSettingsClientWrapper;
    core.savedObjects.addClientWrapper(
      PRIORITY_FOR_WORKSPACE_UI_SETTINGS_WRAPPER,
      WORKSPACE_UI_SETTINGS_CLIENT_WRAPPER_ID,
      workspaceUiSettingsClientWrapper.wrapperFactory
    );

    core.savedObjects.addClientWrapper(
      PRIORITY_FOR_WORKSPACE_ID_CONSUMER_WRAPPER,
      WORKSPACE_ID_CONSUMER_WRAPPER_ID,
      new WorkspaceIdConsumerWrapper(isPermissionControlEnabled).wrapperFactory
    );

    const maxImportExportSize = core.savedObjects.getImportExportObjectLimit();
    this.logger.info('Workspace permission control enabled:' + isPermissionControlEnabled);
    if (isPermissionControlEnabled) {
      this.permissionControl = new SavedObjectsPermissionControl(this.logger);

      this.workspaceSavedObjectsClientWrapper = new WorkspaceSavedObjectsClientWrapper(
        this.permissionControl
      );

      core.savedObjects.addClientWrapper(
        PRIORITY_FOR_PERMISSION_CONTROL_WRAPPER,
        WORKSPACE_SAVED_OBJECTS_CLIENT_WRAPPER_ID,
        this.workspaceSavedObjectsClientWrapper.wrapperFactory
      );
    }

    registerRoutes({
      http: core.http,
      logger: this.logger,
      client: this.client as IWorkspaceClientImpl,
      maxImportExportSize,
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
    this.workspaceUiSettingsClientWrapper?.setScopedClient(core.savedObjects.getScopedClient);

    return {
      client: this.client as IWorkspaceClientImpl,
    };
  }

  public stop() {}
}
