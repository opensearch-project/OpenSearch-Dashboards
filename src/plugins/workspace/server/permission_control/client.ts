/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import {
  ACL,
  TransformedPermission,
  SavedObjectsBulkGetObject,
  SavedObjectsServiceStart,
  Logger,
  OpenSearchDashboardsRequest,
  Principals,
  SavedObject,
  WORKSPACE_TYPE,
  Permissions,
  HttpAuth,
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
  private auth?: HttpAuth;
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
  public async setup(getScopedClient: SavedObjectsServiceStart['getScopedClient'], auth: HttpAuth) {
    this._getScopedClient = getScopedClient;
    this.auth = auth;
  }
  public async validate(
    request: OpenSearchDashboardsRequest,
    savedObject: SavedObjectsBulkGetObject,
    permissionModes: SavedObjectsPermissionModes
  ) {
    return await this.batchValidate(request, [savedObject], permissionModes);
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

  public getPrincipalsFromRequest(request: OpenSearchDashboardsRequest) {
    return getPrincipalsFromRequest(request, this.auth);
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
    const hasPermissionToAllObjects = savedObjects.every((savedObject) => {
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
    if (!hasPermissionToAllObjects) {
      this.logNotPermitted(notPermittedSavedObjects, principals, permissionModes);
    }
    return hasPermissionToAllObjects;
  }

  /**
   * Performs batch validation to check if the current request has access to specified saved objects
   * with the given permission modes.
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
    if (!savedObjectsGet.length) {
      return {
        success: false,
        error: i18n.translate('savedObjects.permission.notFound', {
          defaultMessage: 'Can not find target saved objects.',
        }),
      };
    }

    if (savedObjectsGet.some((item) => item.error)) {
      return {
        success: false,
        error: savedObjectsGet
          .filter((item) => item.error)
          .map((item) => item.error?.error)
          .join('\n'),
      };
    }

    const principals = this.getPrincipalsFromRequest(request);
    const deniedObjects: Array<
      Pick<SavedObjectsBulkGetObject, 'id' | 'type'> & {
        workspaces?: string[];
        permissions?: Permissions;
      }
    > = [];
    const hasPermissionToAllObjects = savedObjectsGet.every((item) => {
      // for object that doesn't contain ACL like config, return true
      if (!item.permissions) {
        return true;
      }
      const aclInstance = new ACL(item.permissions);
      const hasPermission = aclInstance.hasPermission(permissionModes, principals);
      if (!hasPermission) {
        deniedObjects.push({
          id: item.id,
          type: item.type,
          workspaces: item.workspaces,
          permissions: item.permissions,
        });
      }
      return hasPermission;
    });
    if (!hasPermissionToAllObjects) {
      this.logger.debug(
        `Authorization failed, principals: ${JSON.stringify(
          principals
        )} has no [${permissionModes}] permissions on the requested saved object: ${JSON.stringify(
          deniedObjects
        )}`
      );
    }
    return {
      success: true,
      result: hasPermissionToAllObjects,
    };
  }
}
