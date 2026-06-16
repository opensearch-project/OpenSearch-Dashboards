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
 * Lazy-CHUNK Subresource-Integrity failure surface (Phase 12, Story 3).
 *
 * THE THREAT-MODEL LAYER, AND WHY IT IS DIFFERENT FROM STORY 2.
 *
 *  - Story 2 secures the BOOT-TIME gate: the host bootstrap injects each remote's
 *    `remoteEntry.js` <script> with `integrity` (from the registry) + `crossorigin`,
 *    so a tampered remoteEntry is rejected BEFORE the app boots and is routed
 *    fail-closed through the Phase 9 env policy (dev block / prod skip). At that
 *    point nothing has mounted, so replacing the page (block) or disabling the
 *    plugin (skip) is the right surface.
 *
 *  - Story 3 secures the LAZY CHUNKS a remote loads ITSELF, on demand, AFTER it is
 *    already mounted (the external-plugin spike showed real remotes ship them —
 *    e.g. Monaco editors, doc views). The rspack `SubresourceIntegrityPlugin` +
 *    `output.crossOriginLoading: 'anonymous'` (see mfe_rspack_config.ts) make the
 *    Module Federation runtime set `integrity` on each chunk <script> it injects,
 *    so the browser REFUSES to execute a tampered chunk. But that refusal happens
 *    at the dynamic `import()` site inside running plugin code — it is a RUNTIME
 *    event, NOT a boot-time decision. We cannot wrap the remote's own `import()`
 *    calls (their code; and we must not touch the optimizer / plugin_reader), and
 *    blanking the page would destroy an already-working app. So the correct surface
 *    is a NON-BLOCKING, visible runtime error + telemetry — never a white screen or
 *    a silent hang.
 *
 * HOW THE FAILURE REACHES US. When a chunk <script> fails its integrity check the
 * browser fires an `error` event on that element, and the MF/webpack runtime turns
 * the load failure into a rejected promise ("Loading chunk … failed" / a
 * ChunkLoadError) that propagates out of the plugin's `import()`. If the plugin
 * does not catch it, it becomes a window `unhandledrejection`. We listen for BOTH
 * (the resource `error` event in the capture phase — resource errors do not bubble
 * — and `unhandledrejection`) as a host-side safety net at the import() boundary,
 * filter to genuine chunk-load/integrity failures, render a dismissible banner, and
 * emit structured telemetry. This is defense-in-depth: the boot gate (Story 2) is
 * the primary control; this makes a post-boot violation loud and diagnosable.
 *
 * Rendering is intentionally PLAIN DOM (no React / EUI): a chunk-integrity failure
 * may itself involve the shared singletons, and the surface must work regardless of
 * app state. The `doc` / `emitTelemetry` collaborators are injectable for tests.
 */

/** The `id` / `data-test-subj` of the chunk-error banner root (stable for tests). */
export const CHUNK_ERROR_ROOT_ID = 'osd_mfe_chunk_error';

/** Structured description of a single chunk-load/integrity failure. */
export interface ChunkErrorDetail {
  /** The chunk URL that failed, when it can be determined. */
  url?: string;
  /** A human-readable reason (the underlying error message). */
  reason: string;
  /** How the failure reached us: a resource `error` event or an `unhandledrejection`. */
  source: 'script-error' | 'unhandledrejection';
}

/**
 * Patterns that identify a dynamic-import / chunk-load failure (including an SRI
 * rejection). Kept deliberately TARGETED so the global handlers do not swallow
 * unrelated promise rejections — only genuine chunk/integrity failures surface.
 */
const CHUNK_FAILURE_PATTERNS: RegExp[] = [
  /loading chunk\s+\S+\s+failed/i,
  /chunkloaderror/i,
  /loading css chunk/i,
  /failed to fetch dynamically imported module/i,
  /subresource integrity/i,
  // The host loadScript() message (load_remote.ts) when an integrity-bearing load
  // fails — defensive, in case a chunk is ever loaded through it.
  /integrity check failed/i,
];

/** Coerce an unknown rejection/error value to a message string for matching. */
function messageOf(reason: unknown): string {
  if (reason == null) {
    return '';
  }
  if (typeof reason === 'string') {
    return reason;
  }
  if (reason instanceof Error) {
    return `${reason.name}: ${reason.message}`;
  }
  const maybe = reason as { message?: unknown; name?: unknown };
  if (typeof maybe.message === 'string') {
    return typeof maybe.name === 'string' ? `${maybe.name}: ${maybe.message}` : maybe.message;
  }
  try {
    return String(reason);
  } catch {
    return '';
  }
}

/**
 * Whether an arbitrary rejection/error value represents a lazy-chunk load failure
 * (a tampered/MITM'd chunk rejected by SRI, or an unreachable chunk). Exported so
 * the failure routing is unit-testable independently of the DOM handlers.
 */
export function isChunkLoadFailure(reason: unknown): boolean {
  const message = messageOf(reason);
  if (!message) {
    return false;
  }
  return CHUNK_FAILURE_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * Render (or update) the dismissible chunk-error banner. NON-BLOCKING: it overlays
 * the running app rather than replacing it, so the rest of the (already-booted) UI
 * keeps working. Idempotent — repeated failures update a single banner and bump a
 * count instead of stacking duplicates.
 *
 * @param detail the failure to surface
 * @param doc the document to render into (defaults to the global `document`)
 */
export function renderChunkErrorSurface(detail: ChunkErrorDetail, doc: Document = document): void {
  let root = doc.getElementById(CHUNK_ERROR_ROOT_ID);
  if (!root) {
    root = doc.createElement('div');
    root.id = CHUNK_ERROR_ROOT_ID;
    root.setAttribute('data-test-subj', CHUNK_ERROR_ROOT_ID);
    root.setAttribute('role', 'alert');
    // Fixed, bottom-anchored overlay so it is visible without blanking the app.
    root.style.cssText =
      'position:fixed;left:0;right:0;bottom:0;z-index:2147483647;' +
      'font-family:monospace;color:#fff;background:#BD271E;' +
      'padding:16px 20px;line-height:1.5;box-shadow:0 -2px 8px rgba(0,0,0,0.3);';

    const heading = doc.createElement('strong');
    heading.setAttribute('data-test-subj', `${CHUNK_ERROR_ROOT_ID}_heading`);
    heading.style.cssText = 'display:block;font-size:15px;margin:0 0 6px;';
    heading.textContent = 'A micro-frontend resource failed its integrity check and was not loaded';
    root.appendChild(heading);

    const intro = doc.createElement('div');
    intro.style.cssText = 'font-size:13px;margin:0 0 8px;';
    intro.textContent =
      'The browser refused to execute a dynamically-loaded chunk because its bytes did ' +
      'not match the expected Subresource Integrity hash (a possible compromised CDN / ' +
      'MITM), or the chunk could not be fetched. The affected feature is unavailable; the ' +
      'rest of the app keeps running. Reload after the issue is resolved.';
    root.appendChild(intro);

    const list = doc.createElement('ul');
    list.setAttribute('data-test-subj', `${CHUNK_ERROR_ROOT_ID}_details`);
    list.style.cssText = 'margin:0;padding-left:20px;font-size:12px;';
    root.appendChild(list);

    const dismiss = doc.createElement('button');
    dismiss.setAttribute('data-test-subj', `${CHUNK_ERROR_ROOT_ID}_dismiss`);
    dismiss.type = 'button';
    dismiss.textContent = 'Dismiss';
    dismiss.style.cssText =
      'margin-top:10px;padding:4px 12px;font-family:inherit;cursor:pointer;' +
      'background:#fff;color:#BD271E;border:0;border-radius:3px;';
    dismiss.onclick = () => {
      const node = doc.getElementById(CHUNK_ERROR_ROOT_ID);
      if (node && node.parentNode) {
        node.parentNode.removeChild(node);
      }
    };
    root.appendChild(dismiss);

    doc.body.appendChild(root);
  }

  // Append this failure's detail line (capped so a flood cannot grow unbounded).
  const list = root.querySelector(`[data-test-subj="${CHUNK_ERROR_ROOT_ID}_details"]`);
  if (list && list.childElementCount < 10) {
    const item = doc.createElement('li');
    item.textContent = detail.url ? `${detail.url} — ${detail.reason}` : detail.reason;
    list.appendChild(item);
  }
}

/** Collaborators of {@link installChunkErrorSurface}, injectable for testing. */
export interface ChunkErrorSurfaceDeps {
  /** The document to render the banner into (defaults to the global `document`). */
  doc: Document;
  /** The event target to attach global listeners to (defaults to `window`). */
  target: Pick<Window, 'addEventListener' | 'removeEventListener'>;
  /** Render the visible surface (defaults to {@link renderChunkErrorSurface}). */
  render: (detail: ChunkErrorDetail) => void;
  /**
   * Emit structured telemetry for a chunk failure (defaults to a `console.error`
   * with a stable `[mfe]` marker so it is greppable in logs / capturable by the
   * harness). A future phase can route this to a real telemetry sink.
   */
  emitTelemetry: (detail: ChunkErrorDetail) => void;
}

function defaultEmitTelemetry(detail: ChunkErrorDetail): void {
  // eslint-disable-next-line no-console
  console.error(
    `[mfe] chunk-integrity-failure: a lazy chunk failed to load (source=${detail.source})` +
      (detail.url ? ` url=${detail.url}` : '') +
      ` — ${detail.reason}. The browser refused to execute unverified bytes; surfacing a ` +
      `runtime error rather than hanging.`
  );
}

function resolveSurfaceDeps(overrides?: Partial<ChunkErrorSurfaceDeps>): ChunkErrorSurfaceDeps {
  const doc = overrides?.doc ?? (typeof document !== 'undefined' ? document : (undefined as never));
  const target =
    overrides?.target ?? (typeof window !== 'undefined' ? window : (undefined as never));
  return {
    doc,
    target,
    // The default render honors an injected `doc` (so callers need not also inject
    // `render` just to redirect rendering in a test).
    render: (detail) => renderChunkErrorSurface(detail, doc),
    emitTelemetry: defaultEmitTelemetry,
    ...overrides,
  };
}

/**
 * Install the host-side chunk-error surface: global `unhandledrejection` + capture-
 * phase `error` listeners that detect lazy-chunk / SRI failures at the import()
 * boundary, render the non-blocking banner, and emit telemetry.
 *
 * Safe to call when there is no DOM (returns a no-op uninstaller). Returns a
 * function that removes the listeners (used by tests; production installs once for
 * the page lifetime).
 *
 * @returns an uninstall function that detaches the listeners
 */
export function installChunkErrorSurface(overrides?: Partial<ChunkErrorSurfaceDeps>): () => void {
  const { target, render, emitTelemetry } = resolveSurfaceDeps(overrides);

  // No DOM (SSR / a stripped test env) — nothing to attach to.
  if (!target || typeof target.addEventListener !== 'function') {
    return () => undefined;
  }

  const handle = (detail: ChunkErrorDetail): void => {
    // Telemetry first (always recorded), then the visible surface (guard the render
    // so a surface failure can never mask the telemetry or throw out of a listener).
    emitTelemetry(detail);
    try {
      render(detail);
    } catch {
      // A rendering failure must not escape the global handler.
    }
  };

  const onRejection = (event: PromiseRejectionEvent): void => {
    const reason = event.reason;
    if (isChunkLoadFailure(reason)) {
      handle({ reason: messageOf(reason), source: 'unhandledrejection' });
    }
  };

  const onError = (event: Event): void => {
    // Resource-load errors (a failed/SRI-rejected <script>) surface here in the
    // capture phase with the failing element as the target — they do NOT bubble,
    // and they are not `ErrorEvent`s. Only treat a <script> whose URL looks like a
    // remote chunk as a chunk failure, so unrelated errors are ignored.
    const el = event.target as HTMLScriptElement | null;
    if (
      el &&
      typeof el.tagName === 'string' &&
      el.tagName.toLowerCase() === 'script' &&
      typeof el.src === 'string' &&
      (/\.chunk\./.test(el.src) || /\/mfe\//.test(el.src))
    ) {
      handle({
        url: el.src,
        reason:
          'the chunk <script> failed to load — the browser rejected it (Subresource ' +
          'Integrity mismatch) or it could not be fetched',
        source: 'script-error',
      });
    }
  };

  target.addEventListener('unhandledrejection', onRejection as EventListener);
  // Capture phase: resource `error` events do not bubble to the window otherwise.
  target.addEventListener('error', onError as EventListener, true);

  return () => {
    target.removeEventListener('unhandledrejection', onRejection as EventListener);
    target.removeEventListener('error', onError as EventListener, true);
  };
}
