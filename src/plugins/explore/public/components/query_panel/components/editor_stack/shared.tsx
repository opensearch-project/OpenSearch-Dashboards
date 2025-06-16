/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { LanguageType } from './types';

// TODO: Integrate this config with createEditor like wrapper after P0.This will help tp scale with multiple lang registration by external plugins
export const getEditorConfig = (languageType: LanguageType) => {
  switch (languageType) {
    case LanguageType.PPL:
    case LanguageType.KeyValue:
      return {
        languageId: LanguageType.PPL,
        height: 100,
        options: {
          minimap: { enabled: false },
          automaticLayout: true,
          scrollBeyondLastLine: false,
          fontSize: 13,
          lineHeight: 20,
          fontFamily: 'var(--font-code)',
          lineNumbers: 'on' as const,
          folding: true,
          wordWrap: 'on' as const,
          wrappingIndent: 'same' as const,
          lineDecorationsWidth: 0,
          lineNumbersMinChars: 1,
          // scrollbar: { // TODO: Enable scrollbar with max height logic
          //   vertical: 'visible' as const,
          //   horizontalScrollbarSize: 1,
          // },
          // overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          cursorStyle: 'line',
          suggest: {
            snippetsPreventQuickSuggestions: false, // Ensure all suggestions are shown
            filterGraceful: false, // Don't filter suggestions
            showStatusBar: true, // Enable the built-in status bar with default text
            showWords: false, // Disable word-based suggestions
          },
          acceptSuggestionOnEnter: 'off' as const,
        },
        languageConfiguration: {
          autoClosingPairs: [
            { open: '(', close: ')' },
            { open: '[', close: ']' },
            { open: '{', close: '}' },
            { open: '"', close: '"' },
            { open: "'", close: "'" },
          ],
        },
        triggerSuggestOnFocus: false,
      };
    case LanguageType.Natural:
    default:
      return {
        languageId: 'plaintext',
        height: 32,
        options: {
          lineNumbers: 'off' as const, // Disable line numbers for NL
          wordWrap: 'on' as const, // Enable word wrapping for NL
          folding: false, // Disable folding
          fixedOverflowWidgets: true,
          lineHeight: 18,
          fontSize: 14,
          fontFamily: 'Roboto Mono',
          minimap: {
            enabled: false,
          },
          padding: {
            top: 7,
            bottom: 7,
          },
          automaticLayout: true,
          scrollBeyondLastLine: false,
          wrappingIndent: 'indent' as const, // No indent since wrapping is off
          glyphMargin: false,
          lineDecorationsWidth: 0,
          scrollbar: {
            vertical: 'hidden' as const,
            horizontalScrollbarSize: 1,
          },
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          cursorStyle: 'line-thin' as const,
          cursorBlinking: 'blink' as const,
          languageConfiguration: {},
          triggerSuggestOnFocus: false,
        },
      };
  }
};
