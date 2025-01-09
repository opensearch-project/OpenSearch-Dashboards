/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Capabilities, OpenSearchDashboardsRequest, RequestHandlerContext } from '../index';

export interface SecurityServiceSetup {
  registerReadonlyService(service: IReadOnlyService): void;
  readonlyService(): IReadOnlyService;
  registerSourceHandler(source: string, handler: IdentitySourceHandler): void;
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
}

export interface IdentitySourceHandler {
  getUsers?: (
    params: { page?: number; perPage?: number; type?: string },
    request: OpenSearchDashboardsRequest,
    context: RequestHandlerContext
  ) => Promise<IdentityEntry[] | []>;
  getRoles?: (
    params: { page?: number; perPage?: number; type?: string },
    request: OpenSearchDashboardsRequest,
    context: RequestHandlerContext
  ) => Promise<IdentityEntry[] | []>;
}
