/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/**
 * Phase 12, Story 2 — Subresource Integrity (SRI) on the injected remoteEntry
 * <script>. These tests assert the DOM contract of {@link loadScript} /
 * {@link loadRemoteContainer}: when an `integrity` hash is supplied the element
 * carries `integrity` + `crossorigin="anonymous"` (so the browser integrity-checks
 * the script and rejects tampered bytes); when it is absent neither attribute is
 * set (a dev override keeps its prior, no-CORS-required behavior). jsdom never
 * actually fetches the script, so we drive the element's `onload`/`onerror`
 * handlers directly to resolve/reject the load.
 */

import { loadScript, loadRemoteContainer } from './load_remote';
import { mfeWindow, MfeContainer } from './types';

/**
 * Capture the next <script> element appended to `document.head` so the test can
 * inspect its attributes and fire its load/error handlers. Returns a restore fn.
 */
function captureAppendedScript(): {
  scripts: HTMLScriptElement[];
  restore: () => void;
} {
  const scripts: HTMLScriptElement[] = [];
  const original = document.head.appendChild.bind(document.head);
  const spy = jest.spyOn(document.head, 'appendChild').mockImplementation((node: Node) => {
    scripts.push(node as HTMLScriptElement);
    // Do NOT actually attach (jsdom would try to fetch); just record it.
    return node;
  });
  return { scripts, restore: () => spy.mockRestore() };
  // `original` intentionally unused — we never attach the node in tests.
  void original;
}

describe('loadScript — Subresource Integrity (Phase 12, Story 2)', () => {
  it('sets integrity + crossorigin="anonymous" when an integrity hash is supplied', async () => {
    const { scripts, restore } = captureAppendedScript();
    try {
      const promise = loadScript('https://cdn.example/mfe/x/remoteEntry.js', 'sha384-AAA');
      expect(scripts).toHaveLength(1);
      const el = scripts[0];
      expect(el.src).toBe('https://cdn.example/mfe/x/remoteEntry.js');
      expect(el.integrity).toBe('sha384-AAA');
      expect(el.crossOrigin).toBe('anonymous');
      expect(el.async).toBe(false);

      // Resolve the load.
      el.onload!(new Event('load'));
      await expect(promise).resolves.toBeUndefined();
    } finally {
      restore();
    }
  });

  it('sets NEITHER integrity NOR crossorigin when no hash is supplied', async () => {
    const { scripts, restore } = captureAppendedScript();
    try {
      const promise = loadScript('https://cdn.example/shared-deps/osd.js');
      const el = scripts[0];
      expect(el.integrity).toBeFalsy();
      // jsdom reflects an unset crossOrigin as a falsy empty string.
      expect(el.crossOrigin).toBeFalsy();

      el.onload!(new Event('load'));
      await expect(promise).resolves.toBeUndefined();
    } finally {
      restore();
    }
  });

  it('REJECTS with an SRI-aware message when an integrity-checked load errors', async () => {
    const { scripts, restore } = captureAppendedScript();
    try {
      const promise = loadScript('https://cdn.example/mfe/x/remoteEntry.js', 'sha384-AAA');
      const el = scripts[0];
      // Simulate the browser refusing to execute tampered bytes (SRI mismatch
      // fires `error`, not `load`).
      el.onerror!(new Event('error'));
      await expect(promise).rejects.toThrow(/Subresource Integrity check failed/);
    } finally {
      restore();
    }
  });

  it('REJECTS with the plain message when a non-integrity load errors', async () => {
    const { scripts, restore } = captureAppendedScript();
    try {
      const promise = loadScript('https://cdn.example/shared-deps/osd.js');
      const el = scripts[0];
      el.onerror!(new Event('error'));
      await expect(promise).rejects.toThrow(/Failed to load script/);
    } finally {
      restore();
    }
  });
});

describe('loadRemoteContainer — integrity passthrough (Phase 12, Story 2)', () => {
  afterEach(() => {
    delete (mfeWindow() as Record<string, unknown>).widget;
  });

  it('forwards the integrity hash onto the injected remoteEntry <script>', async () => {
    const { scripts, restore } = captureAppendedScript();
    try {
      const fakeContainer: MfeContainer = {
        init: () => undefined,
        get: () => Promise.resolve(() => ({ plugin: () => undefined })),
      };
      const promise = loadRemoteContainer(
        'https://cdn.example/mfe/widget/remoteEntry.js',
        'widget',
        'sha384-BBB'
      );
      const el = scripts[0];
      expect(el.integrity).toBe('sha384-BBB');
      expect(el.crossOrigin).toBe('anonymous');

      // The remoteEntry "executes" by registering its container global.
      (mfeWindow() as Record<string, unknown>).widget = fakeContainer;
      el.onload!(new Event('load'));
      await expect(promise).resolves.toBe(fakeContainer);
    } finally {
      restore();
    }
  });

  it('omits integrity/crossorigin when none is supplied (e.g. a dev override)', async () => {
    const { scripts, restore } = captureAppendedScript();
    try {
      const fakeContainer: MfeContainer = {
        init: () => undefined,
        get: () => Promise.resolve(() => ({ plugin: () => undefined })),
      };
      const promise = loadRemoteContainer(
        'http://localhost:5601/mfe/widget/remoteEntry.js',
        'widget'
      );
      const el = scripts[0];
      expect(el.integrity).toBeFalsy();
      expect(el.crossOrigin).toBeFalsy();

      (mfeWindow() as Record<string, unknown>).widget = fakeContainer;
      el.onload!(new Event('load'));
      await expect(promise).resolves.toBe(fakeContainer);
    } finally {
      restore();
    }
  });
});
