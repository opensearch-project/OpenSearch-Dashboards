/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '@osd/monaco';
import { i18n } from '@osd/i18n';
type IActionDescriptor = monaco.editor.IActionDescriptor;

export const getTabAction = (): IActionDescriptor => ({
  id: 'handle-tab-suggest',
  label: i18n.translate('explore.queryPanel.reusableEditor.tabSuggestion', {
    defaultMessage: 'Select the next suggestion',
  }),
  keybindings: [monaco.KeyCode.Tab],
  run: (ed) => {
    // First accept the selected suggestion
    ed.trigger('keyboard', 'acceptSelectedSuggestion', {});

    // Then retrigger suggestions after a short delay
    setTimeout(() => {
      ed.trigger('keyboard', 'editor.action.triggerSuggest', {});
    }, 100);
  },
});
