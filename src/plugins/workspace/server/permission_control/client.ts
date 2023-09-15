/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { i18n } from '@osd/i18n';
import { ensureRawRequest, OpenSearchDashboardsRequest } from '../../../../core/server';
import {
  ACL,
  Principals,
  TransformedPermission,
  PrincipalType,
  SavedObjectsBulkGetObject,
  SavedObjectsServiceStart,
  Logger,
  WORKSPACE_TYPE,
} from '../../../../core/server';
import { WORKSPACE_SAVED_OBJECTS_CLIENT_WRAPPER_ID } from '../../common/constants';

export type SavedObjectsPermissionControlContract = Pick<
  SavedObjectsPermissionControl,
  keyof SavedObjectsPermissionControl
>;

export type SavedObjectsPermissionModes = string[];

export interface AuthInfo {
  backend_roles?: string[];
  user_name?: string;
}

export class SavedObjectsPermissionControl {
  private readonly logger: Logger;
  private _getScopedClient?: SavedObjectsServiceStart['getScopedClient'];
  private getScopedClient(request: OpenSearchDashboardsRequest) {
    return this._getScopedClient?.(request, {
      excludedWrappers: [WORKSPACE_SAVED_OBJECTS_CLIENT_WRAPPER_ID],
    });
  }

  constructor(logger: Logger) {
    this.logger = logger;
  }

  public getPrincipalsFromRequest(request: OpenSearchDashboardsRequest): Principals {
    const rawRequest = ensureRawRequest(request);
    const authInfo = rawRequest?.auth?.credentials?.authInfo as AuthInfo | null;
    const payload: Principals = {};
    if (!authInfo) {
      /**
       * Login user have access to all the workspaces when no authentication is presented.
       * The logic will be used when users create workspaces with authentication enabled but turn off authentication for any reason.
       */
      return payload;
    }
    if (!authInfo?.backend_roles?.length && !authInfo.user_name) {
      /**
       * It means OSD can not recognize who the user is even if authentication is enabled,
       * use a fake user that won't be granted permission explicitly.
       */
      payload[PrincipalType.Users] = [`_user_fake_${Date.now()}_`];
      return payload;
    }
    if (authInfo?.backend_roles) {
      payload[PrincipalType.Groups] = authInfo.backend_roles;
    }
    if (authInfo?.user_name) {
      payload[PrincipalType.Users] = [authInfo.user_name];
    }
    return payload;
  }
  private async bulkGetSavedObjects(
    request: OpenSearchDashboardsRequest,
    savedObjects: SavedObjectsBulkGetObject[]
  ) {
    return (await this.getScopedClient?.(request)?.bulkGet(savedObjects))?.saved_objects || [];
  }
  public async setup(getScopedClient: SavedObjectsServiceStart['getScopedClient']) {
    this._getScopedClient = getScopedClient;
  }
  public async validate(
    request: OpenSearchDashboardsRequest,
    savedObject: SavedObjectsBulkGetObject,
    permissionModes: SavedObjectsPermissionModes
  ) {
    return await this.batchValidate(request, [savedObject], permissionModes);
  }

  /**
   * In batch validate case, the logic is a.withPermission && b.withPermission
   * @param request
   * @param savedObjects
   * @param permissionModes
   * @returns
   */
  public async batchValidate(
    request: OpenSearchDashboardsRequest,
    savedObjects: SavedObjectsBulkGetObject[],
    permissionModes: SavedObjectsPermissionModes
  ) {
    const savedObjectsGet = await this.bulkGetSavedObjects(request, savedObjects);
    if (!savedObjectsGet) {
      return {
        success: false,
        error: i18n.translate('savedObjects.permission.notFound', {
          defaultMessage: 'Can not find target saved objects.',
        }),
      };
    }

    if (savedObjectsGet.length === 1 && !!savedObjectsGet[0].error) {
      return {
        success: false,
        error: savedObjectsGet[0].error,
      };
    }

    const principals = this.getPrincipalsFromRequest(request);
    let savedObjectsBasicInfo: any[] = [];
    const hasAllPermission = savedObjectsGet.every((item) => {
      // for object that doesn't contain ACL like config, return true
      if (!item.permissions) {
        return true;
      }
      const aclInstance = new ACL(item.permissions);
      const hasPermission = aclInstance.hasPermission(permissionModes, principals);
      if (!hasPermission) {
        savedObjectsBasicInfo = [
          ...savedObjectsBasicInfo,
          {
            id: item.id,
            type: item.type,
            workspaces: item.workspaces,
            permissions: item.permissions,
          },
        ];
      }
      return hasPermission;
    });
    if (!hasAllPermission) {
      this.logger.debug(
        `Authorization failed, principals: ${JSON.stringify(
          principals
        )} has no [${permissionModes}] permissions on the requested saved object: ${JSON.stringify(
          savedObjectsBasicInfo
        )}`
      );
    }
    return {
      success: true,
      result: hasAllPermission,
    };
  }

  public async getPrincipalsOfObjects(
    request: OpenSearchDashboardsRequest,
    savedObjects: SavedObjectsBulkGetObject[]
  ): Promise<Record<string, TransformedPermission>> {
    const detailedSavedObjects = await this.bulkGetSavedObjects(request, savedObjects);
    return detailedSavedObjects.reduce((total, current) => {
      return {
        ...total,
        [current.id]: new ACL(current.permissions).toFlatList(),
      };
    }, {});
  }

  public async getPermittedWorkspaceIds(
    request: OpenSearchDashboardsRequest,
    permissionModes: SavedObjectsPermissionModes
  ) {
    const principals = this.getPrincipalsFromRequest(request);
    const savedObjectClient = this.getScopedClient?.(request);
    try {
      const result = await savedObjectClient?.find({
        type: [WORKSPACE_TYPE],
        ACLSearchParams: {
          permissionModes,
          principals,
        },
        perPage: 999,
      });
      return result?.saved_objects.map((item) => item.id);
    } catch (e) {
      return [];
    }
  }
}
