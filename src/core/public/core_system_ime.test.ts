/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// Separate from core_system.test.ts: tests there call setup() without stop(), and each guard they
// leave on `window` would hide whether this instance installs and removes its own.
import { MockPluginsService } from './core_system.test.mocks';
import { CoreSystem } from './core_system';

jest.mock('@osd/monaco', () => ({
  setBuildHash: jest.fn(),
}));

describe('CoreSystem IME composition guard', () => {
  it('stops composing Enter keydowns from setup() until stop()', async () => {
    MockPluginsService.getOpaqueIds.mockReturnValue(new Map());
    const coreSystem = new CoreSystem({
      rootDomElement: document.createElement('div'),
      // Only the fields setup() reads; the services themselves are mocked.
      injectedMetadata: {
        uiPlugins: [],
        csp: { warnLegacyBrowsers: true },
      } as unknown as ConstructorParameters<typeof CoreSystem>[0]['injectedMetadata'],
    });
    const input = document.body.appendChild(document.createElement('input'));
    const received: number[] = [];
    document.addEventListener('keydown', (event) => received.push(event.keyCode));
    const pressComposingEnter = () =>
      input.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          keyCode: 229,
          isComposing: true,
          bubbles: true,
        })
      );

    pressComposingEnter();
    await coreSystem.setup();
    pressComposingEnter();
    coreSystem.stop();
    pressComposingEnter();

    expect(received).toEqual([229, 229]);
  });
});
