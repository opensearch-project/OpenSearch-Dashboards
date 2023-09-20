/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { i18n } from '@osd/i18n';
import { OpenSearchDashboardsRequest } from '../../../../core/server';
import {
  ACL,
  TransformedPermission,
  SavedObjectsBulkGetObject,
  SavedObjectsServiceStart,
  Logger,
  WORKSPACE_TYPE,
} from '../../../../core/server';
import { WORKSPACE_SAVED_OBJECTS_CLIENT_WRAPPER_ID } from '../../common/constants';
import { getPrincipalsFromRequest } from '../utils';

export type SavedObjectsPermissionControlContract = Pick<
  SavedObjectsPermissionControl,
  keyof SavedObjectsPermissionControl
>;

export type SavedObjectsPermissionModes = string[];

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

    const principals = getPrincipalsFromRequest(request);
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
    const principals = getPrincipalsFromRequest(request);
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
