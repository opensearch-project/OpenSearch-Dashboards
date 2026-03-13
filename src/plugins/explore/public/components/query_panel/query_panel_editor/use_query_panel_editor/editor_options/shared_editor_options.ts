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
    horizontal: 'auto',
    horizontalScrollbarSize: 1,
  },
  overviewRulerLanes: 0,
  hideCursorInOverviewRuler: true,
  // Performance optimizations for large text
  automaticLayout: false, // Disable automatic layout to prevent unwanted expansion
  smoothScrolling: true, // Better scrolling experience with large content
  cursorBlinking: 'smooth', // Less jarring cursor animation
  // Enable efficient rendering for large files
  renderValidationDecorations: 'on',
  renderControlCharacters: false, // Improve performance by not rendering control chars
  renderWhitespace: 'none', // Improve performance by not rendering whitespace
};
