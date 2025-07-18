/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '@osd/monaco';
import { i18n } from '@osd/i18n';
type IActionDescriptor = monaco.editor.IActionDescriptor;

export const getShiftEnterAction = (): IActionDescriptor => ({
  id: 'insert-new-line',
  label: i18n.translate('explore.queryPanel.reusableEditor.insertNewLine', {
    defaultMessage: 'Insert New Line',
  }),
  // eslint-disable-next-line no-bitwise
  keybindings: [monaco.KeyMod.Shift | monaco.KeyCode.Enter],
  run: (editor) => {
    if (editor.hasTextFocus()) {
      const currentPosition = editor.getPosition();
      if (currentPosition) {
        editor.executeEdits('', [
          {
            range: new monaco.Range(
              currentPosition.lineNumber,
              currentPosition.column,
              currentPosition.lineNumber,
              currentPosition.column
            ),
            text: '\n',
            forceMoveMarkers: true,
          },
        ]);
        editor.setPosition({
          lineNumber: currentPosition.lineNumber + 1,
          column: 1,
        });
      }
    }
  },
});
