/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IEditorConstructionOptions, sharedEditorOptions } from './shared';

export const queryEditorOptions: IEditorConstructionOptions = {
  ...sharedEditorOptions,
  fontFamily: 'var(--font-code)',
  lineNumbers: 'on',
  folding: true,
  wrappingIndent: 'same',
  lineNumbersMinChars: 1,
  cursorStyle: 'line',
  tabCompletion: 'on',
  suggest: {
    snippetsPreventQuickSuggestions: false, // Ensure all suggestions are shown
    filterGraceful: false, // Don't filter suggestions
    showStatusBar: true, // Enable the built-in status bar with default text
    showWords: false, // Disable word-based suggestions
  },
  acceptSuggestionOnEnter: 'off' as const,
};
