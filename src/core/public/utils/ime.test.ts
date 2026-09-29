/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { KeyboardEvent } from 'react';
import { isImeComposing } from './ime';

const keyDown = (init: KeyboardEventInit & { keyCode?: number }) =>
  ({
    nativeEvent: new window.KeyboardEvent('keydown', init),
    keyCode: init.keyCode ?? 0,
  }) as unknown as KeyboardEvent;

describe('isImeComposing', () => {
  it('is false for a plain Enter', () => {
    expect(isImeComposing(keyDown({ key: 'Enter', keyCode: 13 }))).toBe(false);
  });

  it('is true while the native event is composing', () => {
    expect(isImeComposing(keyDown({ key: 'Enter', keyCode: 229, isComposing: true }))).toBe(true);
  });

  it('is false for a keyCode 229 Enter that arrives after the composition ended', () => {
    expect(isImeComposing(keyDown({ key: 'Enter', keyCode: 229 }))).toBe(false);
  });

  it('is false when the event has no native event', () => {
    expect(isImeComposing({} as unknown as KeyboardEvent)).toBe(false);
  });
});
