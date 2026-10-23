/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { KeyboardEvent as ReactKeyboardEvent } from 'react';

/**
 * Whether a keydown belongs to an IME composition (Korean, Japanese, Chinese, ...). Keys pressed
 * then belong to the IME: Enter and Escape only commit or cancel the composed text.
 *
 * `keyCode === 229` covers Safari, which fires `compositionend` before the keydown that commits a
 * Chinese or Japanese composition, so that keydown arrives with `isComposing === false`. This is
 * the check MDN recommends. Chrome with the Korean IME follows a composing Enter with a second,
 * non-composing keydown (`keyCode` 13) once the syllable is committed; it passes, and handlers act
 * on it.
 *
 * React's synthetic event does not expose `isComposing`, so for React events read the native
 * event. Native `keydown` listeners (e.g. on `document`) can pass their event directly.
 */
export const isImeComposing = (event: ReactKeyboardEvent | KeyboardEvent): boolean => {
  const native = ('nativeEvent' in event ? event.nativeEvent : event) as KeyboardEvent | undefined;
  return Boolean(native?.isComposing) || native?.keyCode === 229;
};

/**
 * Monaco reads keyCode 229 keydowns on its own input to track the composition, then stops their
 * propagation itself. It does not stop composing keydowns with any other keyCode, so those are
 * guarded like everywhere else.
 */
const MONACO_SELECTOR = '.monaco-editor';

/**
 * Stops Enter and Escape keydowns that belong to an IME composition at `window` in the capture
 * phase, so document, React and element listeners never act on half-composed text. Other `window`
 * capture listeners still see them. It only calls `stopPropagation`: the IME still commits or
 * cancels the text. `code` is checked as well as `key` because composing keydowns report
 * `key: "Process"` in Firefox and in Chrome on Windows.
 *
 * Only keydown is guarded. Handlers that act on other keys while composing (arrows, Tab, Space),
 * or that listen in the capture phase above a Monaco editor, still need {@link isImeComposing}.
 *
 * @returns a function that removes the guard
 */
export const installImeCompositionGuard = (target: Window = window): (() => void) => {
  const onKeyDown = (event: KeyboardEvent) => {
    if (!isImeComposing(event)) return;
    const isEnterOrEscape = [event.key, event.code].some(
      (key) => key === 'Enter' || key === 'NumpadEnter' || key === 'Escape'
    );
    if (!isEnterOrEscape) return;
    const origin = event.composedPath()[0] ?? event.target;
    if (event.keyCode === 229 && origin instanceof Element && origin.closest(MONACO_SELECTOR))
      return;
    event.stopPropagation();
  };
  target.addEventListener('keydown', onKeyDown, { capture: true });
  return () => target.removeEventListener('keydown', onKeyDown, { capture: true });
};
