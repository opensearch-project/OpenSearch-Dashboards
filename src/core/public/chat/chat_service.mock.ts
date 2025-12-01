/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { ChatServiceSetup, ChatServiceStart } from './types';

const createSetupContractMock = (): jest.Mocked<ChatServiceSetup> => ({
  setImplementation: jest.fn(),
  setSuggestedActionsService: jest.fn(),
  suggestedActionsService: undefined,
});

const createStartContractMock = (): jest.Mocked<ChatServiceStart> => ({
  isAvailable: jest.fn().mockReturnValue(false),
  isWindowOpen: jest.fn().mockReturnValue(false),
  getThreadId$: jest.fn().mockReturnValue(new BehaviorSubject<string>('')),
  getThreadId: jest.fn().mockReturnValue(''),
  setThreadId: jest.fn(),
  newThread: jest.fn(),
  openWindow: jest.fn(),
  closeWindow: jest.fn(),
  getWindowState: jest.fn().mockReturnValue({
    isWindowOpen: false,
    windowMode: 'sidecar',
    paddingSize: 400,
  }),
  setWindowState: jest.fn(),
  sendMessage: jest.fn().mockResolvedValue({
    observable: null,
    userMessage: { id: 'mock-id', role: 'user', content: 'mock-content' },
  }),
  sendMessageWithWindow: jest.fn().mockResolvedValue({
    observable: null,
    userMessage: { id: 'mock-id', role: 'user', content: 'mock-content' },
  }),
  getWindowState$: jest.fn().mockReturnValue(
    new BehaviorSubject({
      isWindowOpen: false,
      windowMode: 'sidecar',
      paddingSize: 400,
    })
  ),
  onWindowOpen: jest.fn().mockReturnValue(() => {}),
  onWindowClose: jest.fn().mockReturnValue(() => {}),
  suggestedActionsService: undefined,
});

export const coreChatServiceMock = {
  createSetupContract: createSetupContractMock,
  createStartContract: createStartContractMock,
};
