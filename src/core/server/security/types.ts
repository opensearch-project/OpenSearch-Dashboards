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
 *  In role-based authentication, there are two main types: internalusers/roles, and the handler is designed to primarily handle these terms.
 **/
export interface IdentitySourceHandler {
  getIdentityEntries?: (
    params: { page?: number; perPage?: number; keyword?: string; type: string },
    request: OpenSearchDashboardsRequest,
    context: RequestHandlerContext
  ) => Promise<IdentityEntry[]>;
  getIdentityEntriesByIds?: (
    params: { ids: string[]; type: string },
    request: OpenSearchDashboardsRequest,
    context: RequestHandlerContext
  ) => Promise<IdentityEntry[]>;
}
