/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { monaco } from '@osd/monaco';

export type IEditorConstructionOptions = monaco.editor.IEditorConstructionOptions;

export const sharedEditorOptions: IEditorConstructionOptions = {
  minimap: { enabled: false },
  automaticLayout: true,
  scrollBeyondLastLine: false,
  lineHeight: 18,
  fontSize: 14,
  padding: {
    top: 7,
    bottom: 7,
  },
  wordWrap: 'on',
  lineDecorationsWidth: 0,
  scrollbar: {
    vertical: 'visible',
    horizontalScrollbarSize: 1,
  },
  overviewRulerLanes: 0,
  hideCursorInOverviewRuler: true,
};
