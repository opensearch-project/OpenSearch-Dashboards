/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '@osd/monaco';
import { i18n } from '@osd/i18n';
type IActionDescriptor = monaco.editor.IActionDescriptor;

export const getEnterAction = (handleRun: () => void): IActionDescriptor => ({
  id: 'suggest-or-run-on-enter',
  label: i18n.translate('explore.queryPanel.reusableEditor.suggestOrEnter', {
    defaultMessage: 'Select the suggestion or run',
  }),
  keybindings: [monaco.KeyCode.Enter],
  run: (editor) => {
    // Check if suggestion widget is visible by checking for any suggestion context
    const contextKeyService = (editor as any)._contextKeyService;
    const suggestWidgetVisible = contextKeyService?.getContextKeyValue('suggestWidgetVisible');

    if (suggestWidgetVisible) {
      // Accept the selected suggestion without retriggering
      editor.trigger('keyboard', 'acceptSelectedSuggestion', {});
    } else {
      handleRun();
    }
  },
});
