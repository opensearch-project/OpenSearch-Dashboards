/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  hasInvestigationCapabilities,
  isChatEnabled,
  ChatConfig,
  ContextProviderConfig,
} from './chat_capabilities';

describe('Chat Capabilities', () => {
  describe('hasInvestigationCapabilities', () => {
    it('returns false in open source environment (no investigation capabilities)', () => {
      expect(hasInvestigationCapabilities(undefined)).toBe(false);
      expect(hasInvestigationCapabilities({})).toBe(false);
    });

    it('returns false in production environment when features are disabled', () => {
      const capabilities = {
        investigation: { agenticFeaturesEnabled: false },
      };
      expect(hasInvestigationCapabilities(capabilities)).toBe(false);
    });

    it('returns true in production environment when features are enabled', () => {
      const capabilities = {
        investigation: { agenticFeaturesEnabled: true },
      };
      expect(hasInvestigationCapabilities(capabilities)).toBe(true);
    });
  });

  describe('isChatEnabled', () => {
    const contextProviderEnabled: ContextProviderConfig = { enabled: true };
    const contextProviderDisabled: ContextProviderConfig = { enabled: false };

    describe('when chat plugin is disabled', () => {
      const config: ChatConfig = { enabled: false };

      it('returns false regardless of other settings', () => {
        expect(isChatEnabled(config, contextProviderEnabled, undefined)).toBe(false);
        expect(
          isChatEnabled(config, contextProviderEnabled, {
            investigation: { agenticFeaturesEnabled: true },
          })
        ).toBe(false);
      });
    });

    describe('when context provider is disabled', () => {
      const config: ChatConfig = { enabled: true, agUiUrl: 'http://example.com' };

      it('returns false regardless of other settings', () => {
        expect(isChatEnabled(config, contextProviderDisabled, undefined)).toBe(false);
        expect(
          isChatEnabled(config, contextProviderDisabled, {
            investigation: { agenticFeaturesEnabled: true },
          })
        ).toBe(false);
      });
    });

    describe('when both chat and context provider are enabled', () => {
      describe('open source environment (agUiUrl configured)', () => {
        const config: ChatConfig = { enabled: true, agUiUrl: 'http://example.com' };

        it('returns true regardless of capabilities', () => {
          expect(isChatEnabled(config, contextProviderEnabled, undefined)).toBe(true);
          expect(isChatEnabled(config, contextProviderEnabled, {})).toBe(true);
          expect(
            isChatEnabled(config, contextProviderEnabled, {
              investigation: { agenticFeaturesEnabled: false },
            })
          ).toBe(true);
          expect(
            isChatEnabled(config, contextProviderEnabled, {
              investigation: { agenticFeaturesEnabled: true },
            })
          ).toBe(true);
        });
      });

      describe('production environment (no agUiUrl)', () => {
        const config: ChatConfig = { enabled: true };

        it('returns false when investigation capabilities are disabled', () => {
          const capabilities = { investigation: { agenticFeaturesEnabled: false } };
          expect(isChatEnabled(config, contextProviderEnabled, capabilities)).toBe(false);
        });

        it('returns false when investigation capabilities are undefined', () => {
          expect(isChatEnabled(config, contextProviderEnabled, undefined)).toBe(false);
          expect(isChatEnabled(config, contextProviderEnabled, {})).toBe(false);
          expect(isChatEnabled(config, contextProviderEnabled, { investigation: {} })).toBe(false);
        });

        it('returns true when investigation capabilities are enabled', () => {
          const capabilities = { investigation: { agenticFeaturesEnabled: true } };
          expect(isChatEnabled(config, contextProviderEnabled, capabilities)).toBe(true);
        });
      });
    });
  });
});
