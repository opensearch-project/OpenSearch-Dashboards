/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PublicMethodsOf } from '@osd/utility-types';
import { SidecarService, OverlaySidecarStart } from './sidecar_service';
import { BehaviorSubject } from 'rxjs';
import { ISidecarConfig, SIDECAR_DOCKED_MODE } from './sidecar_service';

const createStartContractMock = () => {
  const startContract: jest.Mocked<OverlaySidecarStart> = {
    open: jest.fn(),
    setSidecarConfig: jest.fn(),
    getSidecarConfig$: jest.fn().mockReturnValue(
      new BehaviorSubject<ISidecarConfig>({
        dockedMode: SIDECAR_DOCKED_MODE.RIGHT,
        paddingSize: 640,
      })
    ),
    hide: jest.fn(),
    show: jest.fn(),
  };
  return startContract;
};

const createMock = () => {
  const mocked: jest.Mocked<PublicMethodsOf<SidecarService>> = {
    start: jest.fn(),
  };
  mocked.start.mockReturnValue(createStartContractMock());
  return mocked;
};

export const overlaySidecarServiceMock = {
  create: createMock,
  createStartContract: createStartContractMock,
};
