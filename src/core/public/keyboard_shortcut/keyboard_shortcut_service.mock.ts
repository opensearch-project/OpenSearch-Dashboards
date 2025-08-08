/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
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
});

const createMock = (): jest.Mocked<KeyboardShortcutServiceContract> => ({
  setup: jest.fn().mockReturnValue(createSetupMock()),
  start: jest.fn().mockReturnValue(createStartMock()),
  stop: jest.fn(),
});

export const keyboardShortcutServiceMock = {
  create: createMock,
  createSetup: createSetupMock,
  createStart: createStartMock,
};
