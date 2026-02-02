/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getEffectiveLanguageForAutoComplete } from './utils';

describe('utils', () => {
  describe('getEffectiveLanguageForAutoComplete test matrix', () => {
    const languages = ['PPL', 'SQL', 'DQL', 'lucene', 'kuery'];
    const appIds = ['explore', 'discover', 'dashboard', 'visualize', ''];

    languages.forEach((language) => {
      appIds.forEach((appId) => {
        it(`should handle ${language} language with ${appId || 'empty'} appId`, () => {
          const result = getEffectiveLanguageForAutoComplete(language, appId);

          if (language === 'PPL' && appId === 'explore') {
            expect(result).toBe('PPL_Simplified');
          } else {
            expect(result).toBe(language);
          }
        });
      });
    });
  });
});
