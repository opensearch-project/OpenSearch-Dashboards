/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { monaco } from '@osd/monaco';

export type IEditorConstructionOptions = monaco.editor.IEditorConstructionOptions;

export const sharedEditorOptions: IEditorConstructionOptions = {
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  lineHeight: 18,
  fontSize: 12,
  cursorStyle: 'line-thin',
  wordWrap: 'on',
  lineDecorationsWidth: 0,
  renderLineHighlight: 'none',
  scrollbar: {
    vertical: 'visible',
    horizontalScrollbarSize: 1,
  },
  overviewRulerLanes: 0,
  hideCursorInOverviewRuler: true,
  fixedOverflowWidgets: true,
  // Widen the marker-to-card travel window so a lint hover card stays reachable
  // on the mouse-MOVE path. The separate mouseleave path is handled by
  // attachPPLLintHoverPersistence, which these options do not affect.
  hover: {
    sticky: true,
    hidingDelay: 600,
  },
};
