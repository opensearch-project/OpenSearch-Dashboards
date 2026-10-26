/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// Separate from core_system.test.ts: tests there call setup() without stop(), and each guard they
// leave on `window` would hide whether this instance installs and removes its own.
import { MockInjectedMetadataService, MockPluginsService } from './core_system.test.mocks';
import { CoreSystem } from './core_system';

jest.mock('@osd/monaco', () => ({
  setBuildHash: jest.fn(),
}));

const createCoreSystem = () =>
  new CoreSystem({
    rootDomElement: document.createElement('div'),
    // Only the fields setup() reads; the services themselves are mocked.
    injectedMetadata: {
      uiPlugins: [],
      csp: { warnLegacyBrowsers: true },
    } as unknown as ConstructorParameters<typeof CoreSystem>[0]['injectedMetadata'],
  });

describe('CoreSystem IME composition guard', () => {
  let input: HTMLInputElement;
  let received: number[];
  const onDocumentKeyDown = (event: KeyboardEvent) => received.push(event.keyCode);
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

  beforeEach(() => {
    MockPluginsService.getOpaqueIds.mockReturnValue(new Map());
    input = document.body.appendChild(document.createElement('input'));
    received = [];
    document.addEventListener('keydown', onDocumentKeyDown);
  });

  afterEach(() => {
    document.removeEventListener('keydown', onDocumentKeyDown);
    input.remove();
  });

  it('stops composing Enter keydowns from setup() until stop()', async () => {
    const coreSystem = createCoreSystem();

    pressComposingEnter();
    await coreSystem.setup();
    pressComposingEnter();
    coreSystem.stop();
    pressComposingEnter();

    expect(received).toEqual([229, 229]);
  });

  it('does not install the guard when setup fails before FatalErrorsService exists', async () => {
    MockInjectedMetadataService.setup.mockImplementationOnce(() => {
      throw new Error('injected metadata unavailable');
    });
    const consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

    await createCoreSystem().setup();
    pressComposingEnter();

    consoleLog.mockRestore();
    expect(received).toEqual([229]);
  });
});
