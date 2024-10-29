/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import {
  ACL,
  SavedObjectsBulkGetObject,
  SavedObjectsServiceStart,
  Logger,
  OpenSearchDashboardsRequest,
  Principals,
  SavedObject,
  WORKSPACE_TYPE,
  HttpAuth,
} from '../../../../core/server';
import { WORKSPACE_SAVED_OBJECTS_CLIENT_WRAPPER_ID } from '../../common/constants';
import {
  ACLAuditorStateKey,
  getACLAuditor,
  getPrincipalsFromRequest,
} from '../../../../core/server/utils';

export type SavedObjectsPermissionControlContract = Pick<
  SavedObjectsPermissionControl,
  keyof SavedObjectsPermissionControl
>;

export type SavedObjectsPermissionModes = string[];

export class SavedObjectsPermissionControl {
  private readonly logger: Logger;
  private _getScopedClient?: SavedObjectsServiceStart['getScopedClient'];
  private auth?: HttpAuth;
  private _savedObjectCache: Map<string, { [key: string]: SavedObject }> = new Map();
  private _shouldCachedSavedObjects: Map<string, string[]> = new Map();
  /**
   * Returns a saved objects client that is able to:
   * 1. Read objects whose type is `workspace` because workspace is a hidden type and the permission control client will need to get the metadata of a specific workspace to do the permission check.
   * 2. Bypass saved objects permission control wrapper because the permission control client is a dependency of the wrapper to provide the ACL validation capability. It will run into infinite loop if not bypass.
   * @param request
   * @returns SavedObjectsContract
   */
  private getScopedClient(request: OpenSearchDashboardsRequest) {
    return this._getScopedClient?.(request, {
      excludedWrappers: [WORKSPACE_SAVED_OBJECTS_CLIENT_WRAPPER_ID],
      includedHiddenTypes: [WORKSPACE_TYPE],
    });
  }

  constructor(logger: Logger) {
    this.logger = logger;
  }

  private generateSavedObjectKey = ({ type, id }: { type: string; id: string }) => {
    return `${type}:${id}`;
  };

  private async bulkGetSavedObjects(
    request: OpenSearchDashboardsRequest,
    savedObjects: SavedObjectsBulkGetObject[]
  ) {
    const ACLAuditor = getACLAuditor(request);
    const requestKey = request.uuid;
    const savedObjectsToGet = savedObjects.filter(
      (savedObject) =>
        !this._savedObjectCache.get(requestKey)?.[this.generateSavedObjectKey(savedObject)]
    );
    const retrievedSavedObjects =
      savedObjectsToGet.length > 0
        ? (await this.getScopedClient?.(request)?.bulkGet(savedObjectsToGet))?.saved_objects || []
        : [];
    // System request, -1 * savedObjectsToGet.length for compensation.
    ACLAuditor?.increment(ACLAuditorStateKey.DATABASE_OPERATION, -1 * savedObjectsToGet.length);

    const retrievedSavedObjectsMap: { [key: string]: SavedObject } = {};
    retrievedSavedObjects.forEach((savedObject) => {
      const savedObjectKey = this.generateSavedObjectKey(savedObject);
      if (this._shouldCachedSavedObjects.get(requestKey)?.includes(savedObjectKey)) {
        const cachedSavedObjectsMap = this._savedObjectCache.get(requestKey) || {};
        cachedSavedObjectsMap[savedObjectKey] = savedObject;
        this._savedObjectCache.set(requestKey, cachedSavedObjectsMap);
      }
      retrievedSavedObjectsMap[savedObjectKey] = savedObject;
    });

    const results: SavedObject[] = [];
    savedObjects.forEach((savedObject) => {
      const savedObjectKey = this.generateSavedObjectKey(savedObject);
      const foundedSavedObject =
        this._savedObjectCache.get(requestKey)?.[savedObjectKey] ||
        retrievedSavedObjectsMap[savedObjectKey];
      if (foundedSavedObject) {
        results.push(foundedSavedObject);
      }
    });
    return results;
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

  /**
   * Validates the permissions for a collection of saved objects based on their Access Control Lists (ACL).
   * This method checks whether the provided principals have the specified permission modes for each saved object.
   * If any saved object lacks the required permissions, the function logs details of unauthorized access.
   *
   * @remarks
   * If a saved object doesn't have an ACL (e.g., config objects), it is considered as having the required permissions.
   * The function logs detailed information when unauthorized access is detected, including the list of denied saved objects.
   */
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
        notPermittedSavedObjects.push({
          id: savedObject.id,
          type: savedObject.type,
          workspaces: savedObject.workspaces,
          permissions: savedObject.permissions,
        });
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
        error: i18n.translate('workspace.savedObjects.permission.notFound', {
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
    const hasPermissionToAllObjects = this.validateSavedObjectsACL(
      savedObjectsGet,
      principals,
      permissionModes
    );
    return {
      success: true,
      result: hasPermissionToAllObjects,
    };
  }

  public addToCacheAllowlist(
    request: OpenSearchDashboardsRequest,
    savedObjects: Array<Pick<SavedObjectsBulkGetObject, 'type' | 'id'>>
  ) {
    const requestKey = request.uuid;
    this._shouldCachedSavedObjects.set(
      requestKey,
      Array.from(
        new Set([
          ...(this._shouldCachedSavedObjects.get(requestKey) ?? []),
          ...savedObjects.map(this.generateSavedObjectKey),
        ])
      )
    );
  }

  public clearSavedObjectsCache(request: OpenSearchDashboardsRequest) {
    const requestKey = request.uuid;
    if (this._shouldCachedSavedObjects.has(requestKey)) {
      this._shouldCachedSavedObjects.delete(requestKey);
    }
    if (this._savedObjectCache.has(requestKey)) {
      this._savedObjectCache.delete(requestKey);
    }
  }
}
