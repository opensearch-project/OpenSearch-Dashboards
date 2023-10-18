/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import Boom from '@hapi/boom';
import {
  SavedObject,
  SavedObjectsBaseOptions,
  SavedObjectsBulkCreateObject,
  SavedObjectsBulkResponse,
  SavedObjectsClientWrapperFactory,
  SavedObjectsCreateOptions,
  SavedObjectsErrorHelpers,
  SavedObjectsUtils,
  SavedObjectsSerializer,
  SavedObjectsCheckConflictsObject,
  SavedObjectsCheckConflictsResponse,
} from '../../../../core/server';

const errorContent = (error: Boom.Boom) => error.output.payload;

export class WorkspaceConflictSavedObjectsClientWrapper {
  private _serializer?: SavedObjectsSerializer;
  public setSerializer(serializer: SavedObjectsSerializer) {
    this._serializer = serializer;
  }
  private getRawId(props: { namespace?: string; id: string; type: string }) {
    return (
      this._serializer?.generateRawId(props.namespace, props.type, props.id) ||
      `${props.type}:${props.id}`
    );
  }
  public wrapperFactory: SavedObjectsClientWrapperFactory = (wrapperOptions) => {
    const createWithWorkspaceConflictCheck = async <T = unknown>(
      type: string,
      attributes: T,
      options: SavedObjectsCreateOptions = {}
    ) => {
      const { workspaces, id, overwrite } = options;
      let savedObjectWorkspaces = options?.workspaces;

      if (id && overwrite && workspaces) {
        let currentItem;
        try {
          currentItem = await wrapperOptions.client.get(type, id);
        } catch (e) {
          // this.get will throw an error when no items can be found
        }
        if (currentItem) {
          if (
            SavedObjectsUtils.filterWorkspacesAccordingToSourceWorkspaces(
              workspaces,
              currentItem.workspaces
            ).length
          ) {
            throw SavedObjectsErrorHelpers.createConflictError(type, id);
          } else {
            savedObjectWorkspaces = currentItem.workspaces;
          }
        }
      }

      return await wrapperOptions.client.create(type, attributes, {
        ...options,
        workspaces: savedObjectWorkspaces,
      });
    };

    const bulkCreateWithWorkspaceConflictCheck = async <T = unknown>(
      objects: Array<SavedObjectsBulkCreateObject<T>>,
      options: SavedObjectsCreateOptions = {}
    ): Promise<SavedObjectsBulkResponse<T>> => {
      const { overwrite, namespace } = options;
      const bulkGetDocs = objects
        .filter((object) => !!(object.id && options.workspaces))
        .map((object) => {
          const { type, id } = object;
          /**
           * It requires a check when overwriting objects to target workspaces
           */
          return {
            type,
            id: id as string,
            fields: ['id', 'workspaces'],
          };
        });
      const objectsConflictWithWorkspace: SavedObject[] = [];
      const objectsMapWorkspaces: Record<string, string[] | undefined> = {};
      if (bulkGetDocs.length) {
        const bulkGetResult = await wrapperOptions.client.bulkGet(bulkGetDocs);

        bulkGetResult.saved_objects.forEach((object) => {
          if (!object.error && object.id && overwrite) {
            /**
             * When it is about to overwrite a object into options.workspace.
             * We need to check if the options.workspaces is the subset of object.workspaces,
             * Or it will be treated as a conflict
             */
            const filteredWorkspaces = SavedObjectsUtils.filterWorkspacesAccordingToSourceWorkspaces(
              options.workspaces,
              object.workspaces
            );
            const { id, type } = object;
            if (filteredWorkspaces.length) {
              /**
               * options.workspaces is not a subset of object.workspaces,
               * return a conflict error.
               */
              objectsConflictWithWorkspace.push({
                id,
                type,
                attributes: {},
                references: [],
                error: {
                  ...errorContent(SavedObjectsErrorHelpers.createConflictError(type, id)),
                  metadata: { isNotOverwritable: true },
                },
              });
            } else {
              objectsMapWorkspaces[this.getRawId({ namespace, type, id })] = object.workspaces;
            }
          }
        });
      }

      const objectsFilteredByError = objects.filter(
        (item) =>
          !objectsConflictWithWorkspace.find(
            (errorItems) =>
              this.getRawId({ namespace, type: errorItems.type, id: errorItems.id }) ===
              this.getRawId({ namespace, type: item.type, id: item.id as string })
          )
      );
      let objectsPayload = objectsFilteredByError;
      if (overwrite) {
        objectsPayload = objectsPayload.map((item) => {
          if (item.id) {
            item.workspaces =
              objectsMapWorkspaces[
                this.getRawId({
                  namespace,
                  id: item.id,
                  type: item.type,
                })
              ];
          }

          return item;
        });
      }
      const realBulkCreateResult = await wrapperOptions.client.bulkCreate(objectsPayload, options);
      const result: SavedObjectsBulkResponse = {
        ...realBulkCreateResult,
        saved_objects: [...objectsConflictWithWorkspace, ...realBulkCreateResult.saved_objects],
      };
      return result as SavedObjectsBulkResponse<T>;
    };

    const checkConflictWithWorkspaceConflictCheck = async (
      objects: SavedObjectsCheckConflictsObject[] = [],
      options: SavedObjectsBaseOptions = {}
    ) => {
      const objectsConflictWithWorkspace: SavedObjectsCheckConflictsResponse['errors'] = [];
      if (options.workspaces) {
        if (objects.length === 0) {
          return { errors: [] };
        }

        const bulkGetDocs: any[] = objects.map((object) => {
          const { type, id } = object;

          return {
            type,
            id,
            fields: ['id', 'workspaces'],
          };
        });

        if (bulkGetDocs.length) {
          const bulkGetResult = await wrapperOptions.client.bulkGet(bulkGetDocs);

          bulkGetResult.saved_objects.forEach((object) => {
            const { id, type } = object;
            if (!object.error) {
              let workspaceConflict = false;
              if (options.workspaces) {
                const filteredWorkspaces = SavedObjectsUtils.filterWorkspacesAccordingToSourceWorkspaces(
                  options.workspaces,
                  object.workspaces
                );
                if (filteredWorkspaces.length) {
                  workspaceConflict = true;
                }
              }
              if (workspaceConflict) {
                objectsConflictWithWorkspace.push({
                  id,
                  type,
                  error: {
                    ...errorContent(SavedObjectsErrorHelpers.createConflictError(type, id)),
                    metadata: { isNotOverwritable: true },
                  },
                });
              }
            }
          });
        }
      }

      const objectsFilteredByError = objects.filter(
        (item) =>
          !objectsConflictWithWorkspace.find(
            (errorItems) =>
              this.getRawId({
                namespace: options.namespace,
                type: errorItems.type,
                id: errorItems.id,
              }) ===
              this.getRawId({
                namespace: options.namespace,
                type: item.type,
                id: item.id as string,
              })
          )
      );
      const realBulkCreateResult = await wrapperOptions.client.checkConflicts(
        objectsFilteredByError,
        options
      );
      const result: SavedObjectsCheckConflictsResponse = {
        ...realBulkCreateResult,
        errors: [...objectsConflictWithWorkspace, ...realBulkCreateResult.errors],
      };

      return result;
    };

    return {
      ...wrapperOptions.client,
      create: createWithWorkspaceConflictCheck,
      bulkCreate: bulkCreateWithWorkspaceConflictCheck,
      checkConflicts: checkConflictWithWorkspaceConflictCheck,
      delete: wrapperOptions.client.delete,
      find: wrapperOptions.client.find,
      bulkGet: wrapperOptions.client.bulkGet,
      get: wrapperOptions.client.get,
      update: wrapperOptions.client.update,
      bulkUpdate: wrapperOptions.client.bulkUpdate,
      errors: wrapperOptions.client.errors,
      addToNamespaces: wrapperOptions.client.addToNamespaces,
      deleteFromNamespaces: wrapperOptions.client.deleteFromNamespaces,
    };
  };

  constructor() {}
}
