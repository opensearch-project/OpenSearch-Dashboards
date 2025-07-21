/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '@osd/monaco';
import { i18n } from '@osd/i18n';
import { MutableRefObject } from 'react';
type IActionDescriptor = monaco.editor.IActionDescriptor;

export const getSpacebarAction = (
  isPromptModeRef: MutableRefObject<boolean>,
  textRef: MutableRefObject<string>,
  setToPromptMode: () => void
): IActionDescriptor => ({
  id: 'spacebar-action',
  label: i18n.translate('explore.queryPanel.spacebarAction', {
    defaultMessage: 'Spacebar Action',
  }),
  keybindings: [monaco.KeyCode.Space],
  run: (editor) => {
    // Only execute the action if in Query mode and no text in editor
    if (!isPromptModeRef.current && textRef.current.length === 0) {
      setToPromptMode();
      return;
    }

    // Otherwise, let the default spacebar behavior occur
    editor.trigger('keyboard', 'type', { text: ' ' });
  },
});
