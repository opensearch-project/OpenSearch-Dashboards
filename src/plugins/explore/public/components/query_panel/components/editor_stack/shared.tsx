/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export type LanguageType = 'natural-language' | 'key-value' | 'ppl';

export const getEditorConfig = (languageType: LanguageType) => {
  switch (languageType) {
    case 'natural-language':
      return {
        languageId: 'natural-language',
        ariaLabel: 'Type your natural language query here',
        suggest: {
          showWords: true,
        },
      };
    case 'key-value':
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
