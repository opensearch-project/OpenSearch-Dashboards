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

import {
  CHUNK_ERROR_ROOT_ID,
  ChunkErrorDetail,
  installChunkErrorSurface,
  isChunkLoadFailure,
  renderChunkErrorSurface,
} from './chunk_error_surface';

/**
 * A fake event target that captures the listeners `installChunkErrorSurface`
 * registers, so a test can dispatch synthetic events without depending on jsdom
 * being able to construct a `PromiseRejectionEvent` / resource `error` event.
 */
function makeTarget() {
  const listeners: Record<string, EventListener> = {};
  return {
    listeners,
    addEventListener: jest.fn((type: string, fn: EventListener) => {
      listeners[type] = fn;
    }),
    removeEventListener: jest.fn(),
  };
}

afterEach(() => {
  // Remove any banner a test rendered into the real jsdom document.
  const node = document.getElementById(CHUNK_ERROR_ROOT_ID);
  if (node && node.parentNode) {
    node.parentNode.removeChild(node);
  }
});

describe('isChunkLoadFailure', () => {
  it.each([
    'ChunkLoadError: Loading chunk 5 failed.',
    'Loading chunk vendors-node_modules failed',
    'Loading CSS chunk 12 failed',
    'Failed to fetch dynamically imported module: http://cdn/x.chunk.3.js',
    'Subresource Integrity check failed for http://cdn/x.chunk.3.js',
  ])('detects a chunk/integrity failure: %s', (message) => {
    expect(isChunkLoadFailure(new Error(message))).toBe(true);
    expect(isChunkLoadFailure(message)).toBe(true);
  });

  it.each([
    'TypeError: cannot read properties of undefined',
    'Network request failed',
    'UISettings was not set',
    '',
  ])('ignores an unrelated failure: %s', (message) => {
    expect(isChunkLoadFailure(new Error(message))).toBe(false);
    expect(isChunkLoadFailure(message)).toBe(false);
  });

  it('is safe on null / non-error values', () => {
    expect(isChunkLoadFailure(null)).toBe(false);
    expect(isChunkLoadFailure(undefined)).toBe(false);
    expect(isChunkLoadFailure(42)).toBe(false);
    expect(isChunkLoadFailure({})).toBe(false);
  });
});

describe('renderChunkErrorSurface', () => {
  it('renders a non-blocking dismissible banner (does not blank the body)', () => {
    const before = document.createElement('div');
    before.id = 'app-root';
    before.textContent = 'the running app';
    document.body.appendChild(before);

    renderChunkErrorSurface(
      { url: 'http://cdn/x.chunk.3.js', reason: 'integrity mismatch', source: 'script-error' },
      document
    );

    const root = document.getElementById(CHUNK_ERROR_ROOT_ID);
    expect(root).not.toBeNull();
    expect(root!.getAttribute('role')).toBe('alert');
    // The already-mounted app is STILL present — the surface overlays, not replaces.
    expect(document.getElementById('app-root')).not.toBeNull();
    // The failing URL + reason are surfaced in the details list.
    const details = root!.querySelector(`[data-test-subj="${CHUNK_ERROR_ROOT_ID}_details"]`);
    expect(details!.textContent).toContain('http://cdn/x.chunk.3.js');
    expect(details!.textContent).toContain('integrity mismatch');

    document.body.removeChild(before);
  });

  it('is idempotent: repeated failures reuse ONE banner and append details', () => {
    const detail = (n: number): ChunkErrorDetail => ({
      url: `http://cdn/x.chunk.${n}.js`,
      reason: 'integrity mismatch',
      source: 'unhandledrejection',
    });
    renderChunkErrorSurface(detail(1), document);
    renderChunkErrorSurface(detail(2), document);

    expect(document.querySelectorAll(`#${CHUNK_ERROR_ROOT_ID}`).length).toBe(1);
    const details = document.querySelector(`[data-test-subj="${CHUNK_ERROR_ROOT_ID}_details"]`);
    expect(details!.childElementCount).toBe(2);
  });

  it('dismiss button removes the banner', () => {
    renderChunkErrorSurface({ reason: 'integrity mismatch', source: 'script-error' }, document);
    const dismiss = document.querySelector<HTMLButtonElement>(
      `[data-test-subj="${CHUNK_ERROR_ROOT_ID}_dismiss"]`
    );
    expect(dismiss).not.toBeNull();
    dismiss!.click();
    expect(document.getElementById(CHUNK_ERROR_ROOT_ID)).toBeNull();
  });
});

describe('installChunkErrorSurface', () => {
  it('renders + emits telemetry for a chunk-failure unhandledrejection', () => {
    const target = makeTarget();
    const render = jest.fn();
    const emitTelemetry = jest.fn();

    installChunkErrorSurface({ target, render, emitTelemetry });

    expect(target.addEventListener).toHaveBeenCalledWith(
      'unhandledrejection',
      expect.any(Function)
    );
    target.listeners.unhandledrejection(({
      reason: new Error('ChunkLoadError: Loading chunk 7 failed'),
    } as unknown) as Event);

    expect(emitTelemetry).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenCalledTimes(1);
    expect(render.mock.calls[0][0]).toMatchObject({ source: 'unhandledrejection' });
  });

  it('IGNORES an unrelated unhandledrejection (no false surface)', () => {
    const target = makeTarget();
    const render = jest.fn();
    const emitTelemetry = jest.fn();

    installChunkErrorSurface({ target, render, emitTelemetry });
    target.listeners.unhandledrejection(({
      reason: new Error('TypeError: something unrelated'),
    } as unknown) as Event);

    expect(render).not.toHaveBeenCalled();
    expect(emitTelemetry).not.toHaveBeenCalled();
  });

  it('surfaces a failed chunk <script> resource error (capture phase)', () => {
    const target = makeTarget();
    const render = jest.fn();
    const emitTelemetry = jest.fn();

    installChunkErrorSurface({ target, render, emitTelemetry });
    expect(target.addEventListener).toHaveBeenCalledWith('error', expect.any(Function), true);

    const script = document.createElement('script');
    script.src = 'http://cdn/inspector.chunk.5.js';
    target.listeners.error(({ target: script } as unknown) as Event);

    expect(render).toHaveBeenCalledTimes(1);
    expect(render.mock.calls[0][0]).toMatchObject({
      source: 'script-error',
      url: 'http://cdn/inspector.chunk.5.js',
    });
  });

  it('IGNORES an error from a non-chunk script element', () => {
    const target = makeTarget();
    const render = jest.fn();

    installChunkErrorSurface({ target, render, emitTelemetry: jest.fn() });
    const script = document.createElement('script');
    script.src = 'http://origin/some-unrelated-bundle.js';
    target.listeners.error(({ target: script } as unknown) as Event);

    expect(render).not.toHaveBeenCalled();
  });

  it('uninstall detaches both listeners', () => {
    const target = makeTarget();
    const uninstall = installChunkErrorSurface({
      target,
      render: jest.fn(),
      emitTelemetry: jest.fn(),
    });
    uninstall();
    expect(target.removeEventListener).toHaveBeenCalledWith(
      'unhandledrejection',
      expect.any(Function)
    );
    expect(target.removeEventListener).toHaveBeenCalledWith('error', expect.any(Function), true);
  });

  it('is a safe no-op when there is no event target', () => {
    const uninstall = installChunkErrorSurface({
      target: (undefined as unknown) as Window,
      render: jest.fn(),
      emitTelemetry: jest.fn(),
    });
    expect(typeof uninstall).toBe('function');
    expect(() => uninstall()).not.toThrow();
  });

  it('a render failure never escapes the global handler (telemetry still recorded)', () => {
    const target = makeTarget();
    const emitTelemetry = jest.fn();
    const render = jest.fn(() => {
      throw new Error('render blew up');
    });

    installChunkErrorSurface({ target, render, emitTelemetry });
    expect(() =>
      target.listeners.unhandledrejection(({
        reason: new Error('ChunkLoadError: Loading chunk 1 failed'),
      } as unknown) as Event)
    ).not.toThrow();
    expect(emitTelemetry).toHaveBeenCalledTimes(1);
  });
});
