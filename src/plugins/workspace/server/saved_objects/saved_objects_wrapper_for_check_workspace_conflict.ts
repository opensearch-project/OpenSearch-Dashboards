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
  SavedObjectsSerializer,
  SavedObjectsCheckConflictsObject,
  SavedObjectsCheckConflictsResponse,
} from '../../../../core/server';

const errorContent = (error: Boom.Boom) => error.output.payload;

const filterWorkspacesAccordingToSourceWorkspaces = (
  targetWorkspaces?: string[],
  baseWorkspaces?: string[]
): string[] => targetWorkspaces?.filter((item) => !baseWorkspaces?.includes(item)) || [];

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

  /**
   * Workspace is a concept to manage saved objects and the `workspaces` field of each object indicates workspaces the object belongs to.
   * When user tries to update an existing object's attribute, workspaces field should be preserved. Below are some cases that this conflict wrapper will take effect:
   * 1. Overwrite a object belonging to workspace A with parameter workspace B, in this case we should deny the request as it conflicts with workspaces check.
   * 2. Overwrite a object belonging to workspace [A, B] with parameters workspace B, we need to preserved the workspaces fields to [A, B].
   */
  public wrapperFactory: SavedObjectsClientWrapperFactory = (wrapperOptions) => {
    const createWithWorkspaceConflictCheck = async <T = unknown>(
      type: string,
      attributes: T,
      options: SavedObjectsCreateOptions = {}
    ) => {
      const { workspaces, id, overwrite } = options;
      let savedObjectWorkspaces = options?.workspaces;

      /**
       * Check if overwrite with id
       * If so, need to reserve the workspace params
       */
      if (id && overwrite) {
        let currentItem;
        try {
          currentItem = await wrapperOptions.client.get(type, id);
        } catch (e: unknown) {
          const error = e as Boom.Boom;
          if (error?.output?.statusCode === 404) {
            // If item can not be found, supress the error and create the object
          } else {
            // Throw other error
            throw e;
          }
        }
        if (currentItem) {
          if (
            filterWorkspacesAccordingToSourceWorkspaces(workspaces, currentItem.workspaces).length
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
      /**
       * When overwrite, filter out all the objects that have ids
       */
      const bulkGetDocs = overwrite
        ? objects
            .filter((object) => !!object.id)
            .map((object) => {
              /**
               * If the object waiting to import has id and type,
               * Add it to the buldGetDocs to fetch the latest metadata.
               */
              const { type, id } = object;
              return {
                type,
                id: id as string,
                fields: ['id', 'workspaces'],
              };
            })
        : [];
      const objectsConflictWithWorkspace: SavedObject[] = [];
      const objectsMapWorkspaces: Record<string, string[] | undefined> = {};
      if (bulkGetDocs.length) {
        /**
         * Get latest status of objects
         */
        const bulkGetResult = await wrapperOptions.client.bulkGet(bulkGetDocs);

        bulkGetResult.saved_objects.forEach((object) => {
          const { id, type } = object;

          /**
           * If the object can not be found, create object by using options.workspaces
           */
          if (object.error && object.error.statusCode === 404) {
            objectsMapWorkspaces[this.getRawId({ namespace, type, id })] = options.workspaces;
          }

          /**
           * Skip the items with error, wrapperOptions.client will handle the error
           */
          if (!object.error && object.id) {
            /**
             * When it is about to overwrite a object into options.workspace.
             * We need to check if the options.workspaces is the subset of object.workspaces,
             * Or it will be treated as a conflict
             */
            const filteredWorkspaces = filterWorkspacesAccordingToSourceWorkspaces(
              options.workspaces,
              object.workspaces
            );
            if (filteredWorkspaces.length) {
              /**
               * options.workspaces is not a subset of object.workspaces,
               * Add the item into conflict array.
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
              /**
               * options.workspaces is a subset of object's workspaces
               * Add the workspaces status into a objectId -> workspaces pairs for later use.
               */
              objectsMapWorkspaces[this.getRawId({ namespace, type, id })] = object.workspaces;
            }
          }
        });
      }

      /**
       * Get all the objects that do not conflict on workspaces
       */
      const objectsNoWorkspaceConflictError = objects.filter(
        (item) =>
          !objectsConflictWithWorkspace.find(
            (errorItems) =>
              this.getRawId({ namespace, type: errorItems.type, id: errorItems.id }) ===
              this.getRawId({ namespace, type: item.type, id: item.id as string })
          )
      );

      /**
       * Add the workspaces params back based on objects' workspaces value in index.
       */
      const objectsPayload = objectsNoWorkspaceConflictError.map((item) => {
        if (item.id) {
          const workspacesParamsInIndex =
            objectsMapWorkspaces[
              this.getRawId({
                namespace,
                id: item.id,
                type: item.type,
              })
            ];
          if (workspacesParamsInIndex) {
            item.workspaces = workspacesParamsInIndex;
          }
        }

        return item;
      });

      /**
       * Bypass those objects that are not conflict on workspaces check.
       */
      const realBulkCreateResult = await wrapperOptions.client.bulkCreate(objectsPayload, options);

      /**
       * Merge the workspaceConflict result and real client bulkCreate result.
       */
      return {
        ...realBulkCreateResult,
        saved_objects: [
          ...objectsConflictWithWorkspace,
          ...(realBulkCreateResult?.saved_objects || []),
        ],
      } as SavedObjectsBulkResponse<T>;
    };

    const checkConflictWithWorkspaceConflictCheck = async (
      objects: SavedObjectsCheckConflictsObject[] = [],
      options: SavedObjectsBaseOptions = {}
    ) => {
      const objectsConflictWithWorkspace: SavedObjectsCheckConflictsResponse['errors'] = [];
      /**
       * Fail early when no objects
       */
      if (objects.length === 0) {
        return { errors: [] };
      }

      /**
       * Workspace conflict only happens when target workspaces params present.
       */
      if (options.workspaces) {
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
            /**
             * Skip the error ones, real checkConflict in repository will handle that.
             */
            if (!object.error) {
              let workspaceConflict = false;
              const filteredWorkspaces = filterWorkspacesAccordingToSourceWorkspaces(
                options.workspaces,
                object.workspaces
              );
              if (filteredWorkspaces.length) {
                workspaceConflict = true;
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

      const objectsNoWorkspaceConflictError = objects.filter(
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

      /**
       * Bypass those objects that are not conflict on workspaces
       */
      const realBulkCreateResult = await wrapperOptions.client.checkConflicts(
        objectsNoWorkspaceConflictError,
        options
      );

      /**
       * Merge results from two conflict check.
       */
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
