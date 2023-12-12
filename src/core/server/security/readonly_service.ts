/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { merge } from 'lodash';
import { OpenSearchDashboardsRequest, Capabilities } from '../index';
import { IReadOnlyService } from './types';

export class ReadonlyService implements IReadOnlyService {
  async isReadonly(request: OpenSearchDashboardsRequest): Promise<boolean> {
    return false;
  }

  async hideForReadonly(
    request: OpenSearchDashboardsRequest,
    capabilites: Partial<Capabilities>,
    hideCapabilities: Partial<Capabilities>
  ): Promise<Partial<Capabilities>> {
    return (await this.isReadonly(request)) ? merge(capabilites, hideCapabilities) : capabilites;
  }
}
