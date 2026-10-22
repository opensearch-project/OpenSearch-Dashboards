/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { KeyboardEvent } from 'react';
import { installImeCompositionGuard, isImeComposing } from './ime';

// `keyCode` is deprecated but still in KeyboardEventInit, and jsdom honours it.
const nativeKeyDown = (init: KeyboardEventInit) =>
  new window.KeyboardEvent('keydown', { bubbles: true, ...init });

const reactKeyDown = (init: KeyboardEventInit) =>
  ({ nativeEvent: nativeKeyDown(init) }) as unknown as KeyboardEvent;

describe('isImeComposing', () => {
  it('is false for a plain Enter', () => {
    expect(isImeComposing(reactKeyDown({ key: 'Enter', keyCode: 13 }))).toBe(false);
  });

  it('is true while the native event is composing', () => {
    expect(isImeComposing(reactKeyDown({ key: 'Enter', keyCode: 229, isComposing: true }))).toBe(
      true
    );
  });

  it('is true for the keyCode 229 Enter Safari sends after compositionend', () => {
    expect(isImeComposing(reactKeyDown({ key: 'Enter', keyCode: 229 }))).toBe(true);
  });

  it('is false for the Enter that follows a Korean commit', () => {
    expect(isImeComposing(nativeKeyDown({ key: 'Enter', keyCode: 13, isComposing: false }))).toBe(
      false
    );
  });

  it('is false when the event has no native event', () => {
    expect(isImeComposing({} as unknown as KeyboardEvent)).toBe(false);
  });
});

describe('installImeCompositionGuard', () => {
  let removeGuard: () => void;
  let input: HTMLInputElement;
  let received: string[];
  const onDocumentKeyDown = (event: Event) => {
    const { key, code, keyCode } = event as globalThis.KeyboardEvent;
    received.push(`${key}/${code}/${keyCode}`);
  };

  beforeEach(() => {
    removeGuard = installImeCompositionGuard();
    input = document.createElement('input');
    document.body.appendChild(input);
    received = [];
    document.addEventListener('keydown', onDocumentKeyDown, { capture: true });
  });

  afterEach(() => {
    document.removeEventListener('keydown', onDocumentKeyDown, { capture: true });
    removeGuard();
    input.remove();
  });

  it('stops the composing Enter and lets the Korean follow-up Enter through', () => {
    input.dispatchEvent(
      nativeKeyDown({ key: 'Enter', code: 'Enter', keyCode: 229, isComposing: true })
    );
    input.dispatchEvent(nativeKeyDown({ key: 'Enter', code: 'Enter', keyCode: 13 }));
    expect(received).toEqual(['Enter/Enter/13']);
  });

  it('stops a composing Escape', () => {
    input.dispatchEvent(
      nativeKeyDown({ key: 'Escape', code: 'Escape', keyCode: 229, isComposing: true })
    );
    expect(received).toEqual([]);
  });

  it('matches code when key is "Process" (Firefox, Chrome on Windows)', () => {
    input.dispatchEvent(
      nativeKeyDown({ key: 'Process', code: 'Enter', keyCode: 229, isComposing: true })
    );
    input.dispatchEvent(
      nativeKeyDown({ key: 'Process', code: 'NumpadEnter', keyCode: 229, isComposing: true })
    );
    expect(received).toEqual([]);
  });

  it("stops Safari's commit Enter that arrives after compositionend", () => {
    input.dispatchEvent(nativeKeyDown({ key: 'Enter', code: 'Enter', keyCode: 229 }));
    expect(received).toEqual([]);
  });

  it('leaves composing keys other than Enter and Escape alone', () => {
    input.dispatchEvent(
      nativeKeyDown({ key: 'ArrowDown', code: 'ArrowDown', keyCode: 229, isComposing: true })
    );
    input.dispatchEvent(
      nativeKeyDown({ key: ' ', code: 'Space', keyCode: 229, isComposing: true })
    );
    expect(received).toEqual(['ArrowDown/ArrowDown/229', ' /Space/229']);
  });

  it('does not cancel the default action, so the IME still commits', () => {
    const event = nativeKeyDown({
      key: 'Enter',
      code: 'Enter',
      keyCode: 229,
      isComposing: true,
      cancelable: true,
    });
    input.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it('lets keydowns from inside a Monaco editor through', () => {
    const editor = document.createElement('div');
    editor.className = 'monaco-editor';
    const textarea = document.createElement('textarea');
    editor.appendChild(textarea);
    document.body.appendChild(editor);
    textarea.dispatchEvent(
      nativeKeyDown({ key: 'Enter', code: 'Enter', keyCode: 229, isComposing: true })
    );
    editor.remove();
    expect(received).toEqual(['Enter/Enter/229']);
  });

  it('stops guarding once removed', () => {
    removeGuard();
    input.dispatchEvent(
      nativeKeyDown({ key: 'Enter', code: 'Enter', keyCode: 229, isComposing: true })
    );
    expect(received).toEqual(['Enter/Enter/229']);
    removeGuard = installImeCompositionGuard();
  });
});
