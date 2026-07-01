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
  CreateTelemetryDispatcherDeps,
  MfeLoadTelemetryEvent,
  MfeLoadTelemetryInput,
  TelemetryDispatcherConfig,
  TelemetryStatus,
  createTelemetryDispatcher,
} from './telemetry';

const FROZEN_TIMESTAMP = '2025-12-13T07:30:00.000Z';

const VALID_CONFIG: TelemetryDispatcherConfig = {
  endpoint: 'http://localhost:9999/__mfe_telemetry',
  bucket: 42,
  customerId: 'acme',
};

/** Build an input with sensible defaults; override what the test cares about. */
function inputOf(overrides: Partial<MfeLoadTelemetryInput> = {}): MfeLoadTelemetryInput {
  return {
    id: 'inspector',
    version: '3.5.0+aaa',
    status: 'success' as TelemetryStatus,
    durationMs: 12,
    ...overrides,
  };
}

/**
 * Build a deps stub that records every call. Defaults:
 *   - sendBeacon: undefined (fetch fallback path)
 *   - fetch: returns an unresolved Promise so callers can assert
 *     fire-and-forget timing without a real microtask drain
 *   - now: a frozen timestamp for deterministic event-shape assertions
 */
function buildDeps(
  overrides: Partial<CreateTelemetryDispatcherDeps> = {}
): {
  deps: CreateTelemetryDispatcherDeps;
  fetchCalls: Array<{ url: RequestInfo | URL; init?: RequestInit }>;
  beaconCalls: Array<{ url: string; data: BodyInit | null | undefined }>;
} {
  const fetchCalls: Array<{ url: RequestInfo | URL; init?: RequestInit }> = [];
  const beaconCalls: Array<{ url: string; data: BodyInit | null | undefined }> = [];

  const fetchImpl = (jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
    fetchCalls.push({ url: input, init });
    // Unresolved by default; tests that need a resolved/rejected promise
    // pass their own `fetchImpl`.
    return new Promise<Response>(() => undefined);
  }) as unknown) as typeof fetch;

  const deps: CreateTelemetryDispatcherDeps = {
    getSendBeacon: () => undefined,
    fetchImpl,
    now: () => FROZEN_TIMESTAMP,
    ...overrides,
  };

  return {
    deps,
    fetchCalls,
    beaconCalls,
  };
}

describe('createTelemetryDispatcher', () => {
  describe('event shape (locked spec)', () => {
    it('stamps id/version/status/durationMs from input + bucket/customerId/timestamp from config', () => {
      const { deps, fetchCalls } = buildDeps();
      const dispatcher = createTelemetryDispatcher(VALID_CONFIG, deps);

      dispatcher.emit(
        inputOf({ id: 'data', version: '3.5.0+bbb', status: 'success', durationMs: 7 })
      );

      expect(fetchCalls).toHaveLength(1);
      const sent = JSON.parse(String(fetchCalls[0].init!.body)) as MfeLoadTelemetryEvent;
      expect(sent).toEqual({
        id: 'data',
        version: '3.5.0+bbb',
        status: 'success',
        durationMs: 7,
        bucket: 42,
        customerId: 'acme',
        timestamp: FROZEN_TIMESTAMP,
      });
      // errorClass is OMITTED on a success event (not present as `null`).
      expect('errorClass' in sent).toBe(false);
    });

    it.each([
      ['failure', 'sri-mismatch'],
      ['failure', 'network'],
      ['failure', 'mf-runtime-error'],
      ['failure', 'unknown'],
      ['skipped', 'compat-reject'],
    ] as Array<[TelemetryStatus, MfeLoadTelemetryEvent['errorClass']]>)(
      'carries errorClass=%s for status=%s',
      (status, errorClass) => {
        const { deps, fetchCalls } = buildDeps();
        const dispatcher = createTelemetryDispatcher(VALID_CONFIG, deps);

        dispatcher.emit(inputOf({ status, errorClass, durationMs: status === 'skipped' ? 0 : 33 }));

        const sent = JSON.parse(String(fetchCalls[0].init!.body)) as MfeLoadTelemetryEvent;
        expect(sent.status).toBe(status);
        expect(sent.errorClass).toBe(errorClass);
      }
    );

    it('uses POSTed JSON body with application/json Content-Type and credentials omitted', () => {
      const { deps, fetchCalls } = buildDeps();
      const dispatcher = createTelemetryDispatcher(VALID_CONFIG, deps);

      dispatcher.emit(inputOf());

      expect(fetchCalls[0].url).toBe(VALID_CONFIG.endpoint);
      const init = fetchCalls[0].init!;
      expect(init.method).toBe('POST');
      expect(init.credentials).toBe('omit');
      expect(init.keepalive).toBe(true);
      expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
    });
  });

  describe('silent no-op (the load loop must never observe telemetry)', () => {
    it('returns a no-op when endpoint is undefined', () => {
      const { deps, fetchCalls, beaconCalls } = buildDeps();
      const dispatcher = createTelemetryDispatcher({ ...VALID_CONFIG, endpoint: undefined }, deps);

      expect(() => dispatcher.emit(inputOf())).not.toThrow();
      expect(fetchCalls).toHaveLength(0);
      expect(beaconCalls).toHaveLength(0);
    });

    it('returns a no-op when endpoint is the empty string', () => {
      const { deps, fetchCalls, beaconCalls } = buildDeps();
      const dispatcher = createTelemetryDispatcher({ ...VALID_CONFIG, endpoint: '' }, deps);

      expect(() => dispatcher.emit(inputOf())).not.toThrow();
      expect(fetchCalls).toHaveLength(0);
      expect(beaconCalls).toHaveLength(0);
    });

    it('returns a no-op when neither sendBeacon nor fetch is available', () => {
      const dispatcher = createTelemetryDispatcher(VALID_CONFIG, {
        getSendBeacon: () => undefined,
        // Cast around `typeof fetch` to simulate a runtime where fetch is absent.
        fetchImpl: (undefined as unknown) as typeof fetch,
        now: () => FROZEN_TIMESTAMP,
      });

      expect(() => dispatcher.emit(inputOf())).not.toThrow();
    });

    it('swallows a rejected fetch (no unhandled-rejection escapes)', () => {
      const fetchImpl = (jest.fn(() =>
        Promise.reject(new Error('refused'))
      ) as unknown) as typeof fetch;
      const { deps } = buildDeps({ fetchImpl });
      const dispatcher = createTelemetryDispatcher(VALID_CONFIG, deps);

      // Capture unhandled rejections during the test window — there must be
      // none, because the dispatcher .catches its own promise.
      const seenUnhandled: unknown[] = [];
      const onUnhandled = (e: PromiseRejectionEvent | Event) => {
        const reason = (e as PromiseRejectionEvent).reason ?? e;
        seenUnhandled.push(reason);
      };
      const target = (typeof window !== 'undefined' ? window : process) as Window | NodeJS.Process;
      // Both browser-like (window) and node-like (process) targets.
      // jest+jsdom exposes `window`.
      (target as Window).addEventListener?.('unhandledrejection', onUnhandled as EventListener);

      expect(() => dispatcher.emit(inputOf())).not.toThrow();
      // microtask drain
      return Promise.resolve().then(() => {
        (target as Window).removeEventListener?.(
          'unhandledrejection',
          onUnhandled as EventListener
        );
        expect(seenUnhandled).toEqual([]);
      });
    });

    it('swallows a synchronous throw from a polyfilled fetch', () => {
      const fetchImpl = (jest.fn(() => {
        throw new Error('boom');
      }) as unknown) as typeof fetch;
      const { deps } = buildDeps({ fetchImpl });
      const dispatcher = createTelemetryDispatcher(VALID_CONFIG, deps);

      expect(() => dispatcher.emit(inputOf())).not.toThrow();
    });

    it('swallows a sendBeacon that throws synchronously and falls through to fetch', () => {
      const sendBeaconSpy = jest.fn(() => {
        throw new Error('beacon-broken');
      });
      const { deps, fetchCalls } = buildDeps({
        getSendBeacon: () => sendBeaconSpy,
      });
      const dispatcher = createTelemetryDispatcher(VALID_CONFIG, deps);

      expect(() => dispatcher.emit(inputOf())).not.toThrow();
      expect(sendBeaconSpy).toHaveBeenCalledTimes(1);
      // Falls through to fetch because the beacon did not queue successfully.
      expect(fetchCalls).toHaveLength(1);
    });
  });

  describe('transport priority (sendBeacon when available)', () => {
    it('uses sendBeacon and skips fetch when the beacon was queued', () => {
      const sendBeaconSpy = jest.fn((_url: string, _data?: BodyInit | null) => true);
      const { deps, fetchCalls } = buildDeps({
        getSendBeacon: () => sendBeaconSpy,
      });
      const dispatcher = createTelemetryDispatcher(VALID_CONFIG, deps);

      dispatcher.emit(inputOf({ id: 'data' }));

      expect(sendBeaconSpy).toHaveBeenCalledTimes(1);
      const call = sendBeaconSpy.mock.calls[0];
      expect(call[0]).toBe(VALID_CONFIG.endpoint);
      expect(call[1]).toBeInstanceOf(Blob);
      expect(fetchCalls).toHaveLength(0);
    });

    it('falls back to fetch when sendBeacon returns false (refused to queue)', () => {
      const sendBeaconSpy = jest.fn((_url: string, _data?: BodyInit | null) => false);
      const { deps, fetchCalls } = buildDeps({
        getSendBeacon: () => sendBeaconSpy,
      });
      const dispatcher = createTelemetryDispatcher(VALID_CONFIG, deps);

      dispatcher.emit(inputOf());

      expect(sendBeaconSpy).toHaveBeenCalledTimes(1);
      expect(fetchCalls).toHaveLength(1);
    });
  });

  describe('fire-and-forget semantics', () => {
    it('emit() returns synchronously — caller is not blocked on the network', () => {
      // A fetch that NEVER resolves: emit must still return immediately.
      const fetchImpl = (jest.fn(
        () => new Promise<Response>(() => undefined)
      ) as unknown) as typeof fetch;
      const { deps } = buildDeps({ fetchImpl });
      const dispatcher = createTelemetryDispatcher(VALID_CONFIG, deps);

      const start = Date.now();
      dispatcher.emit(inputOf());
      const elapsed = Date.now() - start;

      // emit() is purely synchronous (returns void), so the elapsed is
      // bounded by tens of ms even on a slow CI. Assert a generous upper
      // bound that still proves we did NOT await the never-resolving fetch.
      expect(elapsed).toBeLessThan(500);
    });
  });
});
