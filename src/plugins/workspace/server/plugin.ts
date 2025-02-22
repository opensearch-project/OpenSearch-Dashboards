/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';
import { cloneDeep } from 'lodash';
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
  WORKSPACE_INITIAL_APP_ID,
  WORKSPACE_NAVIGATION_APP_ID,
  DEFAULT_WORKSPACE,
  PRIORITY_FOR_REPOSITORY_WRAPPER,
  OPENSEARCHDASHBOARDS_CONFIG_PATH,
} from '../common/constants';
import { IWorkspaceClientImpl, WorkspacePluginSetup, WorkspacePluginStart } from './types';
import { WorkspaceClient } from './workspace_client';
import { registerRoutes } from './routes';
import { WorkspaceSavedObjectsClientWrapper } from './saved_objects';
import {
  cleanWorkspaceId,
  cleanUpACLAuditor,
  cleanUpClientCallAuditor,
  getACLAuditor,
  getWorkspaceIdFromUrl,
  getWorkspaceState,
  initializeACLAuditor,
  initializeClientCallAuditor,
  updateWorkspaceState,
} from '../../../core/server/utils';
import { WorkspaceConflictSavedObjectsClientWrapper } from './saved_objects/saved_objects_wrapper_for_check_workspace_conflict';
import {
  SavedObjectsPermissionControl,
  SavedObjectsPermissionControlContract,
} from './permission_control/client';
import { updateDashboardAdminStateForRequest } from './utils';
import { WorkspaceIdConsumerWrapper } from './saved_objects/workspace_id_consumer_wrapper';
import { WorkspaceUiSettingsClientWrapper } from './saved_objects/workspace_ui_settings_client_wrapper';
import { uiSettings } from './ui_settings';
import { RepositoryWrapper } from './saved_objects/repository_wrapper';
import { DataSourcePluginSetup } from '../../data_source/server';
import { ConfigSchema } from '../config';

export interface WorkspacePluginDependencies {
  dataSource: DataSourcePluginSetup;
}

export class WorkspacePlugin implements Plugin<WorkspacePluginSetup, WorkspacePluginStart> {
  private readonly logger: Logger;
  private client?: IWorkspaceClientImpl;
  private workspaceConflictControl?: WorkspaceConflictSavedObjectsClientWrapper;
  private permissionControl?: SavedObjectsPermissionControlContract;
  private readonly globalConfig$: Observable<SharedGlobalConfig>;
  private workspaceSavedObjectsClientWrapper?: WorkspaceSavedObjectsClientWrapper;
  private workspaceUiSettingsClientWrapper?: WorkspaceUiSettingsClientWrapper;
  private workspaceConfig$: Observable<ConfigSchema>;

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

  private setupPermission(core: CoreSetup) {
    this.permissionControl = new SavedObjectsPermissionControl(this.logger);

    core.http.registerOnPostAuth(async (request, response, toolkit) => {
      let groups: string[];
      let users: string[];

      // There may be calls to saved objects client before user get authenticated, need to add a try catch here as `getPrincipalsFromRequest` will throw error when user is not authenticated.
      try {
        ({ groups = [], users = [] } = this.permissionControl!.getPrincipalsFromRequest(request));
      } catch (e) {
        return toolkit.next();
      }
      // Get config from dynamic service client.
      const dynamicConfigServiceStart = await core.dynamicConfigService.getStartService();
      const store = dynamicConfigServiceStart.getAsyncLocalStore();
      const client = dynamicConfigServiceStart.getClient();
      const config = await client.getConfig(
        { pluginConfigPath: OPENSEARCHDASHBOARDS_CONFIG_PATH },
        { asyncLocalStorageContext: store! }
      );
      const configUsers: string[] = cloneDeep(config.dashboardAdmin.users);
      const configGroups: string[] = cloneDeep(config.dashboardAdmin.groups);

      updateDashboardAdminStateForRequest(request, groups, users, configGroups, configUsers);
      return toolkit.next();
    });

    this.workspaceSavedObjectsClientWrapper = new WorkspaceSavedObjectsClientWrapper(
      this.permissionControl
    );

    core.savedObjects.addClientWrapper(
      PRIORITY_FOR_PERMISSION_CONTROL_WRAPPER,
      WORKSPACE_SAVED_OBJECTS_CLIENT_WRAPPER_ID,
      this.workspaceSavedObjectsClientWrapper.wrapperFactory
    );

    core.savedObjects.addClientWrapper(
      PRIORITY_FOR_REPOSITORY_WRAPPER,
      // Give a symbol here so this wrapper won't be bypassed
      Symbol('repository_wrapper').toString(),
      new RepositoryWrapper().wrapperFactory
    );

    core.http.registerOnPreResponse((request, _response, toolkit) => {
      this.permissionControl?.clearSavedObjectsCache(request);
      return toolkit.next();
    });

    // Initialize ACL auditor in request.
    core.http.registerOnPostAuth((request, response, toolkit) => {
      initializeACLAuditor(request, this.logger);
      initializeClientCallAuditor(request);
      return toolkit.next();
    });

    // Clean up auditor before response.
    core.http.registerOnPreResponse((request, response, toolkit) => {
      const { isDashboardAdmin } = getWorkspaceState(request);
      if (!isDashboardAdmin) {
        // Only checkout auditor when current login user is not dashboard admin
        getACLAuditor(request)?.checkout();
      }
      cleanUpACLAuditor(request);
      cleanUpClientCallAuditor(request);
      return toolkit.next();
    });
  }

  private setUpRedirectPage(core: CoreSetup) {
    core.http.registerOnPostAuth(async (request, response, toolkit) => {
      const path = request.url.pathname;
      if (path === '/') {
        const workspaceListResponse = await this.client?.list(
          { request },
          { page: 1, perPage: 100 }
        );
        const basePath = core.http.basePath.serverBasePath;

        if (workspaceListResponse?.success && workspaceListResponse.result.total > 0) {
          const workspaceList = workspaceListResponse.result.workspaces;
          // If user only has one workspace, go to overview page of that workspace
          if (workspaceList.length === 1) {
            return response.redirected({
              headers: {
                location: `${basePath}/w/${workspaceList[0].id}/app/${WORKSPACE_NAVIGATION_APP_ID}`,
              },
            });
          }
          const [coreStart] = await core.getStartServices();
          const uiSettingsClient = coreStart.uiSettings.asScopedToClient(
            coreStart.savedObjects.getScopedClient(request)
          );
          const defaultWorkspaceId = await uiSettingsClient.get(DEFAULT_WORKSPACE);
          const defaultWorkspace = workspaceList.find(
            (workspace) => workspace.id === defaultWorkspaceId
          );
          // If user has a default workspace configured, go to overview page of that workspace
          // If user has more than one workspaces, go to homepage
          if (defaultWorkspace) {
            return response.redirected({
              headers: {
                location: `${basePath}/w/${defaultWorkspace.id}/app/${WORKSPACE_NAVIGATION_APP_ID}`,
              },
            });
          } else {
            return response.redirected({
              headers: { location: `${basePath}/app/home` },
            });
          }
        }
        // If user has no workspaces, go to initial page
        return response.redirected({
          headers: { location: `${basePath}/app/${WORKSPACE_INITIAL_APP_ID}` },
        });
      }
      return toolkit.next();
    });
  }

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
    this.globalConfig$ = initializerContext.config.legacy.globalConfig$;
    this.workspaceConfig$ = initializerContext.config.create();
  }

  public async setup(core: CoreSetup, deps: WorkspacePluginDependencies) {
    this.logger.debug('Setting up Workspaces service');
    const globalConfig = await this.globalConfig$.pipe(first()).toPromise();
    const workspaceConfig = await this.workspaceConfig$.pipe(first()).toPromise();
    const isPermissionControlEnabled = globalConfig.savedObjects.permission.enabled === true;
    const isDataSourceEnabled = !!deps.dataSource;

    // setup new ui_setting user's default workspace
    core.uiSettings.register(uiSettings);

    this.client = new WorkspaceClient(core, this.logger, {
      maximum_workspaces: workspaceConfig.maximum_workspaces,
    });

    await this.client.setup(core);

    this.workspaceConflictControl = new WorkspaceConflictSavedObjectsClientWrapper();

    core.savedObjects.addClientWrapper(
      PRIORITY_FOR_WORKSPACE_CONFLICT_CONTROL_WRAPPER,
      WORKSPACE_CONFLICT_CONTROL_SAVED_OBJECTS_CLIENT_WRAPPER_ID,
      this.workspaceConflictControl.wrapperFactory
    );
    this.proxyWorkspaceTrafficToRealHandler(core);

    const workspaceUiSettingsClientWrapper = new WorkspaceUiSettingsClientWrapper(this.logger);
    this.workspaceUiSettingsClientWrapper = workspaceUiSettingsClientWrapper;
    core.savedObjects.addClientWrapper(
      PRIORITY_FOR_WORKSPACE_UI_SETTINGS_WRAPPER,
      WORKSPACE_UI_SETTINGS_CLIENT_WRAPPER_ID,
      workspaceUiSettingsClientWrapper.wrapperFactory
    );

    core.savedObjects.addClientWrapper(
      PRIORITY_FOR_WORKSPACE_ID_CONSUMER_WRAPPER,
      WORKSPACE_ID_CONSUMER_WRAPPER_ID,
      new WorkspaceIdConsumerWrapper(this.client).wrapperFactory
    );

    const maxImportExportSize = core.savedObjects.getImportExportObjectLimit();
    this.logger.info('Workspace permission control enabled:' + isPermissionControlEnabled);
    if (isPermissionControlEnabled) this.setupPermission(core);
    const router = core.http.createRouter();

    registerRoutes({
      router,
      logger: this.logger,
      client: this.client as IWorkspaceClientImpl,
      maxImportExportSize,
      permissionControlClient: this.permissionControl,
      isPermissionControlEnabled,
      isDataSourceEnabled,
    });

    core.capabilities.registerProvider(() => ({
      workspaces: {
        enabled: true,
        permissionEnabled: isPermissionControlEnabled,
      },
      dashboards: { isDashboardAdmin: false },
    }));
    // Dynamically update capabilities based on the auth information from request.
    core.capabilities.registerSwitcher((request) => {
      // If the value is undefined/true, the user is dashboard admin.
      const isDashboardAdmin = getWorkspaceState(request).isDashboardAdmin !== false;
      return { dashboards: { isDashboardAdmin } };
    });

    this.setUpRedirectPage(core);

    return {
      client: this.client,
    };
  }

  public start(core: CoreStart) {
    this.logger.debug('Starting Workspace service');
    this.permissionControl?.setup(core.savedObjects.getScopedClient, core.http.auth);
    this.client?.setSavedObjects(core.savedObjects);
    this.client?.setUiSettings(core.uiSettings);
    this.workspaceConflictControl?.setSerializer(core.savedObjects.createSerializer());
    this.workspaceSavedObjectsClientWrapper?.setScopedClient(core.savedObjects.getScopedClient);
    this.workspaceUiSettingsClientWrapper?.setScopedClient(core.savedObjects.getScopedClient);

    return {
      client: this.client as IWorkspaceClientImpl,
    };
  }

  public stop() {}
}
