/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { registerLanguageHandler, getLanguageHandler, LanguageHandler } from './language_handlers';

describe('Language handlers', () => {
  describe('getLanguageHandler', () => {
    it('returns default handler for unregistered language', () => {
      const handler = getLanguageHandler('UNKNOWN_LANGUAGE');
      expect(handler.getAdditionalAgentParameters).toBeDefined();
    });

    it('returns registered PROMQL handler', () => {
      const handler = getLanguageHandler('PROMQL');
      expect(handler.getAdditionalAgentParameters).toBeDefined();
    });
  });

  describe('registerLanguageHandler', () => {
    it('registers and retrieves a custom handler', () => {
      const customHandler: LanguageHandler = {
        getAdditionalAgentParameters: async () => ({ custom: 'param' }),
      };

      registerLanguageHandler('CUSTOM', customHandler);
      const retrieved = getLanguageHandler('CUSTOM');

      expect(retrieved).toBe(customHandler);
    });
  });

  describe('default handler', () => {
    it('returns empty object for additional parameters', async () => {
      const handler = getLanguageHandler('UNREGISTERED');
      const params = await handler.getAdditionalAgentParameters({} as any);
      expect(params).toEqual({});
    });
  });
});
