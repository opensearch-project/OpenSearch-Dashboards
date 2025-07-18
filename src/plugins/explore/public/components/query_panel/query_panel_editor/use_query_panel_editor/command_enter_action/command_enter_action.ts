/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '@osd/monaco';
import { i18n } from '@osd/i18n';
type IActionDescriptor = monaco.editor.IActionDescriptor;

export const getCommandEnterAction = (handleRun: () => void): IActionDescriptor => ({
  id: 'run-on-enter',
  label: i18n.translate('explore.queryPanel.reusableEditor.run', {
    defaultMessage: 'Run',
  }),
  // eslint-disable-next-line no-bitwise
  keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
  contextMenuGroupId: 'navigation',
  contextMenuOrder: 1.5,
  run: (editor) => {
    // Close autocomplete if open
    editor.trigger('keyboard', 'hideSuggestWidget', {});
    handleRun();
  },
});
