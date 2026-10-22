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
 * Monaco handles composition itself and stops keyCode 229 keydowns on its own input, and its
 * keybindings must keep seeing every keydown.
 */
const PASSTHROUGH_SELECTOR = '.monaco-editor';

/**
 * Stops Enter and Escape keydowns that belong to an IME composition before any other listener sees
 * them, so handlers never act on half-composed text. It only calls `stopPropagation`: the IME
 * still commits or cancels the text. `code` is checked as well as `key` because composing keydowns
 * report `key: "Process"` in Firefox and in Chrome on Windows.
 *
 * Handlers that act on other keys while composing (arrows, Tab, Space), or that listen in the
 * capture phase above an editor this guard lets through, still need {@link isImeComposing}.
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
    if (origin instanceof Element && origin.closest(PASSTHROUGH_SELECTOR)) return;
    event.stopPropagation();
  };
  target.addEventListener('keydown', onKeyDown, { capture: true });
  return () => target.removeEventListener('keydown', onKeyDown, { capture: true });
};
