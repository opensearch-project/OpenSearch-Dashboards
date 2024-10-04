/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

describe('@osd/ui-shared-deps/theme', () => {
  it('should return variables for each theme', async () => {
    const oldTag = global.__osdThemeTag__;
    for (const v of ['v7', 'v8', 'v9']) {
      global.__osdThemeTag__ = `${v}light`;
      const { euiThemeVars } = await import('./theme');
      expect(euiThemeVars).toBeTruthy();
      jest.resetModules();
    }
    global.__osdThemeTag__ = oldTag;
  });
});
