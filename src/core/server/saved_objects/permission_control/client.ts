/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { i18n } from '@osd/i18n';
import { OpenSearchDashboardsRequest } from '../../http';
import { ensureRawRequest } from '../../http/router';
import { SavedObjectsServiceStart } from '../saved_objects_service';
import { SavedObjectsBulkGetObject } from '../service';
import { ACL, Principals, TransformedPermission, PrincipalType } from './acl';
import { WORKSPACE_TYPE } from '../constants';

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
  private createInternalRepository?: SavedObjectsServiceStart['createInternalRepository'];
  private getInternalRepository() {
    return this.createInternalRepository?.();
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
    return (await this.getInternalRepository()?.bulkGet(savedObjects))?.saved_objects || [];
  }
  public async setup(
    createInternalRepository: SavedObjectsServiceStart['createInternalRepository']
  ) {
    this.createInternalRepository = createInternalRepository;
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
    if (savedObjectsGet) {
      const principals = this.getPrincipalsFromRequest(request);
      const hasAllPermission = savedObjectsGet.every((item) => {
        // for object that doesn't contain ACL like config, return true
        if (!item.permissions) {
          return true;
        }
        const aclInstance = new ACL(item.permissions);
        return aclInstance.hasPermission(permissionModes, principals);
      });
      return {
        success: true,
        result: hasAllPermission,
      };
    }

    return {
      success: false,
      error: i18n.translate('savedObjects.permission.notFound', {
        defaultMessage: 'Can not find target saved objects.',
      }),
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
    const queryDSL = ACL.genereateGetPermittedSavedObjectsQueryDSL(permissionModes, principals, [
      WORKSPACE_TYPE,
    ]);
    const repository = this.getInternalRepository();
    try {
      const result = await repository?.find({
        type: [WORKSPACE_TYPE],
        queryDSL,
        perPage: 999,
      });
      return result?.saved_objects.map((item) => item.id);
    } catch (e) {
      return [];
    }
  }
}
