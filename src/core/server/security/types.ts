/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Capabilities, OpenSearchDashboardsRequest, RequestHandlerContext } from '../index';

export interface SecurityServiceSetup {
  registerReadonlyService(service: IReadOnlyService): void;
  readonlyService(): IReadOnlyService;
  registerIdentitySourceHandler(source: string, handler: IdentitySourceHandler): void;
}

export type InternalSecurityServiceSetup = SecurityServiceSetup;

export interface IReadOnlyService {
  isReadonly(request: OpenSearchDashboardsRequest): Promise<boolean>;
  hideForReadonly(
    request: OpenSearchDashboardsRequest,
    capabilites: Capabilities,
    hideCapabilities: Partial<Capabilities>
  ): Promise<Partial<Capabilities>>;
}

export interface IdentityEntry {
  name: string;
  id: string;
  error?: string;
}

/**
 *  The identitySource handler primarily facilitates role-based authentication as the OpenSearch Security plugin employs this approach.
 *  In role-based authentication, there are two main concepts: user/role, and the handler is designed to primarily handle these terms.
 **/
export interface IdentitySourceHandler {
  getUsers?: (
    params: { page?: number; perPage?: number; keyword?: string },
    request: OpenSearchDashboardsRequest,
    context: RequestHandlerContext
  ) => Promise<IdentityEntry[]>;
  getRoles?: (
    params: { page?: number; perPage?: number; keyword?: string },
    request: OpenSearchDashboardsRequest,
    context: RequestHandlerContext
  ) => Promise<IdentityEntry[]>;
  getNamesWithIds?: (
    params: { userIds: string[] },
    request: OpenSearchDashboardsRequest,
    context: RequestHandlerContext
  ) => Promise<IdentityEntry[]>;
  getRolesWithIds?: (
    params: { roleIds: string[] },
    request: OpenSearchDashboardsRequest,
    context: RequestHandlerContext
  ) => Promise<IdentityEntry[]>;
}
