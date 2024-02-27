/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { i18n } from '@osd/i18n';
import {
  OpenSearchDashboardsRequest,
  Principals,
  SavedObject,
  WORKSPACE_TYPE,
} from '../../../../core/server';
import {
  ACL,
  TransformedPermission,
  SavedObjectsBulkGetObject,
  SavedObjectsServiceStart,
  Logger,
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
      includedHiddenTypes: [WORKSPACE_TYPE],
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

  private logNotPermitted(
    savedObjects: Array<Pick<SavedObject<unknown>, 'id' | 'type' | 'workspaces' | 'permissions'>>,
    principals: Principals,
    permissionModes: SavedObjectsPermissionModes
  ) {
    this.logger.debug(
      `Authorization failed, principals: ${JSON.stringify(
        principals
      )} has no [${permissionModes}] permissions on the requested saved object: ${JSON.stringify(
        savedObjects.map((savedObject) => ({
          id: savedObject.id,
          type: savedObject.type,
          workspaces: savedObject.workspaces,
          permissions: savedObject.permissions,
        }))
      )}`
    );
  }

  public validateSavedObjectsACL(
    savedObjects: Array<Pick<SavedObject<unknown>, 'id' | 'type' | 'workspaces' | 'permissions'>>,
    principals: Principals,
    permissionModes: SavedObjectsPermissionModes
  ) {
    const notPermittedSavedObjects: Array<Pick<
      SavedObject<unknown>,
      'id' | 'type' | 'workspaces' | 'permissions'
    >> = [];
    const hasAllPermission = savedObjects.every((savedObject) => {
      // for object that doesn't contain ACL like config, return true
      if (!savedObject.permissions) {
        return true;
      }

      const aclInstance = new ACL(savedObject.permissions);
      const hasPermission = aclInstance.hasPermission(permissionModes, principals);
      if (!hasPermission) {
        notPermittedSavedObjects.push(savedObject);
      }
      return hasPermission;
    });
    if (!hasAllPermission) {
      this.logNotPermitted(notPermittedSavedObjects, principals, permissionModes);
    }
    return hasAllPermission;
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
    return {
      success: true,
      result: this.validateSavedObjectsACL(savedObjectsGet, principals, permissionModes),
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
}
