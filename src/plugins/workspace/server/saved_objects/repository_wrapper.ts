/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ACLAuditorStateKey, getACLAuditor } from '../../../../core/server/utils';
import { SavedObjectsClientWrapperFactory } from '../../../../core/server';

export class RepositoryWrapper {
  public wrapperFactory: SavedObjectsClientWrapperFactory = (wrapperOptions) => {
    const ACLAuditDecorator = function <T extends (...args: any[]) => any>(
      fn: T,
      getCount: (args: Parameters<T>) => number = () => 1
    ): T {
      return function (...args: Parameters<T>): ReturnType<T> {
        const result = fn.apply(wrapperOptions.client, args);
        const ACLAuditor = getACLAuditor(wrapperOptions.request);
        ACLAuditor?.increment(ACLAuditorStateKey.DATABASE_OPERATION, getCount(args));
        return result;
      } as T;
    };

    return {
      ...wrapperOptions.client,
      get: ACLAuditDecorator(wrapperOptions.client.get),
      checkConflicts: wrapperOptions.client.checkConflicts,
      find: wrapperOptions.client.find,
      bulkGet: ACLAuditDecorator(wrapperOptions.client.bulkGet, (args) => args[0]?.length || 0),
      errors: wrapperOptions.client.errors,
      addToNamespaces: wrapperOptions.client.addToNamespaces,
      deleteFromNamespaces: wrapperOptions.client.deleteFromNamespaces,
      create: ACLAuditDecorator(wrapperOptions.client.create),
      bulkCreate: ACLAuditDecorator(
        wrapperOptions.client.bulkCreate,
        (args) => args[0]?.length || 0
      ),
      delete: ACLAuditDecorator(wrapperOptions.client.delete),
      update: ACLAuditDecorator(wrapperOptions.client.update),
      bulkUpdate: ACLAuditDecorator(
        wrapperOptions.client.bulkUpdate,
        (args) => args[0]?.length || 0
      ),
      deleteByWorkspace: ACLAuditDecorator(wrapperOptions.client.deleteByWorkspace),
      addToWorkspaces: ACLAuditDecorator(wrapperOptions.client.addToWorkspaces),
      deleteFromWorkspaces: ACLAuditDecorator(wrapperOptions.client.deleteFromWorkspaces),
    };
  };

  constructor() {}
}
