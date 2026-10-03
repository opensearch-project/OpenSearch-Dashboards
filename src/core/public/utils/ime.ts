/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { KeyboardEvent as ReactKeyboardEvent } from 'react';

/**
 * Whether a keydown arrives while an IME composition (Korean, Japanese, Chinese, ...) is still
 * active. Keys pressed then belong to the IME: Enter and Escape only commit or cancel the composed
 * text. Chrome with the Korean IME follows up with a second, non-composing keydown for the same key
 * once the composition is committed; handlers should act on that one. React's synthetic event does
 * not expose `isComposing`, so for React events read the native event. Native `keydown` listeners
 * (e.g. on `document`) can pass their event directly.
 *
 * Do not also check `keyCode === 229`. Browsers that end the composition before the keydown
 * (Safari) deliver that Enter with the final text and `isComposing === false`; older WebKit set
 * `keyCode` to 229 on it, and ignoring it would swallow the only Enter.
 */
export const isImeComposing = (event: ReactKeyboardEvent | KeyboardEvent): boolean => {
  const native = 'nativeEvent' in event ? event.nativeEvent : event;
  return Boolean((native as KeyboardEvent | undefined)?.isComposing);
};
