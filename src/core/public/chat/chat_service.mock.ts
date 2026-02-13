/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { ChatServiceSetup, ChatServiceStart } from './types';
import { ChatScreenshotServiceInterface } from './screenshot_service';

const createScreenshotServiceMock = (): jest.Mocked<ChatScreenshotServiceInterface> => ({
  isEnabled: jest.fn().mockReturnValue(false),
  getEnabled$: jest.fn().mockReturnValue(new BehaviorSubject<boolean>(false)),
  setEnabled: jest.fn(),
  setPageContainerElement: jest.fn(),
  getPageContainerElement: jest.fn().mockReturnValue(undefined),
  setScreenshotButton: jest.fn(),
  getScreenshotButton: jest.fn().mockReturnValue({
    title: 'Add dashboard screenshot',
    iconType: 'image',
    enabled: true,
  }),
  getScreenshotButton$: jest.fn().mockReturnValue(
    new BehaviorSubject({
      title: 'Add dashboard screenshot',
      iconType: 'image',
      enabled: true,
    })
  ),
  configure: jest.fn(),
});

const createSetupContractMock = (): jest.Mocked<ChatServiceSetup> => {
  return {
    setImplementation: jest.fn(),
    setSuggestedActionsService: jest.fn(),
    suggestedActionsService: undefined,
    setScreenshotPageContainerElement: jest.fn(),
    screenshot: createScreenshotServiceMock(),
  };
};

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
  screenshotPageContainerElement: undefined,
  screenshot: createScreenshotServiceMock(),
});

export const coreChatServiceMock = {
  createSetupContract: createSetupContractMock,
  createStartContract: createStartContractMock,
  createScreenshotService: createScreenshotServiceMock,
};
