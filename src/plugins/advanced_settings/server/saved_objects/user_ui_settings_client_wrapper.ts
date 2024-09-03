/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SavedObject,
  SavedObjectsBaseOptions,
  SavedObjectsClientWrapperFactory,
  SavedObjectsUpdateOptions,
  SavedObjectsUpdateResponse,
  CoreStart,
  ACL,
  SavedObjectsCreateOptions,
  SavedObjectsFindOptions,
  SavedObjectsFindResponse,
  OpenSearchDashboardsRequest,
} from '../../../../core/server';
import { Logger, CURRENT_USER } from '../../../../core/server';
import { extractUserName } from '../utils';

/**
 * This saved object client wrapper offers methods to get and update UI settings considering
 * the context of the current user
 */
export class UserUISettingsClientWrapper {
  constructor(
    private readonly logger: Logger,
    private readonly savedObjectsPermissionEnabled: boolean
  ) {}
  private core?: CoreStart;

  public setCore(core: CoreStart) {
    this.core = core;
  }

  private isUserLevelSetting(id: string | undefined): boolean {
    return id ? id.startsWith(CURRENT_USER) : false;
  }

  private normalizeDocId(id: string, request: OpenSearchDashboardsRequest, core?: CoreStart) {
    const userName = extractUserName(request, core);
    if (this.isUserLevelSetting(id)) {
      if (userName) {
        return id.replace(CURRENT_USER, userName);
      } else {
        return id.replace(`${CURRENT_USER}_`, '');
      }
    }
    return id;
  }

  public wrapperFactory: SavedObjectsClientWrapperFactory = (wrapperOptions) => {
    const getUiSettings = async <T = unknown>(
      type: string,
      id: string,
      options: SavedObjectsBaseOptions = {}
    ): Promise<SavedObject<T>> => {
      if (type === 'config') {
        const docId = this.normalizeDocId(id, wrapperOptions.request, this.core);
        this.logger.debug(`Getting config with original: ${id} normalizeDocId: ${docId}`);
        // user level
        return wrapperOptions.client.get(type, docId, options);
      }

      return wrapperOptions.client.get(type, id, options);
    };

    const updateUiSettings = async <T = unknown>(
      type: string,
      id: string,
      attributes: Partial<T>,
      options: SavedObjectsUpdateOptions = {}
    ): Promise<SavedObjectsUpdateResponse<T>> => {
      if (type === 'config') {
        const docId = this.normalizeDocId(id, wrapperOptions.request, this.core);
        this.logger.debug(`Getting config with original: ${id} normalizeDocId: ${docId}`);
        // update user level settings
        return await wrapperOptions.client.update(type, docId, attributes, options);
      }
      return wrapperOptions.client.update(type, id, attributes, options);
    };

    const createUiSettings = async <T = unknown>(
      type: string,
      attributes: T,
      options?: SavedObjectsCreateOptions
    ) => {
      const userName = extractUserName(wrapperOptions.request, this.core);
      const { id } = options || {};
      const userLevel = this.isUserLevelSetting(id);

      if (type === 'config' && id) {
        const docId = this.normalizeDocId(id, wrapperOptions.request, this.core);

        if (userLevel && userName) {
          const permissions = {
            permissions: new ACL()
              .addPermission(['write'], {
                users: [userName],
              })
              .getPermissions()!,
          };

          // create with reference, the reference field will used for filter settings by user
          return await wrapperOptions.client.create(type, attributes, {
            ...options,
            id: docId,
            references: [
              {
                type: 'user', // dummy type
                id: userName,
                name: userName,
              },
            ],
            ...(this.savedObjectsPermissionEnabled ? permissions : {}),
          });
        } else {
          return wrapperOptions.client.create(type, attributes, {
            ...options,
            id: docId,
          });
        }
      }
      return wrapperOptions.client.create(type, attributes, options);
    };

    const findUiSettings = async <T = unknown>(
      options: SavedObjectsFindOptions
    ): Promise<SavedObjectsFindResponse<T>> => {
      // check if options type is config
      const userName = extractUserName(wrapperOptions.request, this.core);
      const { hasReference } = options || {};
      if (options.type === 'config' && userName && hasReference) {
        const id = hasReference.id.replace(CURRENT_USER, userName);
        const resp: SavedObjectsFindResponse<T> = await wrapperOptions.client.find({
          ...options,
          hasReference: { ...hasReference, id },
        });

        // normalize the document id to real version
        resp.saved_objects.forEach((so) => {
          so.id = so.id.replace(`${userName}_`, '');
        });

        return Promise.resolve(resp);
      }
      return wrapperOptions.client.find(options);
    };

    return {
      ...wrapperOptions.client,
      checkConflicts: wrapperOptions.client.checkConflicts,
      errors: wrapperOptions.client.errors,
      addToNamespaces: wrapperOptions.client.addToNamespaces,
      deleteFromNamespaces: wrapperOptions.client.deleteFromNamespaces,
      find: findUiSettings,
      bulkGet: wrapperOptions.client.bulkGet,
      create: createUiSettings,
      bulkCreate: wrapperOptions.client.bulkCreate,
      delete: wrapperOptions.client.delete,
      bulkUpdate: wrapperOptions.client.bulkUpdate,
      deleteByWorkspace: wrapperOptions.client.deleteByWorkspace,
      get: getUiSettings,
      update: updateUiSettings,
    };
  };
}
