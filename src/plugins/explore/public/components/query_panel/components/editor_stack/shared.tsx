/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export type LanguageType = 'nl' | 'kv' | 'ppl';

export const getEditorConfig = (languageType: LanguageType) => {
  switch (languageType) {
    case 'nl':
      return {
        languageId: 'natural-language',
        ariaLabel: 'Type your natural language query here',
        suggest: {
          showWords: true,
        },
      };
    case 'kv':
      return {
        languageId: 'ppl',
        ariaLabel: 'Type your key-value query here',
        suggest: {
          showWords: false,
        },
      };
    case 'ppl':
    default:
      return {
        languageId: 'ppl',
        ariaLabel: 'Type your PPL query here',
        suggest: {
          showWords: false,
        },
      };
  }
};
