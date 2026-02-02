/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '@osd/monaco';
import { i18n } from '@osd/i18n';
import { MutableRefObject } from 'react';
type IActionDescriptor = monaco.editor.IActionDescriptor;

export const getEscapeAction = (
  isPromptModeRef: MutableRefObject<boolean>,
  handleEscape: () => void
): IActionDescriptor => ({
  id: 'escape-action',
  label: i18n.translate('explore.queryPanel.escaperAction', {
    defaultMessage: 'Escape Action',
  }),
  keybindings: [monaco.KeyCode.Escape],
  run: (editor) => {
    // Only execute the action if in Prompt mode
    if (isPromptModeRef.current) {
      handleEscape();
      return;
    }

    // Let the default escape behavior occur
    editor.trigger('editor', 'hideSuggestWidget', []);
  },
});
