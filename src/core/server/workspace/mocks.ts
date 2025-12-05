/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IWorkspaceService } from '.';
import { InternalWorkspaceServiceSetup, InternalWorkspaceServiceStart } from './workspace_service';

const createWorkspaceServiceMock = () => {
  const mocked: jest.Mocked<IWorkspaceService> = {
    setup: jest.fn().mockReturnValue(createInternalSetupContractMock()),
    start: jest.fn().mockReturnValue({}),
    stop: jest.fn(),
  };

  return mocked;
};

const createInternalSetupContractMock = () => {
  const mocked: jest.Mocked<InternalWorkspaceServiceSetup> = {
    isWorkspaceEnabled: jest.fn(),
  };

  return mocked;
};
const createSetupContractMock = createInternalSetupContractMock;

const createInternalStartContractMock = () => {
  const mocked: jest.Mocked<InternalWorkspaceServiceStart> = {
    isWorkspaceEnabled: jest.fn(),
  };

  return mocked;
};
const createStartContractMock = createInternalStartContractMock;

export const workspaceServiceMock = {
  create: createWorkspaceServiceMock,
  createInternalSetupContract: createInternalSetupContractMock,
  createInternalStartContract: createInternalStartContractMock,
  createSetupContract: createSetupContractMock,
  createStartContract: createStartContractMock,
};
