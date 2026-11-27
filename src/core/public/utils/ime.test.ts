/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { type KeyboardEvent } from 'react';
import { fireEvent, render } from '@testing-library/react';
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

  it('is true for the keyCode 229 Enter Safari sends after compositionend', () => {
    expect(isImeComposing(reactKeyDown({ key: 'Enter', keyCode: 229 }))).toBe(true);
  });

  it('is true for a composing keydown that carries the real keyCode', () => {
    expect(isImeComposing(reactKeyDown({ key: 'Enter', keyCode: 13, isComposing: true }))).toBe(
      true
    );
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

  it('matches key when code is empty', () => {
    input.dispatchEvent(
      nativeKeyDown({ key: 'Escape', code: '', keyCode: 229, isComposing: true })
    );
    expect(received).toEqual([]);
  });

  it('lets the keyCode 229 keydowns of Android virtual keyboards through', () => {
    input.dispatchEvent(nativeKeyDown({ key: 'Unidentified', code: '', keyCode: 229 }));
    expect(received).toEqual(['Unidentified//229']);
  });

  it("stops Safari's commit Enter and cancel Escape that arrive after compositionend", () => {
    input.dispatchEvent(nativeKeyDown({ key: 'Enter', code: 'Enter', keyCode: 229 }));
    input.dispatchEvent(nativeKeyDown({ key: 'Escape', code: 'Escape', keyCode: 229 }));
    expect(received).toEqual([]);
  });

  it('leaves composing keys other than Enter and Escape alone', () => {
    input.dispatchEvent(
      nativeKeyDown({ key: 'ArrowDown', code: 'ArrowDown', keyCode: 229, isComposing: true })
    );
    input.dispatchEvent(
      nativeKeyDown({ key: ' ', code: 'Space', keyCode: 229, isComposing: true })
    );
    input.dispatchEvent(
      nativeKeyDown({ key: 'Tab', code: 'Tab', keyCode: 229, isComposing: true })
    );
    expect(received).toEqual(['ArrowDown/ArrowDown/229', ' /Space/229', 'Tab/Tab/229']);
  });

  it('keeps the composing Escape from window bubble-phase listeners', () => {
    const seen: number[] = [];
    const onWindowKeyDown = (event: globalThis.KeyboardEvent) => seen.push(event.keyCode);
    window.addEventListener('keydown', onWindowKeyDown);
    input.dispatchEvent(
      nativeKeyDown({ key: 'Escape', code: 'Escape', keyCode: 229, isComposing: true })
    );
    input.dispatchEvent(nativeKeyDown({ key: 'Escape', code: 'Escape', keyCode: 27 }));
    window.removeEventListener('keydown', onWindowKeyDown);
    expect(seen).toEqual([27]);
  });

  it('leaves other window capture listeners to see the composing Enter', () => {
    const seen: number[] = [];
    const onWindowCapture = (event: globalThis.KeyboardEvent) => seen.push(event.keyCode);
    window.addEventListener('keydown', onWindowCapture, { capture: true });
    input.dispatchEvent(
      nativeKeyDown({ key: 'Enter', code: 'Enter', keyCode: 229, isComposing: true })
    );
    window.removeEventListener('keydown', onWindowCapture, { capture: true });
    expect(seen).toEqual([229]);
    expect(received).toEqual([]);
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

  describe('inside a Monaco editor', () => {
    let editor: HTMLDivElement;
    let textarea: HTMLTextAreaElement;

    beforeEach(() => {
      editor = document.createElement('div');
      editor.className = 'monaco-editor';
      textarea = document.createElement('textarea');
      editor.appendChild(textarea);
      document.body.appendChild(editor);
    });

    afterEach(() => editor.remove());

    it('lets keyCode 229 keydowns through for Monaco to handle, composing or not', () => {
      textarea.dispatchEvent(
        nativeKeyDown({ key: 'Enter', code: 'Enter', keyCode: 229, isComposing: true })
      );
      textarea.dispatchEvent(nativeKeyDown({ key: 'Enter', code: 'Enter', keyCode: 229 }));
      expect(received).toEqual(['Enter/Enter/229', 'Enter/Enter/229']);
    });

    it('finds a Monaco editor inside a shadow root from the composed path', () => {
      const host = document.body.appendChild(document.createElement('div'));
      const shadowEditor = host.attachShadow({ mode: 'open' }).appendChild(editor.cloneNode(true));
      shadowEditor.firstChild!.dispatchEvent(
        nativeKeyDown({
          key: 'Enter',
          code: 'Enter',
          keyCode: 229,
          isComposing: true,
          composed: true,
        })
      );
      host.remove();
      expect(received).toEqual(['Enter/Enter/229']);
    });

    it('stops composing keydowns that Monaco does not stop itself', () => {
      textarea.dispatchEvent(
        nativeKeyDown({ key: 'Enter', code: 'Enter', keyCode: 13, isComposing: true })
      );
      expect(received).toEqual([]);
    });
  });

  it('keeps the composing Enter from React handlers in both phases', () => {
    const seen: string[] = [];
    const { container, unmount } = render(
      React.createElement(
        'div',
        { onKeyDownCapture: (e: KeyboardEvent) => seen.push(`capture:${e.keyCode}`) },
        React.createElement('input', {
          onKeyDown: (e: KeyboardEvent) => seen.push(`bubble:${e.keyCode}`),
        })
      )
    );
    const field = container.querySelector('input')!;
    fireEvent.keyDown(field, { key: 'Enter', code: 'Enter', keyCode: 229, isComposing: true });
    fireEvent.keyDown(field, { key: 'Enter', code: 'Enter', keyCode: 13 });
    unmount();
    expect(seen).toEqual(['capture:13', 'bubble:13']);
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
