/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { LanguageType } from './types';

// TODO: Integrate this config with createEditor like wrapper after P0.This will help tp scale with multiple lang registration by external plugins
export const getEditorConfig = (languageType: LanguageType) => {
  switch (languageType) {
    case LanguageType.PPL:
      return {
        languageId: LanguageType.PPL,
        height: 32,
        options: {},
        languageConfiguration: {
          autoClosingPairs: [
            { open: '(', close: ')' },
            { open: '[', close: ']' },
            { open: '{', close: '}' },
            { open: '"', close: '"' },
            { open: "'", close: "'" },
          ],
        },
        triggerSuggestOnFocus: true,
      };
    case LanguageType.Natural:
    default:
      return {
        languageId: 'plaintext',
        height: 32,
        options: {},
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
  }
};
