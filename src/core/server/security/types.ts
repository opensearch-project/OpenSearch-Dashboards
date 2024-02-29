/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Capabilities, OpenSearchDashboardsRequest } from '../index';

export interface SecurityServiceSetup {
  registerReadonlyService(service: IReadOnlyService): void;
  readonlyService(): IReadOnlyService;
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
