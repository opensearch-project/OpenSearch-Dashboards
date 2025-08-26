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
    // Accept the selected suggestion without retriggering
    ed.trigger('keyboard', 'acceptSelectedSuggestion', {});
  },
});
