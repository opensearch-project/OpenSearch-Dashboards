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
 * Per-plugin LOAD TELEMETRY — the structured event shape emitted by the
 * browser bootstrap for every remote it attempts to load, plus the
 * FIRE-AND-FORGET sink that POSTs each event to the configured telemetry
 * endpoint.
 *
 * LOCKED architectural decisions (see `packages/osd-mfe/README.md` — DO NOT
 * relax):
 *
 * 1. Fire-and-forget. The bootstrap NEVER awaits this dispatcher; the
 *    dispatcher NEVER throws. A misconfigured / absent / unreachable endpoint
 *    is a SILENT no-op so a flaky telemetry sink can never block boot or be
 *    visible to the user. Telemetry observes failure, it never causes it.
 *
 * 2. Endpoint via `opensearchDashboards.mfe.telemetryEndpoint` (mfe-gated
 *    server config). Unset (the default) => the dispatcher returned by
 *    {@link createTelemetryDispatcher} is a no-op. Boot is byte-for-byte
 *    unchanged when telemetry is off.
 *
 * 3. Event shape (every field is a primitive — no Symbol / Date instances —
 *    so JSON.stringify is total and the payload is debuggable):
 *      { id, version, status: 'success' | 'failure' | 'skipped',
 *        durationMs: number, errorClass?: TelemetryErrorClass,
 *        bucket: number, customerId: string, timestamp: ISO-8601 string }
 *
 * 4. Transport priority: `navigator.sendBeacon()` when available (the right
 *    primitive for fire-and-forget telemetry: synchronous-API, queued for the
 *    browser to flush even if the tab navigates away — the browser does not
 *    surface failures to JS, which exactly matches the silent-no-op contract).
 *    Fallback to `fetch()` with `keepalive: true` and a `.catch(() => {})` so
 *    a rejected promise never leaks. Both branches are NEVER awaited by the
 *    bootstrap.
 *
 * The dispatcher is OBSERVATIONAL only: dimensions (`bucket`, `customerId`)
 * are bound at construction and stamped onto every event, so callers only
 * supply the per-event fields (`id`, `version`, `status`, `durationMs`,
 * `errorClass?`).
 */

/**
 * Outcome status for one remote load attempt. Mirrors the locked event-shape
 * enum and the three branches the bootstrap takes per remote: a successful
 * load, a failed load, or a load that was never attempted (e.g. a compat-skip
 * / a registry-trust skip).
 */
export type TelemetryStatus = 'success' | 'failure' | 'skipped';

/**
 * Cause taxonomy attached to a non-success event. Open-ended at the value
 * level (string-literal union — extensible by adding members), but every
 * caller MUST map a known cause to one of these so downstream dashboards can
 * partition cleanly. The five members cover every failure source the
 * bootstrap routes today:
 *
 *  - `sri-mismatch`: the browser refused to execute a remoteEntry whose bytes
 *    did not match the registry-pinned SRI hash (handled fail-closed in
 *    dev/block, prod/skip; either way the remote did not run).
 *  - `network`: a remote whose bytes could not be fetched at all
 *    (no integrity claim, just an unreachable script).
 *  - `compat-reject`: the host-version classifier said the remote is
 *    incompatible / unknown and the resolved compat policy decided to skip
 *    (or block; the page-block path emits an offender event per remote).
 *  - `mf-runtime-error`: a Module-Federation-level failure AFTER the script
 *    loaded — container.init / container.get / shared-scope wiring threw
 *    (a malformed remote, not a bytes-tampering issue).
 *  - `unknown`: the catch-all for any failure shape not matching the above
 *    patterns. Surfaces as-is so an operator can grep the logs and either
 *    add a more specific class or fix the underlying cause.
 */
export type TelemetryErrorClass =
  | 'sri-mismatch'
  | 'network'
  | 'compat-reject'
  | 'mf-runtime-error'
  | 'unknown';

/**
 * The locked event-shape. Every field is a primitive; `errorClass` is
 * optional and present ONLY on non-success events. `bucket` (0..99) and
 * `customerId` are stamped from the server-injected dimensions so events from
 * a single client are pre-partitioned for canary-vs-baseline split downstream.
 */
export interface MfeLoadTelemetryEvent {
  /** Plugin id (matches the registry key + the boot-manifest `id`). */
  id: string;
  /**
   * Resolved version label for the loaded artifact (the boot manifest's
   * `version` for the entry — usually `<core>+<contentHash>`). Stamped on
   * EVERY status (so a `skipped` event still says which version was rejected).
   */
  version: string;
  /** Outcome status; see {@link TelemetryStatus}. */
  status: TelemetryStatus;
  /**
   * Wall-clock duration in milliseconds attributable to this remote's load
   * attempt — measured around the per-remote load span (script load + share-
   * scope wiring + factory resolution) regardless of outcome. `0` for an
   * `skipped` event (no load attempted). Always finite, never negative.
   */
  durationMs: number;
  /**
   * Cause taxonomy when `status !== 'success'`. Absent (and serialized as
   * absent, not `null`) on success.
   */
  errorClass?: TelemetryErrorClass;
  /**
   * Stable canary-bucket assignment for the requesting client (0..99). Comes
   * from the server-side cookie hash (`bucketFromCookie`); the same
   * value the dual-path CI gate documents.
   */
  bucket: number;
  /**
   * Tenant identifier. Comes from `opensearchDashboards.mfe.customerId` in
   * server config (`'default'` until real AuthN). Stamped here so
   * downstream consumers can partition without joining to another stream.
   */
  customerId: string;
  /** ISO-8601 timestamp at emission time (e.g. `2025-12-13T07:30:00.000Z`). */
  timestamp: string;
}

/**
 * Construction-time dimensions + endpoint for a {@link TelemetryDispatcher}.
 * `endpoint` is OPTIONAL (unset = silent no-op); `bucket` and `customerId`
 * are required even when the endpoint is unset, because the same dimensions
 * may need to be stamped onto a future no-op upgrade and we want the
 * dispatcher's surface to be uniform.
 */
export interface TelemetryDispatcherConfig {
  /**
   * Telemetry sink URL, or `undefined` when no telemetry endpoint is
   * configured. When `undefined` (or the empty string) the dispatcher returned
   * by {@link createTelemetryDispatcher} is a SILENT no-op: emit() returns
   * immediately and no network request is made.
   */
  endpoint?: string;
  /** Stable canary-bucket assignment (0..99) — see {@link MfeLoadTelemetryEvent.bucket}. */
  bucket: number;
  /** Tenant identifier — see {@link MfeLoadTelemetryEvent.customerId}. */
  customerId: string;
}

/**
 * The minimum per-event input the bootstrap supplies. The dispatcher stamps
 * the dimensions (`bucket`, `customerId`) and the `timestamp` itself, so
 * callers only describe WHAT happened to which remote.
 */
export interface MfeLoadTelemetryInput {
  id: string;
  version: string;
  status: TelemetryStatus;
  durationMs: number;
  errorClass?: TelemetryErrorClass;
}

/**
 * Fire-and-forget telemetry dispatcher. `emit()` MUST be synchronous to the
 * caller (returns void, never a Promise) and MUST NOT throw, even if the sink
 * call rejects/throws internally. The bootstrap may call this from inside hot
 * paths and never awaits the result.
 */
export interface TelemetryDispatcher {
  emit(event: MfeLoadTelemetryInput): void;
}

/* ------------------------------------------------------------------------- *
 * Implementation
 * ------------------------------------------------------------------------- */

/**
 * Collaborators of {@link createTelemetryDispatcher}, injectable for testing.
 * In production the defaults read from the global `window.navigator` /
 * `window.fetch` / `Date`. Tests inject spies to assert fire-and-forget
 * semantics and silent-no-op paths without a real network.
 */
export interface CreateTelemetryDispatcherDeps {
  /**
   * Resolve the current `navigator.sendBeacon` if available, else `undefined`.
   * Returning `undefined` forces the dispatcher to fall through to `fetch()`,
   * which is the documented progressive-enhancement path.
   */
  getSendBeacon: () => ((url: string, data?: BodyInit | null) => boolean) | undefined;
  /** The fetch implementation to use as the fallback transport. */
  fetchImpl: typeof fetch;
  /** ISO-8601 timestamp source. */
  now: () => string;
}

/** The `Content-Type` used for the fetch fallback. Plain JSON, no charset. */
const TELEMETRY_CONTENT_TYPE = 'application/json';

/**
 * Whether the DOM-level transports are available. Returning `false` (e.g. a
 * jsdom test environment without `fetch` AND without `sendBeacon`) makes the
 * dispatcher a no-op even if an endpoint is configured: there is no way to
 * reach it, and we MUST NOT throw.
 */
function noTransportAvailable(deps: CreateTelemetryDispatcherDeps): boolean {
  return typeof deps.fetchImpl !== 'function' && typeof deps.getSendBeacon() !== 'function';
}

/**
 * Default deps: read from the live `window`. Kept inside a factory so calls
 * during module evaluation (some test runners) do not capture a stale
 * reference.
 */
function defaultDeps(): CreateTelemetryDispatcherDeps {
  return {
    getSendBeacon: () => {
      // sendBeacon must be invoked with `navigator` as receiver in some
      // browsers; bind so the dispatcher can call it as a free function.
      if (typeof navigator === 'undefined') return undefined;
      const fn = (navigator as Navigator & {
        sendBeacon?: (url: string, data?: BodyInit | null) => boolean;
      }).sendBeacon;
      return typeof fn === 'function' ? fn.bind(navigator) : undefined;
    },
    // Bind so the default `fetch` keeps its `window` receiver.
    fetchImpl: (typeof window !== 'undefined' && typeof window.fetch === 'function'
      ? (input: RequestInfo | URL, init?: RequestInit) => window.fetch(input, init)
      : ((() => Promise.reject(new Error('fetch unavailable'))) as unknown)) as typeof fetch,
    now: () => new Date().toISOString(),
  };
}

/**
 * Compose the locked-shape event from per-event input + dispatcher config +
 * the timestamp source. Pure & deterministic given its arguments — easy to
 * unit-test.
 */
function composeEvent(
  input: MfeLoadTelemetryInput,
  config: TelemetryDispatcherConfig,
  now: () => string
): MfeLoadTelemetryEvent {
  // Construct in a fixed key order so JSON output is stable and grep-friendly
  // when inspecting recorded payloads in `verify_phase14.js`.
  const event: MfeLoadTelemetryEvent = {
    id: input.id,
    version: input.version,
    status: input.status,
    durationMs: input.durationMs,
    bucket: config.bucket,
    customerId: config.customerId,
    timestamp: now(),
  };
  if (input.errorClass !== undefined) {
    event.errorClass = input.errorClass;
  }
  return event;
}

/**
 * Build a fire-and-forget dispatcher. When `endpoint` is unset/empty the
 * returned dispatcher is a SILENT no-op: every `emit()` returns immediately,
 * no network call is made, and (most importantly) no error is logged or
 * thrown — telemetry being off MUST be invisible to the rest of the app.
 *
 * Otherwise: each `emit()` composes the locked-shape event, serializes it
 * with `JSON.stringify`, and dispatches via `navigator.sendBeacon` when
 * available, or `fetch()` as a non-blocking fallback. The dispatcher SWALLOWS
 * all failures (a sendBeacon that returns `false`, a fetch that rejects, a
 * synchronous throw from a misbehaving polyfill); a flaky sink MUST NOT
 * surface to the user or block boot.
 */
export function createTelemetryDispatcher(
  config: TelemetryDispatcherConfig,
  overrides: Partial<CreateTelemetryDispatcherDeps> = {}
): TelemetryDispatcher {
  const deps: CreateTelemetryDispatcherDeps = { ...defaultDeps(), ...overrides };
  const endpoint = config.endpoint;

  // SILENT no-op when no endpoint is configured (the default in production
  // until an operator sets `opensearchDashboards.mfe.telemetryEndpoint`).
  // Also silently no-op when neither sendBeacon nor fetch is reachable —
  // there is no transport, and the caller's contract is "never observable".
  if (!endpoint || endpoint.length === 0 || noTransportAvailable(deps)) {
    return {
      emit: () => {
        /* silent no-op */
      },
    };
  }

  return {
    emit(input: MfeLoadTelemetryInput): void {
      // A throw INSIDE emit() (e.g. a faulty mocked transport) would propagate
      // into the bootstrap's load loop, which is exactly what the
      // fire-and-forget contract forbids. Wrap the whole body so the worst-case
      // is a swallowed error.
      try {
        const event = composeEvent(input, config, deps.now);
        const payload = JSON.stringify(event);

        // sendBeacon: the right primitive for fire-and-forget. The browser
        // queues the request and flushes it even if the tab navigates away.
        // It returns `false` when the user-agent refuses to queue (payload too
        // large, the tab is in a state that blocks beacons, etc.). On `false`
        // we fall through to `fetch()` so a refused beacon does not silently
        // drop the event when a fallback is available.
        const sendBeacon = deps.getSendBeacon();
        if (typeof sendBeacon === 'function') {
          let queued = false;
          try {
            // The sendBeacon API accepts a Blob with an explicit content type.
            // Using a Blob (rather than a raw string) keeps the queued request
            // from defaulting to text/plain; some sinks reject that.
            const blob = new Blob([payload], { type: TELEMETRY_CONTENT_TYPE });
            queued = sendBeacon(endpoint, blob);
          } catch {
            queued = false;
          }
          if (queued) return;
          // fallthrough to fetch
        }

        // fetch fallback. `keepalive: true` lets the request continue after
        // the page begins unloading (mirrors sendBeacon semantics). The
        // returned Promise is intentionally NOT awaited — the dispatcher
        // returns to the caller immediately. `.catch(() => {})` swallows any
        // rejection (a refused connection, CORS error, abort) so it never
        // surfaces as an unhandled rejection.
        try {
          const result = deps.fetchImpl(endpoint, {
            method: 'POST',
            // `keepalive` is supported in modern browsers; the bundle's TS lib
            // includes it but be defensive for older runtimes.
            keepalive: true,
            headers: { 'Content-Type': TELEMETRY_CONTENT_TYPE },
            body: payload,
            credentials: 'omit',
          });
          // Some test mocks may return a non-thenable; guard before .catch.
          if (result && typeof (result as Promise<unknown>).then === 'function') {
            (result as Promise<unknown>).then(
              () => undefined,
              () => undefined
            );
          }
        } catch {
          // A synchronous throw from a polyfilled fetch must not escape.
        }
      } catch {
        // Belt-and-suspenders: composeEvent / JSON.stringify must not surface.
      }
    },
  };
}
