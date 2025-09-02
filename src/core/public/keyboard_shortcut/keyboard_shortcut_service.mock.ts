/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PublicMethodsOf } from '@osd/utility-types';
import { KeyboardShortcutService } from './keyboard_shortcut_service';
import type { KeyboardShortcutSetup, KeyboardShortcutStart } from './types';

type KeyboardShortcutServiceContract = PublicMethodsOf<KeyboardShortcutService>;

const createSetupMock = (): jest.Mocked<KeyboardShortcutSetup> => ({
  register: jest.fn(),
});

const createStartMock = (): jest.Mocked<KeyboardShortcutStart> => ({
  register: jest.fn(),
  unregister: jest.fn(),
  useKeyboardShortcut: jest.fn(),
});

const createMock = (): jest.Mocked<KeyboardShortcutServiceContract> => ({
  setup: jest.fn().mockReturnValue(createSetupMock()),
  start: jest.fn().mockReturnValue(createStartMock()),
  stop: jest.fn(),
  register: jest.fn(),
  unregister: jest.fn(),
});

export const keyboardShortcutServiceMock = {
  create: createMock,
  createSetup: createSetupMock,
  createStart: createStartMock,
};
