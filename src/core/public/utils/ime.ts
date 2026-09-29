/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { KeyboardEvent } from 'react';

/**
 * Whether a keydown arrives while an IME composition (Korean, Japanese, Chinese, ...) is still
 * active. Handlers that act on Enter should ignore these: the text is not final yet. Chrome with
 * the Korean IME follows up with a second, non-composing Enter keydown once the composition is
 * committed; IMEs without that follow-up just commit on this Enter. React's synthetic event does
 * not expose `isComposing`, so read the native event.
 *
 * Do not also check `keyCode === 229`. Browsers that end the composition before the keydown
 * (Safari) deliver that Enter with the final text and `isComposing === false`; older WebKit set
 * `keyCode` to 229 on it, and ignoring it would swallow the only Enter.
 */
export const isImeComposing = (event: KeyboardEvent): boolean =>
  Boolean(event.nativeEvent?.isComposing);
