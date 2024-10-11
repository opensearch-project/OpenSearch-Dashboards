/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ACLAuditorStateKey, getACLAuditor } from '../../../../core/server/utils';
import {
  OpenSearchDashboardsRequest,
  SavedObjectsClientWrapperFactory,
} from '../../../../core/server';

export class RepositoryWrapper {
  public wrapperFactory: SavedObjectsClientWrapperFactory = (wrapperOptions) => {
    const ACLAuditDecorator = function <T extends (...args: any[]) => any>(
      fn: T,
      request: OpenSearchDashboardsRequest,
      getCount: (args: Parameters<T>) => number = () => 1
    ): T {
      return function (...args: Parameters<T>): ReturnType<T> {
        const result = fn.apply(wrapperOptions.client, args);
        const ACLAuditor = getACLAuditor(request);
        ACLAuditor?.increment(ACLAuditorStateKey.DATABASE_OPERATION, getCount(args));
        return result;
      } as T;
    };

    return {
      ...wrapperOptions.client,
      get: ACLAuditDecorator(wrapperOptions.client.get, wrapperOptions.request),
      checkConflicts: wrapperOptions.client.checkConflicts,
      find: wrapperOptions.client.find,
      bulkGet: ACLAuditDecorator(
        wrapperOptions.client.bulkGet,
        wrapperOptions.request,
        (args) => args[0]?.length || 0
      ),
      errors: wrapperOptions.client.errors,
      addToNamespaces: wrapperOptions.client.addToNamespaces,
      deleteFromNamespaces: wrapperOptions.client.deleteFromNamespaces,
      create: ACLAuditDecorator(wrapperOptions.client.create, wrapperOptions.request),
      bulkCreate: ACLAuditDecorator(
        wrapperOptions.client.bulkCreate,
        wrapperOptions.request,
        (args) => args[0]?.length || 0
      ),
      delete: ACLAuditDecorator(wrapperOptions.client.delete, wrapperOptions.request),
      update: ACLAuditDecorator(wrapperOptions.client.update, wrapperOptions.request),
      bulkUpdate: ACLAuditDecorator(
        wrapperOptions.client.bulkUpdate,
        wrapperOptions.request,
        (args) => args[0]?.length || 0
      ),
      deleteByWorkspace: ACLAuditDecorator(
        wrapperOptions.client.deleteByWorkspace,
        wrapperOptions.request
      ),
      addToWorkspaces: ACLAuditDecorator(
        wrapperOptions.client.addToWorkspaces,
        wrapperOptions.request
      ),
      deleteFromWorkspaces: ACLAuditDecorator(
        wrapperOptions.client.deleteFromWorkspaces,
        wrapperOptions.request
      ),
    };
  };

  constructor() {}
}
