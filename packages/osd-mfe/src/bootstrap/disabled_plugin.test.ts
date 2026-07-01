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
  createDisabledPluginModuleWithReason,
  createDisabledPluginRecord,
  DEGRADED_APP_CLASS,
  DEGRADED_APP_TEST_SUBJ,
  DisabledPluginRecord,
  humanReasonFor,
  renderDegradedAppContent,
} from './disabled_plugin';
import type { TelemetryErrorClass } from './telemetry';

/** Build a record for tests with a stable, recognisable shape. */
function record(overrides: Partial<DisabledPluginRecord> = {}): DisabledPluginRecord {
  const errorClass = overrides.errorClass ?? 'sri-mismatch';
  return {
    id: 'inspector',
    version: '3.5.0+aaa',
    errorClass,
    humanReason: humanReasonFor(errorClass),
    ...overrides,
  };
}

describe('humanReasonFor', () => {
  // EXHAUSTIVE: enumerate every member of the locked TelemetryErrorClass union.
  // If a new member is added (extending the union in telemetry.ts) this table
  // must be updated; the bracket lookup in humanReasonFor() would otherwise
  // return `undefined` at runtime — caught by this assertion + the type system
  // requirement on the underlying mapping object.
  const cases: Array<[TelemetryErrorClass, string]> = [
    ['sri-mismatch', 'integrity check failed'],
    ['compat-reject', 'incompatible with this OSD version'],
    ['network', 'failed to load'],
    ['mf-runtime-error', 'plugin runtime error'],
    ['unknown', 'unknown error'],
  ];

  it.each(cases)('maps %s to its locked human-readable reason', (errorClass, expected) => {
    expect(humanReasonFor(errorClass)).toBe(expected);
  });

  it('returns a non-empty string for every known errorClass', () => {
    for (const [ec] of cases) {
      const reason = humanReasonFor(ec);
      expect(typeof reason).toBe('string');
      expect(reason.length).toBeGreaterThan(0);
    }
  });
});

describe('createDisabledPluginRecord', () => {
  it('builds a record with humanReason matching humanReasonFor(errorClass)', () => {
    const r = createDisabledPluginRecord('data', '3.5.0+xyz', 'compat-reject');
    expect(r).toEqual({
      id: 'data',
      version: '3.5.0+xyz',
      errorClass: 'compat-reject',
      humanReason: humanReasonFor('compat-reject'),
    });
  });

  it('preserves an empty version (registry-trust skip case)', () => {
    const r = createDisabledPluginRecord('any', '', 'unknown');
    expect(r.version).toBe('');
  });
});

describe('renderDegradedAppContent', () => {
  let host: HTMLElement;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    if (host.parentNode) host.parentNode.removeChild(host);
  });

  it('renders the status root with the documented data-test-subj + class', () => {
    renderDegradedAppContent(host, record());

    const root = host.querySelector(`[data-test-subj="${DEGRADED_APP_TEST_SUBJ}"]`);
    expect(root).not.toBeNull();
    expect(root!.classList.contains(DEGRADED_APP_CLASS)).toBe(true);
    // role="alert" so AT users hear the change-of-state on navigation.
    expect(root!.getAttribute('role')).toBe('alert');
  });

  it('renders the heading + the human reason + the plugin id + the errorClass', () => {
    renderDegradedAppContent(
      host,
      record({ id: 'data', version: 'v', errorClass: 'sri-mismatch' })
    );

    expect(host.textContent).toContain('This feature is currently unavailable');
    expect(host.textContent).toContain('integrity check failed');
    expect(host.textContent).toContain('data');
    expect(host.textContent).toContain('sri-mismatch');
  });

  it('places the human reason in a dedicated `*-reason` element (verifier hook)', () => {
    renderDegradedAppContent(host, record({ errorClass: 'network' }));

    const reasonNode = host.querySelector(`[data-test-subj="${DEGRADED_APP_TEST_SUBJ}-reason"]`);
    expect(reasonNode).not.toBeNull();
    expect(reasonNode!.textContent).toBe('failed to load');
  });

  it('escapes plugin id + errorClass via textContent (no HTML interpretation)', () => {
    // Even though id/errorClass come from the registry, building child nodes
    // with textContent (not innerHTML) is defense-in-depth: a registry that
    // ever carried `<script>` should NOT execute. Use a recognisable angle-
    // bracket payload to assert pure-text rendering.
    const malicious = record({ id: '<script>x</script>' });
    renderDegradedAppContent(host, malicious);

    const meta = host.querySelector(`[data-test-subj="${DEGRADED_APP_TEST_SUBJ}-meta"]`);
    expect(meta).not.toBeNull();
    expect(meta!.querySelector('script')).toBeNull();
    expect(meta!.textContent).toContain('<script>x</script>');
  });

  it('appends to an existing element (does not overwrite host content)', () => {
    // The disabled-app stub may receive a host element OSD has prepared (e.g.
    // a `<div class="appWrapper">`). Appending — rather than replacing
    // innerHTML — is the documented contract: leave any host scaffolding
    // intact, add our root, and let the cleanup function detach it on unmount.
    const sentinel = document.createElement('span');
    sentinel.textContent = 'sentinel';
    host.appendChild(sentinel);

    renderDegradedAppContent(host, record());

    expect(host.contains(sentinel)).toBe(true);
    expect(host.querySelector(`[data-test-subj="${DEGRADED_APP_TEST_SUBJ}"]`)).not.toBeNull();
  });
});

describe('createDisabledPluginModuleWithReason — plugin_reader contract', () => {
  it('returns a module whose .plugin() yields setup/start/stop functions', () => {
    const mod = createDisabledPluginModuleWithReason(record());
    expect(typeof mod.plugin).toBe('function');

    const instance = mod.plugin() as {
      setup: (core: unknown) => unknown;
      start: () => unknown;
      stop: () => unknown;
    };
    expect(typeof instance.setup).toBe('function');
    expect(typeof instance.start).toBe('function');
    expect(typeof instance.stop).toBe('function');

    // setup with a missing core (no application) and start return empty contracts
    // and never throw — the single-failure-isolation invariant.
    expect(() => instance.setup(undefined)).not.toThrow();
    expect(instance.setup(undefined)).toEqual({});
    expect(instance.start()).toEqual({});
  });
});

describe('createDisabledPluginModuleWithReason — degraded app stub registration', () => {
  /** Build a `core` double that records register() calls. */
  function fakeCore() {
    const calls: Array<{
      id: string;
      title: string;
      navLinkStatus?: number;
      mount: (params: { element: HTMLElement }) => unknown;
    }> = [];
    return {
      core: {
        application: {
          register: (app: {
            id: string;
            title: string;
            navLinkStatus?: number;
            mount: (params: { element: HTMLElement }) => unknown;
          }) => {
            calls.push(app);
          },
        },
      },
      calls,
    };
  }

  it('registers an app at the disabled plugin id with title + hidden nav link', () => {
    const r = record({ id: 'inspector', errorClass: 'compat-reject' });
    const { core, calls } = fakeCore();

    const instance = (createDisabledPluginModuleWithReason(r).plugin() as unknown) as {
      setup: (c: unknown) => unknown;
    };
    instance.setup(core);

    expect(calls).toHaveLength(1);
    expect(calls[0].id).toBe('inspector');
    expect(calls[0].title).toBe('inspector (unavailable)');
    // 3 = AppNavLinkStatus.hidden (asserted matches the OSD enum below). The
    // "NOT a banner, NOT a nav-bar element" contract: the hidden status keeps
    // the user from seeing this app in the side nav.
    expect(calls[0].navLinkStatus).toBe(3);
  });

  it('registers a mount that renders the degraded status component into its element', () => {
    const r = record({ id: 'data', errorClass: 'sri-mismatch' });
    const { core, calls } = fakeCore();

    const instance = (createDisabledPluginModuleWithReason(r).plugin() as unknown) as {
      setup: (c: unknown) => unknown;
    };
    instance.setup(core);
    expect(calls).toHaveLength(1);

    // Drive the registered mount with a host element and assert it renders.
    const element = document.createElement('div');
    document.body.appendChild(element);
    try {
      const cleanup = calls[0].mount({ element }) as () => void;
      const rendered = element.querySelector(`[data-test-subj="${DEGRADED_APP_TEST_SUBJ}"]`);
      expect(rendered).not.toBeNull();
      expect(element.textContent).toContain('integrity check failed');

      // The mount cleanup detaches our children so OSD can reuse the element.
      expect(typeof cleanup).toBe('function');
      cleanup();
      expect(element.querySelector(`[data-test-subj="${DEGRADED_APP_TEST_SUBJ}"]`)).toBeNull();
    } finally {
      if (element.parentNode) element.parentNode.removeChild(element);
    }
  });

  it('silently no-ops when core has no application (preserving the single-failure-isolation invariant)', () => {
    const instance = (createDisabledPluginModuleWithReason(record()).plugin() as unknown) as {
      setup: (c: unknown) => unknown;
    };

    // None of these should throw — even with a future core surface that no
    // longer carries `application.register`.
    expect(() => instance.setup({})).not.toThrow();
    expect(() => instance.setup({ application: {} })).not.toThrow();
    expect(() => instance.setup(null)).not.toThrow();
    expect(() => instance.setup(undefined)).not.toThrow();
  });

  it('silently no-ops if core.application.register throws', () => {
    const core = {
      application: {
        register: () => {
          throw new Error('schema mismatch — future core');
        },
      },
    };
    const instance = (createDisabledPluginModuleWithReason(record()).plugin() as unknown) as {
      setup: (c: unknown) => unknown;
    };
    expect(() => instance.setup(core)).not.toThrow();
    expect(instance.setup(core)).toEqual({});
  });

  it('matches AppNavLinkStatus.hidden as defined by OSD core (regression sentinel)', () => {
    // Read the OSD enum directly to keep our inlined `3` literal honest. If the
    // upstream value ever shifts, this test fails LOUDLY here rather than in
    // a runtime nav-bar regression.
    /* eslint-disable @typescript-eslint/no-var-requires */
    // The bootstrap package does not depend on `src/core/public` at runtime, but
    // resolving the module from the workspace for this in-tree test is fine.
    const types = require('../../../../src/core/public/application/types');
    expect(types.AppNavLinkStatus.hidden).toBe(3);
    /* eslint-enable @typescript-eslint/no-var-requires */
  });
});
