/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createOrGetExtensionContainer } from './utils';

describe('queryEditorExtensions utils', () => {
  describe('createOrGetExtensionContainer', () => {
    it('creates the element correctly', () => {
      const parentEl = document.createElement('div');
      const configId = 'config-id';
      const containerName = 'osdExtension';
      const result = createOrGetExtensionContainer({
        extensionConfigId: configId,
        containerName,
        parentContainer: parentEl,
      });
      expect(result.id).toBe(`${containerName}-${configId}`);
      expect(result.className).toContain(containerName);
      expect(result.className).toContain(`${containerName}__${configId}`);
      expect(parentEl.children.length).toBe(1);
      expect(parentEl.children[0]).toBe(result);
    });
  });
});
