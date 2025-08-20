/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IEditorConstructionOptions, sharedEditorOptions } from './shared_editor_options';

export const queryEditorOptions: IEditorConstructionOptions = {
  ...sharedEditorOptions,
  lineNumbers: 'on',
  folding: true,
  wrappingIndent: 'same',
  lineNumbersMinChars: 1,
  tabCompletion: 'on',
  renderValidationDecorations: 'on', // Explicitly enable validation decorations for markers
  suggest: {
    snippetsPreventQuickSuggestions: false, // Ensure all suggestions are shown
    filterGraceful: false, // Don't filter suggestions
    showStatusBar: true, // Enable the built-in status bar with default text
    showWords: false, // Disable word-based suggestions
  },
};
