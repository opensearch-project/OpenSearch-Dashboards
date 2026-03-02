/*
 * Copyright Wazuh
 * SPDX-License-Identifier: Apache-2.0
 */

import { HealthCheckServiceSetup, HealthCheckServiceStart } from './types';
import { BehaviorSubject } from 'rxjs';
import { HealthCheckStatus } from './service';

export const healthCheckServiceMock = {
  createSetupContract: (): HealthCheckServiceSetup => ({
    status$: new BehaviorSubject({ status: 'gray', checks: [] } as HealthCheckStatus),
  }),
  createStartContract: (): HealthCheckServiceStart => ({
    status$: new BehaviorSubject({ status: 'gray', checks: [] } as HealthCheckStatus),
    client: {
      internal: {
        fetch: jest.fn(),
        run: jest.fn(),
      },
    },
    getConfig: jest.fn(),
  }),
};
