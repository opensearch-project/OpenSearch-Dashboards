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

import { bootstrapMfe, BootstrapMfeDeps } from './bootstrap_mfe';
import { MfeBrowserWindow, MfeContainer, PluginPublicModule, ShareScope } from './types';

const SHARED_DEPS_URL = 'http://localhost:8080/shared-deps/osd-ui-shared-deps.js';
const REGISTRY_URL = 'http://localhost:8080/registry';

function validRegistry() {
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    sharedDeps: { url: 'http://localhost:8080/shared-deps/', version: '3.5.0' },
    mfes: {
      inspector: {
        version: '3.5.0+aaa',
        remoteEntry: 'http://localhost:8080/mfe/inspector/remoteEntry.js',
        scope: 'inspector',
        module: './public',
      },
      data: {
        version: '3.5.0+bbb',
        remoteEntry: 'http://localhost:8080/mfe/data/remoteEntry.js',
        scope: 'data',
        module: './public',
      },
    },
  };
}

function testWindow(): MfeBrowserWindow {
  return (window as unknown) as MfeBrowserWindow;
}

describe('bootstrapMfe (locked sequence)', () => {
  it('seeds singletons, loads remotes, populates the shim, then boots core', async () => {
    const order: string[] = [];
    const registered = new Set<string>();
    let scopeSeenByRemotes: ShareScope | undefined;

    const fakeContainer: MfeContainer = {
      init: () => undefined,
      get: () => Promise.resolve(() => ({ plugin: () => undefined })),
    };

    const deps: Partial<BootstrapMfeDeps> = {
      loadScript: jest.fn(async (url: string) => {
        if (url === SHARED_DEPS_URL) {
          // The shared-deps script assigns the singleton globals on load.
          testWindow().__osdSharedDeps__ = {
            React: { version: '16.14.0' },
            ReactDom: { version: '16.14.0' },
            Lodash: { VERSION: '4.17.21' },
          };
        }
      }),
      fetchImpl: ((async () => ({
        ok: true,
        status: 200,
        json: async () => validRegistry(),
      })) as unknown) as typeof fetch,
      loadRemoteContainer: jest.fn(async () => fakeContainer),
      getRemoteModuleFactory: jest.fn(
        async (
          _container: MfeContainer,
          shareScope: ShareScope
        ): Promise<() => PluginPublicModule> => {
          scopeSeenByRemotes = shareScope;
          return () => ({ plugin: () => undefined });
        }
      ),
      registerPluginFactory: jest.fn((id: string) => {
        order.push(`register:${id}`);
        registered.add(id);
      }),
      invokeCoreBootstrap: jest.fn(async () => {
        order.push('coreBootstrap');
        // CRITICAL: every plugin must already be in the shim before core boots,
        // because plugin_reader reads __osdBundles__ synchronously at start.
        expect(registered.has('inspector')).toBe(true);
        expect(registered.has('data')).toBe(true);
      }),
    };

    await bootstrapMfe({
      registryUrl: REGISTRY_URL,
      sharedDepsUrl: SHARED_DEPS_URL,
      deps,
    });

    // Both plugins registered BEFORE core bootstrap (order check).
    expect(order).toEqual(
      expect.arrayContaining(['register:inspector', 'register:data', 'coreBootstrap'])
    );
    expect(order.indexOf('coreBootstrap')).toBe(order.length - 1);
    expect(order.indexOf('register:inspector')).toBeLessThan(order.indexOf('coreBootstrap'));
    expect(order.indexOf('register:data')).toBeLessThan(order.indexOf('coreBootstrap'));

    // react/react-dom were seeded as singletons in the scope handed to remotes.
    expect(scopeSeenByRemotes).toBeDefined();
    expect(scopeSeenByRemotes!.react).toBeDefined();
    expect(scopeSeenByRemotes!['react-dom']).toBeDefined();
    expect(deps.loadRemoteContainer).toHaveBeenCalledTimes(2);
  });

  it('arms the lazy-chunk integrity-failure surface once, before core boot', async () => {
    const order: string[] = [];
    const deps: Partial<BootstrapMfeDeps> = {
      loadScript: jest.fn(async (url: string) => {
        if (url === SHARED_DEPS_URL) {
          testWindow().__osdSharedDeps__ = { React: { version: '16.14.0' } };
        }
      }),
      fetchImpl: ((async () => ({
        ok: true,
        status: 200,
        json: async () => validRegistry(),
      })) as unknown) as typeof fetch,
      loadRemoteContainer: jest.fn(async () => ({
        init: () => undefined,
        get: () => Promise.resolve(() => ({ plugin: () => undefined })),
      })),
      getRemoteModuleFactory: jest.fn(async () => () => ({ plugin: () => undefined })),
      registerPluginFactory: jest.fn(),
      installChunkErrorSurface: jest.fn(() => {
        order.push('installChunkErrorSurface');
        return () => undefined;
      }),
      invokeCoreBootstrap: jest.fn(async () => {
        order.push('coreBootstrap');
      }),
    };

    await bootstrapMfe({ registryUrl: REGISTRY_URL, sharedDepsUrl: SHARED_DEPS_URL, deps });

    // Installed exactly once, and BEFORE core boot so it is armed for the whole
    // app lifetime (a chunk failure is a runtime event after mount).
    expect(deps.installChunkErrorSurface).toHaveBeenCalledTimes(1);
    expect(order[0]).toBe('installChunkErrorSurface');
    expect(order.indexOf('installChunkErrorSurface')).toBeLessThan(order.indexOf('coreBootstrap'));
  });

  it('loads the shared-deps dependency chunks (in order) BEFORE the entry', async () => {
    const loadOrder: string[] = [];
    const DEP_A = 'http://localhost:8080/shared-deps/osd-ui-shared-deps.@elastic.js';

    const deps: Partial<BootstrapMfeDeps> = {
      loadScript: jest.fn(async (url: string) => {
        loadOrder.push(url);
        if (url === SHARED_DEPS_URL) {
          testWindow().__osdSharedDeps__ = { React: { version: '16.14.0' } };
        }
      }),
      fetchImpl: ((async () => ({
        ok: true,
        status: 200,
        json: async () => validRegistry(),
      })) as unknown) as typeof fetch,
      loadRemoteContainer: jest.fn(async () => ({
        init: () => undefined,
        get: () => Promise.resolve(() => ({ plugin: () => undefined })),
      })),
      getRemoteModuleFactory: jest.fn(async () => () => ({ plugin: () => undefined })),
      registerPluginFactory: jest.fn(),
      invokeCoreBootstrap: jest.fn(async () => undefined),
    };

    await bootstrapMfe({
      registryUrl: REGISTRY_URL,
      sharedDepsUrl: SHARED_DEPS_URL,
      sharedDepsDepUrls: [DEP_A],
      deps,
    });

    // The dependency chunk must load strictly before the shared-deps entry, since
    // the entry only assigns window.__osdSharedDeps__ once its chunks are present.
    expect(loadOrder.indexOf(DEP_A)).toBeGreaterThanOrEqual(0);
    expect(loadOrder.indexOf(DEP_A)).toBeLessThan(loadOrder.indexOf(SHARED_DEPS_URL));
  });

  it('throws when shared deps are unavailable after loading the script', async () => {
    const deps: Partial<BootstrapMfeDeps> = {
      // Does not assign __osdSharedDeps__.
      loadScript: jest.fn(async () => undefined),
    };
    testWindow().__osdSharedDeps__ = (undefined as unknown) as Record<string, unknown>;

    await expect(
      bootstrapMfe({ registryUrl: REGISTRY_URL, sharedDepsUrl: SHARED_DEPS_URL, deps })
    ).rejects.toThrow(/__osdSharedDeps__ is not available/);
  });

  it('throws on a non-ok registry response', async () => {
    const deps: Partial<BootstrapMfeDeps> = {
      loadScript: jest.fn(async () => {
        testWindow().__osdSharedDeps__ = { React: { version: '16.14.0' } };
      }),
      fetchImpl: ((async () => ({
        ok: false,
        status: 503,
        json: async () => ({}),
      })) as unknown) as typeof fetch,
    };

    await expect(
      bootstrapMfe({ registryUrl: REGISTRY_URL, sharedDepsUrl: SHARED_DEPS_URL, deps })
    ).rejects.toThrow(/HTTP 503/);
  });

  it('disables a single failed remote (allSettled) and still boots core with the rest', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const factories = new Map<string, () => PluginPublicModule>();
    let coreBooted = false;

    const deps: Partial<BootstrapMfeDeps> = {
      loadScript: jest.fn(async (url: string) => {
        if (url === SHARED_DEPS_URL) {
          testWindow().__osdSharedDeps__ = { React: { version: '16.14.0' } };
        }
      }),
      fetchImpl: ((async () => ({
        ok: true,
        status: 200,
        json: async () => validRegistry(),
      })) as unknown) as typeof fetch,
      // `inspector` fails to load; `data` succeeds.
      loadRemoteContainer: jest.fn(async (_remoteEntry: string, scope: string) => {
        if (scope === 'inspector') {
          throw new Error(`boom: ${scope}`);
        }
        return {
          init: () => undefined,
          get: () => Promise.resolve(() => ({ plugin: () => undefined })),
        } as MfeContainer;
      }),
      getRemoteModuleFactory: jest.fn(async () => () => ({ plugin: () => undefined })),
      registerPluginFactory: jest.fn((id: string, factory: () => PluginPublicModule) => {
        factories.set(id, factory);
      }),
      invokeCoreBootstrap: jest.fn(async () => {
        coreBooted = true;
      }),
    };

    // A single failed remote MUST NOT reject the whole boot.
    await expect(
      bootstrapMfe({ registryUrl: REGISTRY_URL, sharedDepsUrl: SHARED_DEPS_URL, deps })
    ).resolves.toBeUndefined();

    // Both plugins are registered (the healthy one + a placeholder for the failed
    // one) and core still booted.
    expect(factories.has('data')).toBe(true);
    expect(factories.has('inspector')).toBe(true);
    expect(coreBooted).toBe(true);
    expect(deps.invokeCoreBootstrap).toHaveBeenCalledTimes(1);

    // The failed plugin's registered factory must yield an INERT plugin so OSD
    // core's plugin_reader resolves it (has `.plugin`, instance has setup/start).
    const disabled = factories.get('inspector')!();
    expect(typeof disabled.plugin).toBe('function');
    const instance = disabled.plugin() as {
      setup: () => unknown;
      start: () => unknown;
      stop: () => unknown;
    };
    expect(typeof instance.setup).toBe('function');
    expect(typeof instance.start).toBe('function');
    expect(instance.setup()).toEqual({});
    expect(instance.start()).toEqual({});

    // The failure is logged clearly (per-remote error naming the id + a summary warn).
    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError.mock.calls[0][0]).toContain('inspector');
    expect(consoleWarn).toHaveBeenCalledTimes(1);
    expect(consoleWarn.mock.calls[0][0]).toContain('inspector');

    consoleError.mockRestore();
    consoleWarn.mockRestore();
  });

  it('does not log failures and registers all remotes when every remote loads', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const registered = new Set<string>();

    const deps: Partial<BootstrapMfeDeps> = {
      loadScript: jest.fn(async (url: string) => {
        if (url === SHARED_DEPS_URL) {
          testWindow().__osdSharedDeps__ = { React: { version: '16.14.0' } };
        }
      }),
      fetchImpl: ((async () => ({
        ok: true,
        status: 200,
        json: async () => validRegistry(),
      })) as unknown) as typeof fetch,
      loadRemoteContainer: jest.fn(async () => ({
        init: () => undefined,
        get: () => Promise.resolve(() => ({ plugin: () => undefined })),
      })),
      getRemoteModuleFactory: jest.fn(async () => () => ({ plugin: () => undefined })),
      registerPluginFactory: jest.fn((id: string) => {
        registered.add(id);
      }),
      invokeCoreBootstrap: jest.fn(async () => undefined),
    };

    await bootstrapMfe({ registryUrl: REGISTRY_URL, sharedDepsUrl: SHARED_DEPS_URL, deps });

    expect(registered.has('inspector')).toBe(true);
    expect(registered.has('data')).toBe(true);
    expect(consoleError).not.toHaveBeenCalled();
    expect(consoleWarn).not.toHaveBeenCalled();

    consoleError.mockRestore();
    consoleWarn.mockRestore();
  });
});

describe('bootstrapMfe — dev URL-override wiring (Phase 5, Story 1)', () => {
  const REGISTRY_INSPECTOR_URL = 'http://localhost:8080/mfe/inspector/remoteEntry.js';
  const REGISTRY_DATA_URL = 'http://localhost:8080/mfe/data/remoteEntry.js';
  const OVERRIDE_INSPECTOR_URL = 'http://localhost:5601/mfe/inspector/remoteEntry.js';

  /**
   * Build deps that record every (remoteEntry, scope) passed to
   * loadRemoteContainer so a test can assert which URL each plugin loaded from.
   */
  function recordingDeps(
    extra: Partial<BootstrapMfeDeps> = {}
  ): { deps: Partial<BootstrapMfeDeps>; loadedByScope: Map<string, string> } {
    const loadedByScope = new Map<string, string>();
    const deps: Partial<BootstrapMfeDeps> = {
      loadScript: jest.fn(async (url: string) => {
        if (url === SHARED_DEPS_URL) {
          testWindow().__osdSharedDeps__ = { React: { version: '16.14.0' } };
        }
      }),
      fetchImpl: ((async () => ({
        ok: true,
        status: 200,
        json: async () => validRegistry(),
      })) as unknown) as typeof fetch,
      loadRemoteContainer: jest.fn(async (remoteEntry: string, scope: string) => {
        loadedByScope.set(scope, remoteEntry);
        return {
          init: () => undefined,
          get: () => Promise.resolve(() => ({ plugin: () => undefined })),
        } as MfeContainer;
      }),
      getRemoteModuleFactory: jest.fn(async () => () => ({ plugin: () => undefined })),
      registerPluginFactory: jest.fn(),
      invokeCoreBootstrap: jest.fn(async () => undefined),
      // Stub the dev Inspector mount so these load-focused tests don't render
      // the real React/EUI panel; a dedicated describe below asserts the gate.
      mountInspector: jest.fn(),
      ...extra,
    };
    return { deps, loadedByScope };
  }

  it('loads an overridden plugin from its override URL while others use the registry (allowOverride=true)', async () => {
    const { deps, loadedByScope } = recordingDeps({
      readOverrideSearch: () => `?mfe.inspector=${OVERRIDE_INSPECTOR_URL}`,
      readOverrideStorage: () => undefined,
    });

    await bootstrapMfe({
      registryUrl: REGISTRY_URL,
      sharedDepsUrl: SHARED_DEPS_URL,
      allowOverride: true,
      deps,
    });

    expect(loadedByScope.get('inspector')).toBe(OVERRIDE_INSPECTOR_URL);
    expect(loadedByScope.get('data')).toBe(REGISTRY_DATA_URL);
  });

  it('applies a base override (?mfe.all) to every plugin, swapping origin but keeping the path', async () => {
    const { deps, loadedByScope } = recordingDeps({
      readOverrideSearch: () => '?mfe.all=http://localhost:5601',
      readOverrideStorage: () => undefined,
    });

    await bootstrapMfe({
      registryUrl: REGISTRY_URL,
      sharedDepsUrl: SHARED_DEPS_URL,
      allowOverride: true,
      deps,
    });

    expect(loadedByScope.get('inspector')).toBe(
      'http://localhost:5601/mfe/inspector/remoteEntry.js'
    );
    expect(loadedByScope.get('data')).toBe('http://localhost:5601/mfe/data/remoteEntry.js');
  });

  it('reads a persisted localStorage override when allowOverride=true', async () => {
    const { deps, loadedByScope } = recordingDeps({
      readOverrideSearch: () => '',
      readOverrideStorage: () => ({
        getItem: () => JSON.stringify({ inspector: OVERRIDE_INSPECTOR_URL }),
      }),
    });

    await bootstrapMfe({
      registryUrl: REGISTRY_URL,
      sharedDepsUrl: SHARED_DEPS_URL,
      allowOverride: true,
      deps,
    });

    expect(loadedByScope.get('inspector')).toBe(OVERRIDE_INSPECTOR_URL);
  });

  it('IGNORES every override source when the gate is off (allowOverride defaults to false)', async () => {
    const { deps, loadedByScope } = recordingDeps({
      readOverrideSearch: () =>
        `?mfe.inspector=${OVERRIDE_INSPECTOR_URL}&mfe.all=http://localhost:5601`,
      readOverrideStorage: () => ({
        getItem: () => JSON.stringify({ data: 'http://evil/data/remoteEntry.js' }),
      }),
    });

    // No allowOverride passed → defaults to false (production behavior).
    await bootstrapMfe({
      registryUrl: REGISTRY_URL,
      sharedDepsUrl: SHARED_DEPS_URL,
      deps,
    });

    // Both plugins load from the REGISTRY; the override sources are not consulted.
    expect(loadedByScope.get('inspector')).toBe(REGISTRY_INSPECTOR_URL);
    expect(loadedByScope.get('data')).toBe(REGISTRY_DATA_URL);
  });
});

describe('bootstrapMfe — dev Inspector mount gate (Phase 5, Story 3)', () => {
  // The Inspector mount is double-gated: server-config `mfe.allowOverride`
  // PLUS a URL `?inspect=true` opt-in. The existing mount-expected tests
  // need both gates; set the URL param in beforeEach so they don't false-
  // negative when the URL gate is added. A separate test below asserts the
  // gate fails closed (no mount) when the URL param is absent.
  const ORIGINAL_HREF = '/';
  beforeEach(() => {
    window.history.replaceState({}, '', '/?inspect=true');
  });
  afterEach(() => {
    window.history.replaceState({}, '', ORIGINAL_HREF);
  });

  /** Minimal happy-path deps plus an injectable mountInspector spy. */
  function inspectorDeps(): {
    deps: Partial<BootstrapMfeDeps>;
    mountInspector: jest.Mock;
  } {
    const mountInspector = jest.fn();
    const deps: Partial<BootstrapMfeDeps> = {
      loadScript: jest.fn(async (url: string) => {
        if (url === SHARED_DEPS_URL) {
          testWindow().__osdSharedDeps__ = { React: { version: '16.14.0' } };
        }
      }),
      fetchImpl: ((async () => ({
        ok: true,
        status: 200,
        json: async () => validRegistry(),
      })) as unknown) as typeof fetch,
      loadRemoteContainer: jest.fn(async () => ({
        init: () => undefined,
        get: () => Promise.resolve(() => ({ plugin: () => undefined })),
      })),
      getRemoteModuleFactory: jest.fn(async () => () => ({ plugin: () => undefined })),
      registerPluginFactory: jest.fn(),
      invokeCoreBootstrap: jest.fn(async () => undefined),
      mountInspector,
    };
    return { deps, mountInspector };
  }

  it('mounts the inspector with the resolved remotes when allowOverride=true', async () => {
    const { deps, mountInspector } = inspectorDeps();

    await bootstrapMfe({
      registryUrl: REGISTRY_URL,
      sharedDepsUrl: SHARED_DEPS_URL,
      allowOverride: true,
      deps,
    });

    expect(mountInspector).toHaveBeenCalledTimes(1);
    const entries = mountInspector.mock.calls[0][0] as Array<{
      id: string;
      remoteEntry: string;
      source: string;
    }>;
    // The inspector receives every registry plugin with its resolved source.
    const ids = entries.map((e) => e.id).sort();
    expect(ids).toEqual(['data', 'inspector']);
    expect(entries.every((e) => e.source === 'registry')).toBe(true);
  });

  it('reports an OVERRIDE source to the inspector for an overridden plugin', async () => {
    const { deps, mountInspector } = inspectorDeps();

    await bootstrapMfe({
      registryUrl: REGISTRY_URL,
      sharedDepsUrl: SHARED_DEPS_URL,
      allowOverride: true,
      deps: {
        ...deps,
        readOverrideSearch: () =>
          '?mfe.inspector=http://localhost:5601/mfe/inspector/remoteEntry.js',
        readOverrideStorage: () => undefined,
      },
    });

    const entries = mountInspector.mock.calls[0][0] as Array<{ id: string; source: string }>;
    const byId = Object.fromEntries(entries.map((e) => [e.id, e.source]));
    expect(byId.inspector).toBe('override');
    expect(byId.data).toBe('registry');
  });

  it('does NOT mount the inspector when allowOverride is off (production gate)', async () => {
    const { deps, mountInspector } = inspectorDeps();

    // No allowOverride passed → defaults to false (production behavior).
    await bootstrapMfe({
      registryUrl: REGISTRY_URL,
      sharedDepsUrl: SHARED_DEPS_URL,
      deps,
    });

    expect(mountInspector).not.toHaveBeenCalled();
  });

  it('does NOT mount the inspector when allowOverride=true but ?inspect=true is absent (URL opt-in)', async () => {
    // Override the URL the beforeEach set so this case has NO inspect param.
    // Verifies the second gate: even with the server-config gate ON, the panel
    // must be explicitly summoned via `?inspect=true` before it shows.
    window.history.replaceState({}, '', '/');

    const { deps, mountInspector } = inspectorDeps();
    await bootstrapMfe({
      registryUrl: REGISTRY_URL,
      sharedDepsUrl: SHARED_DEPS_URL,
      allowOverride: true,
      deps,
    });

    expect(mountInspector).not.toHaveBeenCalled();
  });

  it('passes the collected disabled records as the second arg to mountInspector (Phase 14, Story 2)', async () => {
    // Make ONE remote fail (Phase 4 graceful degradation) so a single record is
    // collected. The mountInspector spy must receive both the resolved entries
    // AND the disabled records — the dev panel's "Disabled plugins" section
    // depends on this argument.
    const { deps, mountInspector } = inspectorDeps();
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    await bootstrapMfe({
      registryUrl: REGISTRY_URL,
      sharedDepsUrl: SHARED_DEPS_URL,
      allowOverride: true,
      deps: {
        ...deps,
        loadRemoteContainer: jest.fn(async (_remoteEntry: string, scope: string) => {
          if (scope === 'inspector') {
            throw new Error(`boom: ${scope}`);
          }
          return {
            init: () => undefined,
            get: () => Promise.resolve(() => ({ plugin: () => undefined })),
          } as MfeContainer;
        }),
      },
    });

    expect(mountInspector).toHaveBeenCalledTimes(1);
    const disabled = mountInspector.mock.calls[0][1] as Array<{
      id: string;
      version: string;
      errorClass: string;
      humanReason: string;
    }>;
    expect(Array.isArray(disabled)).toBe(true);
    expect(disabled).toHaveLength(1);
    expect(disabled[0].id).toBe('inspector');
    // The thrown `Error('boom: inspector')` does not match the loadScript
    // error wording ("Failed to load script: …") nor the SRI marker, so
    // `classifyLoadError` routes it to `mf-runtime-error` (a Module-Federation
    // runtime malformation, the catch-all for container.init / container.get
    // / factory wiring throwing). The humanReason follows from the locked
    // mapping in disabled_plugin.ts.
    expect(disabled[0].errorClass).toBe('mf-runtime-error');
    expect(disabled[0].humanReason).toBe('plugin runtime error');
    expect(disabled[0].version).toBe('3.5.0+aaa');

    consoleError.mockRestore();
    consoleWarn.mockRestore();
  });

  it('passes an empty disabled array when every remote loads cleanly', async () => {
    const { deps, mountInspector } = inspectorDeps();

    await bootstrapMfe({
      registryUrl: REGISTRY_URL,
      sharedDepsUrl: SHARED_DEPS_URL,
      allowOverride: true,
      deps,
    });

    expect(mountInspector).toHaveBeenCalledTimes(1);
    const disabled = mountInspector.mock.calls[0][1] as unknown[];
    expect(Array.isArray(disabled)).toBe(true);
    expect(disabled).toHaveLength(0);
  });
});

describe('bootstrapMfe — Phase 14, Story 2 disabled-plugin registration (degraded app stub)', () => {
  /**
   * Drive the placeholder registered for a failed remote, then exercise its
   * setup() against a fake core that captures `application.register` calls.
   * Verifies the bootstrap chose `createDisabledPluginModuleWithReason` (not
   * the bare inert placeholder) at the load-failure site, and threaded the
   * right reason metadata through.
   */
  it('registers a degraded app stub for a failed remote, with the right id + humanReason', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const factories = new Map<string, () => PluginPublicModule>();

    const deps: Partial<BootstrapMfeDeps> = {
      loadScript: jest.fn(async (url: string) => {
        if (url === SHARED_DEPS_URL) {
          testWindow().__osdSharedDeps__ = { React: { version: '16.14.0' } };
        }
      }),
      fetchImpl: ((async () => ({
        ok: true,
        status: 200,
        json: async () => validRegistry(),
      })) as unknown) as typeof fetch,
      loadRemoteContainer: jest.fn(async (_remoteEntry: string, scope: string) => {
        if (scope === 'inspector') {
          throw new Error(`boom: ${scope}`);
        }
        return {
          init: () => undefined,
          get: () => Promise.resolve(() => ({ plugin: () => undefined })),
        } as MfeContainer;
      }),
      getRemoteModuleFactory: jest.fn(async () => () => ({ plugin: () => undefined })),
      registerPluginFactory: jest.fn((id: string, factory: () => PluginPublicModule) => {
        factories.set(id, factory);
      }),
      invokeCoreBootstrap: jest.fn(async () => undefined),
    };

    await bootstrapMfe({
      registryUrl: REGISTRY_URL,
      sharedDepsUrl: SHARED_DEPS_URL,
      deps,
    });

    // Drive the registered placeholder for the failed plugin.
    const mod = factories.get('inspector')!();
    const instance = mod.plugin() as { setup: (core: unknown) => unknown };

    // Fake `core` with a recording `application.register`. The placeholder
    // must register exactly ONE app at the disabled plugin id.
    const calls: Array<{
      id: string;
      title: string;
      navLinkStatus?: number;
      mount: (params: { element: HTMLElement }) => unknown;
    }> = [];
    instance.setup({
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
    });

    expect(calls).toHaveLength(1);
    expect(calls[0].id).toBe('inspector');
    expect(calls[0].title).toContain('inspector');
    // AppNavLinkStatus.hidden = 3 (assertion in disabled_plugin.test.ts).
    expect(calls[0].navLinkStatus).toBe(3);

    // The mount renders the degraded status component with the right humanReason.
    // `Error('boom: inspector')` from loadRemoteContainer is classified as
    // `mf-runtime-error` (no "Failed to load script" / "Subresource Integrity"
    // markers), so the humanReason is "plugin runtime error" per the locked
    // mapping in disabled_plugin.ts.
    const element = document.createElement('div');
    document.body.appendChild(element);
    try {
      calls[0].mount({ element });
      expect(element.querySelector('[data-test-subj="mfeDegradedApp"]')).not.toBeNull();
      expect(element.textContent).toContain('plugin runtime error');
    } finally {
      if (element.parentNode) element.parentNode.removeChild(element);
    }

    consoleError.mockRestore();
    consoleWarn.mockRestore();
  });
});

describe('bootstrapMfe — Phase 9 version-compatibility enforcement (Story 3)', () => {
  const HOST = {
    osdVersion: '3.5.0',
    sharedDeps: { react: '^16.14.0', 'react-dom': '^16.14.0' },
  };
  const NON_PROD = {
    onIncompatible: 'block' as const,
    onMissing: 'warn-load' as const,
    strictShared: true,
  };
  const PROD = {
    onIncompatible: 'skip' as const,
    onMissing: 'skip' as const,
    strictShared: true,
  };

  const COMPAT_META = {
    builtAgainst: {
      osdVersion: '3.5.0',
      sharedDeps: { react: '^16.14.0', 'react-dom': '^16.14.0' },
    },
    compat: { minCoreVersion: '3.5.0', compatibleCoreRange: '3.5.x' },
  };
  const CORE_INCOMPAT_META = {
    builtAgainst: { osdVersion: '3.7.0', sharedDeps: { react: '^16.14.0' } },
    compat: { minCoreVersion: '3.7.0', compatibleCoreRange: '3.7.x' },
  };
  const SHARED_INCOMPAT_META = {
    builtAgainst: { osdVersion: '3.5.0', sharedDeps: { react: '>=999.0.0' } },
    compat: { minCoreVersion: '3.5.0', compatibleCoreRange: '3.5.x' },
  };

  /**
   * A registry whose entries carry Phase 9 compat metadata. `good` is compatible;
   * `bad` is given `meta` (incompatible or unknown). The `bad` entry has NO
   * builtAgainst/compat when `meta` is `{}` (the UNKNOWN case).
   */
  function compatRegistry(meta: Record<string, unknown>) {
    return () => ({
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      sharedDeps: { url: 'http://localhost:8080/shared-deps/', version: '3.5.0' },
      mfes: {
        good: {
          version: '3.5.0+good',
          remoteEntry: 'http://localhost:8080/mfe/good/remoteEntry.js',
          scope: 'good',
          module: './public',
          ...COMPAT_META,
        },
        bad: {
          version: '3.5.0+bad',
          remoteEntry: 'http://localhost:8080/mfe/bad/remoteEntry.js',
          scope: 'bad',
          module: './public',
          ...meta,
        },
      },
    });
  }

  /** Build deps that record registrations, loads, core-boot and block-page calls. */
  function enforcementDeps(registryFactory: () => unknown) {
    const registered = new Map<string, () => PluginPublicModule>();
    const loadedScopes: string[] = [];
    const renderBlockPage = jest.fn();
    const invokeCoreBootstrap = jest.fn(async () => undefined);
    const deps: Partial<BootstrapMfeDeps> = {
      loadScript: jest.fn(async (url: string) => {
        if (url === SHARED_DEPS_URL) {
          testWindow().__osdSharedDeps__ = { React: { version: '16.14.0' } };
        }
      }),
      fetchImpl: ((async () => ({
        ok: true,
        status: 200,
        json: async () => registryFactory(),
      })) as unknown) as typeof fetch,
      loadRemoteContainer: jest.fn(async (_remoteEntry: string, scope: string) => {
        loadedScopes.push(scope);
        return {
          init: () => undefined,
          get: () => Promise.resolve(() => ({ plugin: () => undefined })),
        } as MfeContainer;
      }),
      getRemoteModuleFactory: jest.fn(async () => () => ({ plugin: () => undefined })),
      registerPluginFactory: jest.fn((id: string, factory: () => PluginPublicModule) => {
        registered.set(id, factory);
      }),
      invokeCoreBootstrap,
      renderBlockPage,
    };
    return { deps, registered, loadedScopes, renderBlockPage, invokeCoreBootstrap };
  }

  it('happy path: all compatible remotes load and core boots (non-prod AND prod)', async () => {
    for (const policy of [NON_PROD, PROD]) {
      const { deps, loadedScopes, renderBlockPage, invokeCoreBootstrap } = enforcementDeps(
        compatRegistry(COMPAT_META)
      );

      await bootstrapMfe({
        registryUrl: REGISTRY_URL,
        sharedDepsUrl: SHARED_DEPS_URL,
        host: HOST,
        compatPolicy: policy,
        deps,
      });

      expect(loadedScopes.sort()).toEqual(['bad', 'good']);
      expect(invokeCoreBootstrap).toHaveBeenCalledTimes(1);
      expect(renderBlockPage).not.toHaveBeenCalled();
    }
  });

  it('PROD: an incompatible remote is SKIPPED (disabled placeholder), the app still boots', async () => {
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const {
      deps,
      registered,
      loadedScopes,
      renderBlockPage,
      invokeCoreBootstrap,
    } = enforcementDeps(compatRegistry(CORE_INCOMPAT_META));

    await bootstrapMfe({
      registryUrl: REGISTRY_URL,
      sharedDepsUrl: SHARED_DEPS_URL,
      host: HOST,
      compatPolicy: PROD,
      deps,
    });

    // Only `good` is loaded; `bad` is NOT fetched as a remote.
    expect(loadedScopes).toEqual(['good']);
    // `bad` is registered as an INERT disabled placeholder so plugin_reader resolves it.
    expect(registered.has('bad')).toBe(true);
    const disabled = registered.get('bad')!();
    expect(typeof disabled.plugin).toBe('function');
    // The app boots and a clear reason is logged.
    expect(invokeCoreBootstrap).toHaveBeenCalledTimes(1);
    expect(renderBlockPage).not.toHaveBeenCalled();
    expect(consoleWarn).toHaveBeenCalled();
    expect(consoleWarn.mock.calls.some((c) => String(c[0]).includes('bad'))).toBe(true);

    consoleWarn.mockRestore();
  });

  it('NON-PROD: an incompatible remote HARD-BLOCKS the page and core does NOT boot', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const { deps, renderBlockPage, invokeCoreBootstrap } = enforcementDeps(
      compatRegistry(CORE_INCOMPAT_META)
    );

    await bootstrapMfe({
      registryUrl: REGISTRY_URL,
      sharedDepsUrl: SHARED_DEPS_URL,
      host: HOST,
      compatPolicy: NON_PROD,
      deps,
    });

    // The page is blocked: block page rendered with the offender, core NOT booted.
    expect(renderBlockPage).toHaveBeenCalledTimes(1);
    const offenders = renderBlockPage.mock.calls[0][0] as Array<{ id: string }>;
    expect(offenders.map((o) => o.id)).toEqual(['bad']);
    expect(invokeCoreBootstrap).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('UNKNOWN metadata: prod skips it; non-prod warn-loads it', async () => {
    // PROD: unknown is skipped.
    {
      const { deps, registered, loadedScopes, invokeCoreBootstrap } = enforcementDeps(
        compatRegistry({})
      );
      await bootstrapMfe({
        registryUrl: REGISTRY_URL,
        sharedDepsUrl: SHARED_DEPS_URL,
        host: HOST,
        compatPolicy: PROD,
        deps,
      });
      expect(loadedScopes).toEqual(['good']);
      expect(registered.has('bad')).toBe(true);
      expect(invokeCoreBootstrap).toHaveBeenCalledTimes(1);
    }
    // NON-PROD: unknown warn-loads (the remote is actually loaded).
    {
      const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      const { deps, loadedScopes, renderBlockPage, invokeCoreBootstrap } = enforcementDeps(
        compatRegistry({})
      );
      await bootstrapMfe({
        registryUrl: REGISTRY_URL,
        sharedDepsUrl: SHARED_DEPS_URL,
        host: HOST,
        compatPolicy: NON_PROD,
        deps,
      });
      expect(loadedScopes.sort()).toEqual(['bad', 'good']);
      expect(renderBlockPage).not.toHaveBeenCalled();
      expect(invokeCoreBootstrap).toHaveBeenCalledTimes(1);
      expect(consoleWarn.mock.calls.some((c) => String(c[0]).includes('bad'))).toBe(true);
      consoleWarn.mockRestore();
    }
  });

  it('strictShared=false: a shared-ONLY mismatch is tolerated and loaded (non-prod)', async () => {
    const { deps, loadedScopes, renderBlockPage, invokeCoreBootstrap } = enforcementDeps(
      compatRegistry(SHARED_INCOMPAT_META)
    );

    await bootstrapMfe({
      registryUrl: REGISTRY_URL,
      sharedDepsUrl: SHARED_DEPS_URL,
      host: HOST,
      compatPolicy: { ...NON_PROD, strictShared: false },
      deps,
    });

    // With strict shared OFF, the shared-only mismatch loads instead of blocking.
    expect(loadedScopes.sort()).toEqual(['bad', 'good']);
    expect(renderBlockPage).not.toHaveBeenCalled();
    expect(invokeCoreBootstrap).toHaveBeenCalledTimes(1);
  });

  it('no host/policy injected: enforcement is disabled and every remote loads (back-compat)', async () => {
    const { deps, loadedScopes, invokeCoreBootstrap } = enforcementDeps(
      compatRegistry(CORE_INCOMPAT_META)
    );

    // Neither host nor compatPolicy => classifier is not consulted.
    await bootstrapMfe({
      registryUrl: REGISTRY_URL,
      sharedDepsUrl: SHARED_DEPS_URL,
      deps,
    });

    expect(loadedScopes.sort()).toEqual(['bad', 'good']);
    expect(invokeCoreBootstrap).toHaveBeenCalledTimes(1);
  });
});

describe('bootstrapMfe — remoteEntry SRI enforcement (Phase 12, Story 2)', () => {
  const HOST = {
    osdVersion: '3.5.0',
    sharedDeps: { react: '^16.14.0', 'react-dom': '^16.14.0' },
  };
  const NON_PROD = {
    onIncompatible: 'block' as const,
    onMissing: 'warn-load' as const,
    strictShared: true,
  };
  const PROD = {
    onIncompatible: 'skip' as const,
    onMissing: 'skip' as const,
    strictShared: true,
  };
  // Compatible metadata so both remotes reach the LOAD step (the SRI failure we
  // are exercising happens at load time, not during compat classification).
  const COMPAT_META = {
    builtAgainst: {
      osdVersion: '3.5.0',
      sharedDeps: { react: '^16.14.0', 'react-dom': '^16.14.0' },
    },
    compat: { minCoreVersion: '3.5.0', compatibleCoreRange: '3.5.x' },
  };

  const INSPECTOR_INTEGRITY = 'sha384-INSPECTOR';
  const DATA_INTEGRITY = 'sha384-DATA';

  /** A registry whose entries carry an `integrity` hash (the Story 1 output). */
  function registryWithIntegrity() {
    return {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      sharedDeps: { url: 'http://localhost:8080/shared-deps/', version: '3.5.0' },
      mfes: {
        inspector: {
          version: '3.5.0+aaa',
          remoteEntry: 'http://localhost:8080/mfe/inspector/remoteEntry.js',
          scope: 'inspector',
          module: './public',
          integrity: INSPECTOR_INTEGRITY,
          ...COMPAT_META,
        },
        data: {
          version: '3.5.0+bbb',
          remoteEntry: 'http://localhost:8080/mfe/data/remoteEntry.js',
          scope: 'data',
          module: './public',
          integrity: DATA_INTEGRITY,
          ...COMPAT_META,
        },
      },
    };
  }

  /**
   * Deps that record the (remoteEntry, scope, integrity) triples passed to
   * loadRemoteContainer, and (optionally) make one scope throw to simulate a
   * browser-rejected (SRI mismatch / unavailable) remoteEntry.
   */
  function sriDeps(failingScope?: string) {
    const integrityByScope = new Map<string, string | undefined>();
    const registered = new Map<string, () => PluginPublicModule>();
    const loadedScopes: string[] = [];
    const renderBlockPage = jest.fn();
    const invokeCoreBootstrap = jest.fn(async () => undefined);
    const deps: Partial<BootstrapMfeDeps> = {
      loadScript: jest.fn(async (url: string) => {
        if (url === SHARED_DEPS_URL) {
          testWindow().__osdSharedDeps__ = { React: { version: '16.14.0' } };
        }
      }),
      fetchImpl: ((async () => ({
        ok: true,
        status: 200,
        json: async () => registryWithIntegrity(),
      })) as unknown) as typeof fetch,
      loadRemoteContainer: jest.fn(
        async (_remoteEntry: string, scope: string, integrity?: string) => {
          integrityByScope.set(scope, integrity);
          if (scope === failingScope) {
            // The browser refused to execute the script (SRI mismatch).
            throw new Error(
              `Subresource Integrity check failed or the script could not be fetched`
            );
          }
          loadedScopes.push(scope);
          return {
            init: () => undefined,
            get: () => Promise.resolve(() => ({ plugin: () => undefined })),
          } as MfeContainer;
        }
      ),
      getRemoteModuleFactory: jest.fn(async () => () => ({ plugin: () => undefined })),
      registerPluginFactory: jest.fn((id: string, factory: () => PluginPublicModule) => {
        registered.set(id, factory);
      }),
      invokeCoreBootstrap,
      renderBlockPage,
      mountInspector: jest.fn(),
    };
    return {
      deps,
      integrityByScope,
      registered,
      loadedScopes,
      renderBlockPage,
      invokeCoreBootstrap,
    };
  }

  it('passes the registry integrity to loadRemoteContainer for each remote', async () => {
    const { deps, integrityByScope } = sriDeps();

    await bootstrapMfe({
      registryUrl: REGISTRY_URL,
      sharedDepsUrl: SHARED_DEPS_URL,
      host: HOST,
      compatPolicy: PROD,
      deps,
    });

    expect(integrityByScope.get('inspector')).toBe(INSPECTOR_INTEGRITY);
    expect(integrityByScope.get('data')).toBe(DATA_INTEGRITY);
  });

  it('drops integrity (undefined) for an overridden remote, since its bytes differ', async () => {
    const { deps, integrityByScope } = sriDeps();

    await bootstrapMfe({
      registryUrl: REGISTRY_URL,
      sharedDepsUrl: SHARED_DEPS_URL,
      host: HOST,
      compatPolicy: PROD,
      allowOverride: true,
      deps: {
        ...deps,
        readOverrideSearch: () =>
          '?mfe.inspector=http://localhost:5601/mfe/inspector/remoteEntry.js',
        readOverrideStorage: () => undefined,
      },
    });

    // Overridden remote loads WITHOUT integrity; the non-overridden one keeps it.
    expect(integrityByScope.get('inspector')).toBeUndefined();
    expect(integrityByScope.get('data')).toBe(DATA_INTEGRITY);
  });

  it('DEV (block): a tampered/failed integrity remote HARD-BLOCKS and core does NOT boot', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const { deps, renderBlockPage, invokeCoreBootstrap, registered } = sriDeps('inspector');

    await bootstrapMfe({
      registryUrl: REGISTRY_URL,
      sharedDepsUrl: SHARED_DEPS_URL,
      host: HOST,
      compatPolicy: NON_PROD,
      deps,
    });

    // The integrity failure routes through the SAME hard-block surface as a
    // version incompatibility: offender listed, core NOT booted, no placeholder.
    expect(renderBlockPage).toHaveBeenCalledTimes(1);
    const offenders = renderBlockPage.mock.calls[0][0] as Array<{ id: string; reasons: string[] }>;
    expect(offenders.map((o) => o.id)).toEqual(['inspector']);
    expect(offenders[0].reasons.join(' ')).toMatch(/Subresource Integrity/);
    expect(invokeCoreBootstrap).not.toHaveBeenCalled();
    // It must NOT be registered as a disabled placeholder (the app never starts).
    expect(registered.has('inspector')).toBe(false);
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('PROD (skip): a tampered/failed integrity remote is DISABLED and the app still boots', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { deps, registered, loadedScopes, renderBlockPage, invokeCoreBootstrap } = sriDeps(
      'inspector'
    );

    await bootstrapMfe({
      registryUrl: REGISTRY_URL,
      sharedDepsUrl: SHARED_DEPS_URL,
      host: HOST,
      compatPolicy: PROD,
      deps,
    });

    // Prod degrades gracefully: the failed remote is a disabled placeholder, the
    // healthy one loads, the app boots, and nothing hard-blocks.
    expect(renderBlockPage).not.toHaveBeenCalled();
    expect(loadedScopes).toEqual(['data']);
    expect(registered.has('inspector')).toBe(true);
    const disabled = registered.get('inspector')!();
    expect(typeof disabled.plugin).toBe('function');
    expect(invokeCoreBootstrap).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
    consoleWarn.mockRestore();
  });

  it('a NON-integrity remote failure stays graceful (Phase 4) even under DEV block policy', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    // Registry WITHOUT integrity on the failing entry (e.g. an override-style or
    // pre-Story-1 entry): a load failure cannot be an SRI violation, so it must
    // keep Phase 4 graceful degradation rather than hard-blocking.
    const registered = new Map<string, () => PluginPublicModule>();
    const renderBlockPage = jest.fn();
    const invokeCoreBootstrap = jest.fn(async () => undefined);
    const deps: Partial<BootstrapMfeDeps> = {
      loadScript: jest.fn(async (url: string) => {
        if (url === SHARED_DEPS_URL) {
          testWindow().__osdSharedDeps__ = { React: { version: '16.14.0' } };
        }
      }),
      fetchImpl: ((async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          schemaVersion: 1,
          generatedAt: new Date().toISOString(),
          sharedDeps: { url: 'http://localhost:8080/shared-deps/', version: '3.5.0' },
          mfes: {
            inspector: {
              version: '3.5.0+aaa',
              remoteEntry: 'http://localhost:8080/mfe/inspector/remoteEntry.js',
              scope: 'inspector',
              module: './public',
              ...COMPAT_META,
            },
            data: {
              version: '3.5.0+bbb',
              remoteEntry: 'http://localhost:8080/mfe/data/remoteEntry.js',
              scope: 'data',
              module: './public',
              ...COMPAT_META,
            },
          },
        }),
      })) as unknown) as typeof fetch,
      loadRemoteContainer: jest.fn(async (_remoteEntry: string, scope: string) => {
        if (scope === 'inspector') {
          throw new Error('network error');
        }
        return {
          init: () => undefined,
          get: () => Promise.resolve(() => ({ plugin: () => undefined })),
        } as MfeContainer;
      }),
      getRemoteModuleFactory: jest.fn(async () => () => ({ plugin: () => undefined })),
      registerPluginFactory: jest.fn((id: string, factory: () => PluginPublicModule) => {
        registered.set(id, factory);
      }),
      invokeCoreBootstrap,
      renderBlockPage,
      mountInspector: jest.fn(),
    };

    await bootstrapMfe({
      registryUrl: REGISTRY_URL,
      sharedDepsUrl: SHARED_DEPS_URL,
      host: HOST,
      compatPolicy: NON_PROD,
      deps,
    });

    // No integrity claim => no hard block; the failed remote is disabled and the
    // app still boots (Phase 4 graceful degradation preserved).
    expect(renderBlockPage).not.toHaveBeenCalled();
    expect(registered.has('inspector')).toBe(true);
    expect(invokeCoreBootstrap).toHaveBeenCalledTimes(1);

    consoleError.mockRestore();
    consoleWarn.mockRestore();
  });
});

describe('bootstrapMfe — registry signature verification (Phase 12, Story 4)', () => {
  const VERIFICATION = {
    algorithm: 'HMAC-SHA256',
    keyId: 'mfe-dev-hmac-1',
    key: 'server-held-secret',
  };
  const BLOCK_POLICY = {
    onIncompatible: 'block' as const,
    onMissing: 'warn-load' as const,
    strictShared: true,
  };
  const SKIP_POLICY = {
    onIncompatible: 'skip' as const,
    onMissing: 'skip' as const,
    strictShared: true,
  };

  /** Build standard happy-path deps plus injectable signature/block spies. */
  function makeDeps(
    over: Partial<BootstrapMfeDeps> = {}
  ): {
    deps: Partial<BootstrapMfeDeps>;
    registered: Set<string>;
  } {
    const registered = new Set<string>();
    const deps: Partial<BootstrapMfeDeps> = {
      loadScript: jest.fn(async (url: string) => {
        if (url === SHARED_DEPS_URL) {
          testWindow().__osdSharedDeps__ = { React: { version: '16.14.0' } };
        }
      }),
      fetchImpl: ((async () => ({
        ok: true,
        status: 200,
        json: async () => validRegistry(),
      })) as unknown) as typeof fetch,
      loadRemoteContainer: jest.fn(async () => ({
        init: () => undefined,
        get: () => Promise.resolve(() => ({ plugin: () => undefined })),
      })),
      getRemoteModuleFactory: jest.fn(async () => () => ({ plugin: () => undefined })),
      registerPluginFactory: jest.fn((id: string) => {
        registered.add(id);
      }),
      invokeCoreBootstrap: jest.fn(async () => undefined),
      renderBlockPage: jest.fn(),
      ...over,
    };
    return { deps, registered };
  }

  it('does NOT verify when no verification key is injected (signing off / backward compat)', async () => {
    const verify = jest.fn(async () => ({ ok: true }));
    const { deps } = makeDeps({ verifyRegistrySignature: verify });

    await bootstrapMfe({ registryUrl: REGISTRY_URL, sharedDepsUrl: SHARED_DEPS_URL, deps });

    expect(verify).not.toHaveBeenCalled();
    expect(deps.loadRemoteContainer).toHaveBeenCalled();
    expect(deps.invokeCoreBootstrap).toHaveBeenCalledTimes(1);
  });

  it('VALID signature: verifies once and boots normally (no false reject)', async () => {
    const verify = jest.fn(async () => ({ ok: true }));
    const { deps, registered } = makeDeps({ verifyRegistrySignature: verify });

    await bootstrapMfe({
      registryUrl: REGISTRY_URL,
      sharedDepsUrl: SHARED_DEPS_URL,
      registryVerification: VERIFICATION,
      deps,
    });

    expect(verify).toHaveBeenCalledTimes(1);
    expect(deps.renderBlockPage).not.toHaveBeenCalled();
    expect(registered.has('inspector')).toBe(true);
    expect(registered.has('data')).toBe(true);
    expect(deps.loadRemoteContainer).toHaveBeenCalled();
    expect(deps.invokeCoreBootstrap).toHaveBeenCalledTimes(1);
  });

  it('INVALID signature + block policy: renders the block page and does NOT boot core or load remotes', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const verify = jest.fn(async () => ({ ok: false, reason: 'signature does not match' }));
    const { deps } = makeDeps({ verifyRegistrySignature: verify });

    await bootstrapMfe({
      registryUrl: REGISTRY_URL,
      sharedDepsUrl: SHARED_DEPS_URL,
      compatPolicy: BLOCK_POLICY,
      registryVerification: VERIFICATION,
      deps,
    });

    expect(verify).toHaveBeenCalledTimes(1);
    expect(deps.renderBlockPage).toHaveBeenCalledTimes(1);
    const offenders = (deps.renderBlockPage as jest.Mock).mock.calls[0][0];
    expect(offenders[0].id).toBe('registry');
    expect(offenders[0].reasons[0]).toMatch(/signature verification failed/i);
    // Fail-closed: never loaded a remote, never booted core.
    expect(deps.loadRemoteContainer).not.toHaveBeenCalled();
    expect(deps.invokeCoreBootstrap).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('INVALID signature + skip policy: disables EVERY advertised plugin, boots the shell, loads NO remote', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const verify = jest.fn(async () => ({ ok: false, reason: 'registry has no signature' }));
    const { deps, registered } = makeDeps({ verifyRegistrySignature: verify });

    await bootstrapMfe({
      registryUrl: REGISTRY_URL,
      sharedDepsUrl: SHARED_DEPS_URL,
      compatPolicy: SKIP_POLICY,
      registryVerification: VERIFICATION,
      deps,
    });

    expect(verify).toHaveBeenCalledTimes(1);
    expect(deps.renderBlockPage).not.toHaveBeenCalled();
    // Every advertised plugin disabled; no remote bytes loaded; shell still boots.
    expect(registered.has('inspector')).toBe(true);
    expect(registered.has('data')).toBe(true);
    expect(deps.loadRemoteContainer).not.toHaveBeenCalled();
    expect(deps.invokeCoreBootstrap).toHaveBeenCalledTimes(1);

    consoleError.mockRestore();
    consoleWarn.mockRestore();
  });

  it('verification key present but empty string => treated as OFF (no verify call)', async () => {
    const verify = jest.fn(async () => ({ ok: true }));
    const { deps } = makeDeps({ verifyRegistrySignature: verify });

    await bootstrapMfe({
      registryUrl: REGISTRY_URL,
      sharedDepsUrl: SHARED_DEPS_URL,
      registryVerification: { ...VERIFICATION, key: '' },
      deps,
    });

    expect(verify).not.toHaveBeenCalled();
    expect(deps.invokeCoreBootstrap).toHaveBeenCalledTimes(1);
  });
});

describe('bootstrapMfe — server-resolved bootManifest (Phase 13, Story 3)', () => {
  /** Shared minimal manifest used in this describe. */
  function bootManifest(): import('../registry/boot_manifest').BootManifest {
    return {
      sharedDeps: { url: 'http://localhost:8080/shared-deps/', version: '3.5.0' },
      mfes: [
        {
          id: 'inspector',
          remoteEntry: 'http://localhost:8080/mfe/inspector/v_canary/remoteEntry.js',
          scope: 'inspector',
          module: './public',
          version: '3.5.0+canary',
          integrity: 'sha384-canary',
        },
        {
          id: 'data',
          remoteEntry: 'http://localhost:8080/mfe/data/default/remoteEntry.js',
          scope: 'data',
          module: './public',
          version: '3.5.0+default',
        },
      ],
    };
  }

  function makeFakeDeps(): {
    deps: Partial<BootstrapMfeDeps>;
    fetchImpl: jest.Mock;
    loadedUrls: string[];
    registered: Set<string>;
  } {
    const fetchImpl = jest.fn();
    const loadedUrls: string[] = [];
    const registered = new Set<string>();

    const fakeContainer: MfeContainer = {
      init: () => undefined,
      get: () => Promise.resolve(() => ({ plugin: () => undefined })),
    };

    const deps: Partial<BootstrapMfeDeps> = {
      loadScript: jest.fn(async (url: string) => {
        if (url === SHARED_DEPS_URL) {
          testWindow().__osdSharedDeps__ = {
            React: { version: '16.14.0' },
            ReactDom: { version: '16.14.0' },
            Lodash: { VERSION: '4.17.21' },
          };
        }
      }),
      fetchImpl: (fetchImpl as unknown) as typeof fetch,
      loadRemoteContainer: jest.fn(async (url: string) => {
        loadedUrls.push(url);
        return fakeContainer;
      }),
      getRemoteModuleFactory: jest.fn(async () => () => ({ plugin: () => undefined })),
      registerPluginFactory: jest.fn((id: string) => {
        registered.add(id);
      }),
      invokeCoreBootstrap: jest.fn(async () => undefined),
    };

    return { deps, fetchImpl, loadedUrls, registered };
  }

  it('makes ZERO registry HTTP fetches when a bootManifest is injected (case G)', async () => {
    const { deps, fetchImpl, loadedUrls } = makeFakeDeps();

    await bootstrapMfe({
      registryUrl: REGISTRY_URL,
      bootManifest: bootManifest(),
      sharedDepsUrl: SHARED_DEPS_URL,
      deps,
    });

    // The fetch impl is the only path that would touch /registry; it must NEVER
    // fire when the manifest is injected. (verify_phase13 case G asserts the same
    // in real Chromium via the network log.)
    expect(fetchImpl).not.toHaveBeenCalled();
    // Every manifest entry was loaded from its remoteEntry URL.
    expect(loadedUrls.sort()).toEqual([
      'http://localhost:8080/mfe/data/default/remoteEntry.js',
      'http://localhost:8080/mfe/inspector/v_canary/remoteEntry.js',
    ]);
  });

  it('passes manifest integrity through to loadRemoteContainer', async () => {
    const { deps } = makeFakeDeps();

    await bootstrapMfe({
      registryUrl: REGISTRY_URL,
      bootManifest: bootManifest(),
      sharedDepsUrl: SHARED_DEPS_URL,
      deps,
    });

    const calls = (deps.loadRemoteContainer as jest.Mock).mock.calls;
    const inspectorCall = calls.find(
      (c) => c[0] === 'http://localhost:8080/mfe/inspector/v_canary/remoteEntry.js'
    );
    const dataCall = calls.find(
      (c) => c[0] === 'http://localhost:8080/mfe/data/default/remoteEntry.js'
    );
    expect(inspectorCall![2]).toBe('sha384-canary');
    // No integrity on the `data` entry => undefined passed through.
    expect(dataCall![2]).toBeUndefined();
  });

  it('boots core after registering EVERY manifest plugin', async () => {
    const { deps, registered } = makeFakeDeps();

    await bootstrapMfe({
      registryUrl: REGISTRY_URL,
      bootManifest: bootManifest(),
      sharedDepsUrl: SHARED_DEPS_URL,
      deps,
    });

    expect(registered.has('inspector')).toBe(true);
    expect(registered.has('data')).toBe(true);
    expect(deps.invokeCoreBootstrap).toHaveBeenCalledTimes(1);
  });

  it('throws on a malformed injected manifest (descriptive error)', async () => {
    const { deps } = makeFakeDeps();
    // Strip a required field — assertValidBootManifest should reject it with a
    // path-prefixed error rather than letting bootstrap fall through to a
    // confusing TypeError on undefined.scope.
    const bad = bootManifest();
    (bad.mfes[0] as { scope?: string }).scope = '';

    await expect(
      bootstrapMfe({
        registryUrl: REGISTRY_URL,
        bootManifest: bad,
        sharedDepsUrl: SHARED_DEPS_URL,
        deps,
      })
    ).rejects.toThrow(/Invalid MFE boot manifest/);
  });

  it('SKIPS registry signature verification when a bootManifest is present (Phase 13 trust moved server-side)', async () => {
    const { deps } = makeFakeDeps();
    const verify = jest.fn(async () => ({ ok: true }));

    await bootstrapMfe({
      registryUrl: REGISTRY_URL,
      bootManifest: bootManifest(),
      sharedDepsUrl: SHARED_DEPS_URL,
      registryVerification: { algorithm: 'HMAC-SHA256', keyId: 'k', key: 'secret' },
      deps: { ...deps, verifyRegistrySignature: verify },
    });

    // The signature path is for the legacy fetched-bytes path; the manifest is
    // already-resolved-by-the-trusted-OSD-origin and carries no signature.
    expect(verify).not.toHaveBeenCalled();
    expect(deps.invokeCoreBootstrap).toHaveBeenCalledTimes(1);
  });

  it('Phase 9 compat classifier still runs against manifest entries (defense in depth)', async () => {
    const { deps } = makeFakeDeps();

    // The boot manifest entries deliberately omit `builtAgainst` (PRD shape:
    // the manifest carries only what the loader needs — the resolver already
    // pre-filtered server-side). The browser classifier therefore returns
    // `unknown` for every manifest entry; under prod's onMissing:`skip` the
    // entry is registered as a DISABLED placeholder and the remote is not
    // loaded — exactly the defense-in-depth behaviour the story calls for.
    await bootstrapMfe({
      registryUrl: REGISTRY_URL,
      bootManifest: bootManifest(),
      sharedDepsUrl: SHARED_DEPS_URL,
      host: {
        osdVersion: '3.5.0',
        sharedDeps: { react: '16.14.0', 'react-dom': '16.14.0' },
      },
      // Prod policy: skip incompatible AND skip missing-metadata.
      compatPolicy: {
        onIncompatible: 'skip',
        onMissing: 'skip',
        strictShared: true,
      },
      deps,
    });

    // Both manifest entries are missing `builtAgainst` => classifier returns
    // `unknown` => onMissing:`skip` => no remote container is loaded.
    expect(deps.loadRemoteContainer).not.toHaveBeenCalled();
    // But every advertised id is still registered (as DISABLED placeholder)
    // so plugin_reader resolves it.
    expect(deps.registerPluginFactory).toHaveBeenCalledTimes(2);
    expect(deps.invokeCoreBootstrap).toHaveBeenCalledTimes(1);
  });

  it('warn-load policy: unknown manifest entries still load (no metadata in manifest)', async () => {
    const { deps } = makeFakeDeps();

    await bootstrapMfe({
      registryUrl: REGISTRY_URL,
      bootManifest: bootManifest(),
      sharedDepsUrl: SHARED_DEPS_URL,
      host: {
        osdVersion: '3.5.0',
        sharedDeps: { react: '16.14.0', 'react-dom': '16.14.0' },
      },
      // Non-prod default: warn-load on missing metadata.
      compatPolicy: {
        onIncompatible: 'block',
        onMissing: 'warn-load',
        strictShared: true,
      },
      deps,
    });

    // Both entries load (warn-load tolerates missing metadata).
    expect(deps.loadRemoteContainer).toHaveBeenCalledTimes(2);
  });
});

describe('bootstrapMfe — load telemetry (Phase 14, Story 1)', () => {
  // Build a configurable, ordered fake clock so durationMs assertions are
  // deterministic. Each call advances the clock by `step` ms.
  function fakeClock(start = 1000, step = 5) {
    let t = start;
    return jest.fn(() => {
      const v = t;
      t += step;
      return v;
    });
  }

  function makeRecorder() {
    const events: Array<{
      id: string;
      version: string;
      status: 'success' | 'failure' | 'skipped';
      durationMs: number;
      errorClass?: string;
    }> = [];
    const dispatcher = { emit: jest.fn((e: any) => events.push(e)) };
    return { events, dispatcher };
  }

  function fakeContainer(): MfeContainer {
    return {
      init: () => undefined,
      get: () => Promise.resolve(() => ({ plugin: () => undefined })),
    };
  }

  it('emits one success event per loaded remote with id+version, durationMs>=0', async () => {
    const { events, dispatcher } = makeRecorder();
    const createDispatcher = jest.fn(() => dispatcher);
    const now = fakeClock();

    const deps: Partial<BootstrapMfeDeps> = {
      loadScript: jest.fn(async (url: string) => {
        if (url === SHARED_DEPS_URL) {
          testWindow().__osdSharedDeps__ = { React: { version: '16.14.0' } };
        }
      }),
      fetchImpl: ((async () => ({
        ok: true,
        status: 200,
        json: async () => validRegistry(),
      })) as unknown) as typeof fetch,
      loadRemoteContainer: jest.fn(async () => fakeContainer()),
      getRemoteModuleFactory: jest.fn(async () => () => ({ plugin: () => undefined })),
      registerPluginFactory: jest.fn(),
      invokeCoreBootstrap: jest.fn(async () => undefined),
      createTelemetryDispatcher: createDispatcher,
      now,
    };

    await bootstrapMfe({
      registryUrl: REGISTRY_URL,
      sharedDepsUrl: SHARED_DEPS_URL,
      telemetryEndpoint: 'http://telemetry/sink',
      bucket: 17,
      customerId: 'acme',
      deps,
    });

    // Dispatcher built with the right dimensions (proves bucket+customerId
    // came from injected options, not a default).
    expect(createDispatcher).toHaveBeenCalledTimes(1);
    expect(createDispatcher).toHaveBeenCalledWith({
      endpoint: 'http://telemetry/sink',
      bucket: 17,
      customerId: 'acme',
    });

    // One success event per remote in validRegistry().
    const successes = events.filter((e) => e.status === 'success');
    expect(successes).toHaveLength(2);
    const ids = successes.map((e) => e.id).sort();
    expect(ids).toEqual(['data', 'inspector']);
    for (const ev of successes) {
      expect(ev.version).toMatch(/^3\.5\.0\+/);
      expect(typeof ev.durationMs).toBe('number');
      expect(ev.durationMs).toBeGreaterThanOrEqual(0);
      expect((ev as any).errorClass).toBeUndefined();
    }
  });

  it('classifies an integrity-bearing remoteEntry load failure as sri-mismatch', async () => {
    const { events, dispatcher } = makeRecorder();
    const reg = validRegistry();
    (reg.mfes.inspector as { integrity?: string }).integrity = 'sha384-aaa';

    const deps: Partial<BootstrapMfeDeps> = {
      loadScript: jest.fn(async (url: string) => {
        if (url === SHARED_DEPS_URL) {
          testWindow().__osdSharedDeps__ = { React: { version: '16.14.0' } };
        }
      }),
      fetchImpl: ((async () => ({
        ok: true,
        status: 200,
        json: async () => reg,
      })) as unknown) as typeof fetch,
      loadRemoteContainer: jest.fn(async (url: string, _scope: string, integrity?: string) => {
        if (integrity) {
          throw new Error(
            `Failed to load script: ${url} (Subresource Integrity check failed or the script could not be fetched)`
          );
        }
        return fakeContainer();
      }),
      getRemoteModuleFactory: jest.fn(async () => () => ({ plugin: () => undefined })),
      registerPluginFactory: jest.fn(),
      invokeCoreBootstrap: jest.fn(async () => undefined),
      createTelemetryDispatcher: jest.fn(() => dispatcher),
      now: fakeClock(),
      // Prod skip so the SRI failure does not hard-block the test.
    };

    await bootstrapMfe({
      registryUrl: REGISTRY_URL,
      sharedDepsUrl: SHARED_DEPS_URL,
      telemetryEndpoint: 'http://t/sink',
      bucket: 0,
      customerId: 'default',
      compatPolicy: { onIncompatible: 'skip', onMissing: 'skip', strictShared: true },
      deps,
    });

    const failures = events.filter((e) => e.status === 'failure');
    const sri = failures.find((e) => e.id === 'inspector');
    expect(sri).toBeDefined();
    expect(sri!.errorClass).toBe('sri-mismatch');
    // The other remote loaded fine (Phase 4 invariant): a success event for `data`.
    expect(events.find((e) => e.id === 'data' && e.status === 'success')).toBeDefined();
  });

  it('classifies a non-integrity load failure as network', async () => {
    const { events, dispatcher } = makeRecorder();
    const reg = validRegistry(); // no integrity hashes

    const deps: Partial<BootstrapMfeDeps> = {
      loadScript: jest.fn(async (url: string) => {
        if (url === SHARED_DEPS_URL) {
          testWindow().__osdSharedDeps__ = { React: { version: '16.14.0' } };
        }
      }),
      fetchImpl: ((async () => ({
        ok: true,
        status: 200,
        json: async () => reg,
      })) as unknown) as typeof fetch,
      loadRemoteContainer: jest.fn(async (url: string, scope: string) => {
        if (scope === 'inspector') {
          throw new Error(`Failed to load script: ${url}`);
        }
        return fakeContainer();
      }),
      getRemoteModuleFactory: jest.fn(async () => () => ({ plugin: () => undefined })),
      registerPluginFactory: jest.fn(),
      invokeCoreBootstrap: jest.fn(async () => undefined),
      createTelemetryDispatcher: jest.fn(() => dispatcher),
      now: fakeClock(),
    };

    await bootstrapMfe({
      registryUrl: REGISTRY_URL,
      sharedDepsUrl: SHARED_DEPS_URL,
      telemetryEndpoint: 'http://t/sink',
      deps,
    });

    const ev = events.find((e) => e.id === 'inspector' && e.status === 'failure');
    expect(ev).toBeDefined();
    expect(ev!.errorClass).toBe('network');
  });

  it('classifies a container/factory error as mf-runtime-error', async () => {
    const { events, dispatcher } = makeRecorder();

    const deps: Partial<BootstrapMfeDeps> = {
      loadScript: jest.fn(async (url: string) => {
        if (url === SHARED_DEPS_URL) {
          testWindow().__osdSharedDeps__ = { React: { version: '16.14.0' } };
        }
      }),
      fetchImpl: ((async () => ({
        ok: true,
        status: 200,
        json: async () => validRegistry(),
      })) as unknown) as typeof fetch,
      loadRemoteContainer: jest.fn(async () => fakeContainer()),
      getRemoteModuleFactory: jest.fn(async (_c: MfeContainer, _s: ShareScope, mod: string) => {
        if (mod === './public') {
          throw new Error('shared module is not available for eager consumption');
        }
        return (() => ({ plugin: () => undefined })) as () => PluginPublicModule;
      }),
      registerPluginFactory: jest.fn(),
      invokeCoreBootstrap: jest.fn(async () => undefined),
      createTelemetryDispatcher: jest.fn(() => dispatcher),
      now: fakeClock(),
    };

    await bootstrapMfe({
      registryUrl: REGISTRY_URL,
      sharedDepsUrl: SHARED_DEPS_URL,
      telemetryEndpoint: 'http://t/sink',
      deps,
    });

    const failures = events.filter((e) => e.status === 'failure');
    expect(failures.length).toBeGreaterThan(0);
    for (const ev of failures) {
      expect(ev.errorClass).toBe('mf-runtime-error');
    }
  });

  it('emits a skipped event with errorClass=compat-reject for compat-skipped remotes', async () => {
    const { events, dispatcher } = makeRecorder();

    const reg = validRegistry();
    // Mark inspector as having an incompatible compat declaration.
    (reg.mfes.inspector as any).compat = {
      minCoreVersion: '99.0.0',
      compatibleCoreRange: '>=99.0.0',
    };
    (reg.mfes.inspector as any).builtAgainst = {
      osdVersion: '99.0.0',
      sharedDeps: { react: '16.14.0', 'react-dom': '16.14.0' },
    };

    const deps: Partial<BootstrapMfeDeps> = {
      loadScript: jest.fn(async (url: string) => {
        if (url === SHARED_DEPS_URL) {
          testWindow().__osdSharedDeps__ = { React: { version: '16.14.0' } };
        }
      }),
      fetchImpl: ((async () => ({
        ok: true,
        status: 200,
        json: async () => reg,
      })) as unknown) as typeof fetch,
      loadRemoteContainer: jest.fn(async () => fakeContainer()),
      getRemoteModuleFactory: jest.fn(async () => () => ({ plugin: () => undefined })),
      registerPluginFactory: jest.fn(),
      invokeCoreBootstrap: jest.fn(async () => undefined),
      createTelemetryDispatcher: jest.fn(() => dispatcher),
      now: fakeClock(),
    };

    await bootstrapMfe({
      registryUrl: REGISTRY_URL,
      sharedDepsUrl: SHARED_DEPS_URL,
      telemetryEndpoint: 'http://t/sink',
      bucket: 5,
      customerId: 'beta',
      host: {
        osdVersion: '3.5.0',
        sharedDeps: { react: '16.14.0', 'react-dom': '16.14.0' },
      },
      // Prod-skip on incompatible; warn-load on missing metadata so the
      // (metadata-less) `data` remote still loads and we can verify the
      // Phase 4 invariant (one failure ≠ blocked boot).
      compatPolicy: { onIncompatible: 'skip', onMissing: 'warn-load', strictShared: true },
      deps,
    });

    const skip = events.find((e) => e.id === 'inspector' && e.status === 'skipped');
    expect(skip).toBeDefined();
    expect(skip!.errorClass).toBe('compat-reject');
    expect(skip!.durationMs).toBe(0);

    // The other remote still loaded — Phase 4 invariant preserved.
    expect(events.find((e) => e.id === 'data' && e.status === 'success')).toBeDefined();
  });

  it('builds a SILENT no-op dispatcher when telemetryEndpoint is unset (default behaviour)', async () => {
    const createDispatcher = jest.fn(
      (cfg: { endpoint?: string; bucket: number; customerId: string }) => {
        // Mirror the production silent-no-op semantics so the test exercises
        // the same code path the bootstrap exposes.
        if (!cfg.endpoint) {
          return { emit: jest.fn() };
        }
        return { emit: jest.fn() };
      }
    );
    const deps: Partial<BootstrapMfeDeps> = {
      loadScript: jest.fn(async (url: string) => {
        if (url === SHARED_DEPS_URL) {
          testWindow().__osdSharedDeps__ = { React: { version: '16.14.0' } };
        }
      }),
      fetchImpl: ((async () => ({
        ok: true,
        status: 200,
        json: async () => validRegistry(),
      })) as unknown) as typeof fetch,
      loadRemoteContainer: jest.fn(async () => fakeContainer()),
      getRemoteModuleFactory: jest.fn(async () => () => ({ plugin: () => undefined })),
      registerPluginFactory: jest.fn(),
      invokeCoreBootstrap: jest.fn(async () => undefined),
      createTelemetryDispatcher: createDispatcher,
    };

    await bootstrapMfe({
      registryUrl: REGISTRY_URL,
      sharedDepsUrl: SHARED_DEPS_URL,
      // telemetryEndpoint INTENTIONALLY OMITTED.
      deps,
    });

    // Dispatcher is still constructed (the bootstrap doesn't have to know it
    // is a no-op), but the endpoint passed through is undefined.
    expect(createDispatcher).toHaveBeenCalledWith({
      endpoint: undefined,
      bucket: 0,
      customerId: 'default',
    });
  });

  it('a synchronous throw from telemetry.emit() does NOT abort boot (fire-and-forget defense-in-depth)', async () => {
    const explodingDispatcher = {
      emit: jest.fn(() => {
        throw new Error('dispatcher exploded');
      }),
    };

    const deps: Partial<BootstrapMfeDeps> = {
      loadScript: jest.fn(async (url: string) => {
        if (url === SHARED_DEPS_URL) {
          testWindow().__osdSharedDeps__ = { React: { version: '16.14.0' } };
        }
      }),
      fetchImpl: ((async () => ({
        ok: true,
        status: 200,
        json: async () => validRegistry(),
      })) as unknown) as typeof fetch,
      loadRemoteContainer: jest.fn(async () => fakeContainer()),
      getRemoteModuleFactory: jest.fn(async () => () => ({ plugin: () => undefined })),
      registerPluginFactory: jest.fn(),
      invokeCoreBootstrap: jest.fn(async () => undefined),
      createTelemetryDispatcher: jest.fn(() => explodingDispatcher),
    };

    // Boot resolves normally even though every emit() throws synchronously.
    await expect(
      bootstrapMfe({
        registryUrl: REGISTRY_URL,
        sharedDepsUrl: SHARED_DEPS_URL,
        telemetryEndpoint: 'http://t/sink',
        deps,
      })
    ).resolves.toBeUndefined();

    // Core boot still ran.
    expect(deps.invokeCoreBootstrap).toHaveBeenCalledTimes(1);
    // emit was attempted (so we know the swallow happened in the bootstrap).
    expect(explodingDispatcher.emit).toHaveBeenCalled();
  });
});

/* ------------------------------------------------------------------------- *
 * Phase 16 Story 5 — registry-managed OSD core entry (`core.entry.js`).
 *
 * When the server-resolved boot manifest carries a v3 `core` descriptor, the
 * orchestrator must load core.entry.js from THAT URL (with SRI when pinned)
 * BEFORE invoking core boot. A tampered core fails closed: loadScript rejects,
 * bootstrapMfe's Promise rejects, invokeCoreBootstrap is NEVER called, and the
 * chunk-error surface (armed at the start of bootstrapMfe) catches the
 * unhandled rejection.
 *
 * Backward-compat: when `core` is absent, the orchestrator skips this step
 * entirely (the thin shim's preload already loaded core from the legacy
 * server-bundled `${regularBundlePath}/core/core.entry.js` path).
 * ------------------------------------------------------------------------- */

describe('bootstrapMfe — Phase 16 Story 5: registry-managed core', () => {
  const CORE_URL = 'http://localhost:8080/core/cafebabe0000/core.entry.js';
  const CORE_INTEGRITY = 'sha384-coreCDN1234';

  function fakeContainer(): MfeContainer {
    return {
      init: () => undefined,
      get: () => Promise.resolve(() => ({ plugin: () => undefined })),
    };
  }

  it('loads core from the CDN URL with SRI BEFORE invokeCoreBootstrap', async () => {
    const order: string[] = [];
    const deps: Partial<BootstrapMfeDeps> = {
      loadScript: jest.fn(async (url: string, integrity?: string) => {
        if (url === CORE_URL) {
          // Integrity attribute MUST be threaded through — Phase 12 SRI
          // posture extended to core. Without this, a tampered core would
          // execute without verification.
          expect(integrity).toBe(CORE_INTEGRITY);
          order.push(`coreLoaded:${url}`);
        } else if (url === SHARED_DEPS_URL) {
          testWindow().__osdSharedDeps__ = { React: { version: '16.14.0' } };
          order.push('sharedDepsLoaded');
        } else {
          order.push(`other:${url}`);
        }
      }),
      fetchImpl: ((async () => ({
        ok: true,
        status: 200,
        json: async () => validRegistry(),
      })) as unknown) as typeof fetch,
      loadRemoteContainer: jest.fn(async () => fakeContainer()),
      getRemoteModuleFactory: jest.fn(async () => () => ({ plugin: () => undefined })),
      registerPluginFactory: jest.fn(),
      invokeCoreBootstrap: jest.fn(async () => {
        order.push('invokeCoreBootstrap');
      }),
    };

    await bootstrapMfe({
      registryUrl: REGISTRY_URL,
      sharedDepsUrl: SHARED_DEPS_URL,
      core: { url: CORE_URL, integrity: CORE_INTEGRITY },
      deps,
    });

    // Core load happens FIRST (matches the legacy thin-shim ordering — core
    // is registered into __osdBundles__ before sharedDeps loads).
    expect(order[0]).toBe(`coreLoaded:${CORE_URL}`);
    // Core load is BEFORE sharedDeps load.
    expect(order.indexOf(`coreLoaded:${CORE_URL}`)).toBeLessThan(order.indexOf('sharedDepsLoaded'));
    // Core load is BEFORE invokeCoreBootstrap — the locked invariant.
    expect(order.indexOf(`coreLoaded:${CORE_URL}`)).toBeLessThan(
      order.indexOf('invokeCoreBootstrap')
    );
    expect(deps.invokeCoreBootstrap).toHaveBeenCalledTimes(1);
  });

  it('skips the pre-coreBoot CDN load when `core` is absent (v1/v2/v3-without-core path)', async () => {
    const loadedUrls: string[] = [];
    const deps: Partial<BootstrapMfeDeps> = {
      loadScript: jest.fn(async (url: string) => {
        loadedUrls.push(url);
        if (url === SHARED_DEPS_URL) {
          testWindow().__osdSharedDeps__ = { React: { version: '16.14.0' } };
        }
      }),
      fetchImpl: ((async () => ({
        ok: true,
        status: 200,
        json: async () => validRegistry(),
      })) as unknown) as typeof fetch,
      loadRemoteContainer: jest.fn(async () => fakeContainer()),
      getRemoteModuleFactory: jest.fn(async () => () => ({ plugin: () => undefined })),
      registerPluginFactory: jest.fn(),
      invokeCoreBootstrap: jest.fn(async () => undefined),
    };

    await bootstrapMfe({
      registryUrl: REGISTRY_URL,
      sharedDepsUrl: SHARED_DEPS_URL,
      // No `core` option.
      deps,
    });

    // No URL matching the CDN core URL was loaded by the orchestrator — the
    // thin shim's legacy preload is the only loader of core in this path,
    // and that step is OUTSIDE bootstrapMfe (handled in the .hbs template).
    expect(loadedUrls).not.toContain(CORE_URL);
    expect(deps.invokeCoreBootstrap).toHaveBeenCalledTimes(1);
  });

  it('fails closed on SRI mismatch: invokeCoreBootstrap NOT called, telemetry emits sri-mismatch', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const events: Array<{
      id: string;
      version: string;
      status: string;
      durationMs: number;
      errorClass?: string;
    }> = [];
    const dispatcher = { emit: jest.fn((e: any) => events.push(e)) };
    const createDispatcher = jest.fn(() => dispatcher);

    const deps: Partial<BootstrapMfeDeps> = {
      // SRI failure: loadScript rejects with the Phase 12 error message shape.
      loadScript: jest.fn(async (url: string, integrity?: string) => {
        if (url === CORE_URL) {
          throw new Error(
            `Failed to load script: ${url} ` +
              `(Subresource Integrity check failed or the script could not be fetched)`
          );
        }
        if (url === SHARED_DEPS_URL) {
          testWindow().__osdSharedDeps__ = { React: { version: '16.14.0' } };
        }
      }),
      fetchImpl: ((async () => ({
        ok: true,
        status: 200,
        json: async () => validRegistry(),
      })) as unknown) as typeof fetch,
      loadRemoteContainer: jest.fn(async () => fakeContainer()),
      getRemoteModuleFactory: jest.fn(async () => () => ({ plugin: () => undefined })),
      registerPluginFactory: jest.fn(),
      invokeCoreBootstrap: jest.fn(async () => undefined),
      createTelemetryDispatcher: createDispatcher,
    };

    await expect(
      bootstrapMfe({
        registryUrl: REGISTRY_URL,
        sharedDepsUrl: SHARED_DEPS_URL,
        telemetryEndpoint: 'http://t/sink',
        core: { url: CORE_URL, integrity: CORE_INTEGRITY },
        deps,
      })
    ).rejects.toThrow(/Subresource Integrity check failed/);

    // CRITICAL: invokeCoreBootstrap MUST NOT be called when core load fails —
    // the app cannot proceed on tampered core (fail-closed contract).
    expect(deps.invokeCoreBootstrap).not.toHaveBeenCalled();

    // Telemetry: a failure event for id=`core` with errorClass=`sri-mismatch`
    // (integrity was pinned, so the Phase 14 taxonomy collapses tampered +
    // unfetchable bytes into the same fail-closed class).
    const coreEvents = events.filter((e) => e.id === 'core');
    expect(coreEvents.length).toBe(1);
    expect(coreEvents[0].status).toBe('failure');
    expect(coreEvents[0].errorClass).toBe('sri-mismatch');
    expect(coreEvents[0].durationMs).toBeGreaterThanOrEqual(0);

    // The console.error log is loud (operator visibility): mentions core,
    // refuses to invoke, names the URL.
    expect(consoleError).toHaveBeenCalled();
    const msg = consoleError.mock.calls.map((c) => c[0]).join('\n');
    expect(msg).toMatch(/Failed to load OSD core/);
    expect(msg).toMatch(/refusing to invoke core boot/);

    consoleError.mockRestore();
  });

  it('errorClass collapses to `network` when core descriptor has NO integrity (dev fallback)', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const events: Array<{ id: string; status: string; errorClass?: string }> = [];
    const dispatcher = { emit: jest.fn((e: any) => events.push(e)) };

    const deps: Partial<BootstrapMfeDeps> = {
      loadScript: jest.fn(async (url: string) => {
        if (url === CORE_URL) {
          // No integrity attribute — network failure shape (the Phase 12
          // wording branches on whether integrity was claimed).
          throw new Error(`Failed to load script: ${url}`);
        }
        if (url === SHARED_DEPS_URL) {
          testWindow().__osdSharedDeps__ = { React: { version: '16.14.0' } };
        }
      }),
      fetchImpl: ((async () => ({
        ok: true,
        status: 200,
        json: async () => validRegistry(),
      })) as unknown) as typeof fetch,
      loadRemoteContainer: jest.fn(async () => fakeContainer()),
      getRemoteModuleFactory: jest.fn(async () => () => ({ plugin: () => undefined })),
      registerPluginFactory: jest.fn(),
      invokeCoreBootstrap: jest.fn(async () => undefined),
      createTelemetryDispatcher: jest.fn(() => dispatcher),
    };

    await expect(
      bootstrapMfe({
        registryUrl: REGISTRY_URL,
        sharedDepsUrl: SHARED_DEPS_URL,
        telemetryEndpoint: 'http://t/sink',
        // Dev-fallback shape: same-origin URL, no integrity pin.
        core: { url: CORE_URL },
        deps,
      })
    ).rejects.toThrow(/Failed to load script/);

    expect(deps.invokeCoreBootstrap).not.toHaveBeenCalled();
    const coreEvents = events.filter((e) => e.id === 'core');
    expect(coreEvents.length).toBe(1);
    expect(coreEvents[0].errorClass).toBe('network');

    consoleError.mockRestore();
  });

  it('arms the chunk-error surface BEFORE attempting the core load (so an SRI failure is caught)', async () => {
    // Defense-in-depth ordering: installChunkErrorSurface MUST run before the
    // first loadScript call. Otherwise an SRI failure on core would leave the
    // unhandled rejection without a host-side safety net.
    const order: string[] = [];
    const deps: Partial<BootstrapMfeDeps> = {
      installChunkErrorSurface: jest.fn(() => {
        order.push('installChunkErrorSurface');
        return () => undefined;
      }),
      loadScript: jest.fn(async (url: string) => {
        order.push(`loadScript:${url}`);
        if (url === SHARED_DEPS_URL) {
          testWindow().__osdSharedDeps__ = { React: { version: '16.14.0' } };
        }
      }),
      fetchImpl: ((async () => ({
        ok: true,
        status: 200,
        json: async () => validRegistry(),
      })) as unknown) as typeof fetch,
      loadRemoteContainer: jest.fn(async () => fakeContainer()),
      getRemoteModuleFactory: jest.fn(async () => () => ({ plugin: () => undefined })),
      registerPluginFactory: jest.fn(),
      invokeCoreBootstrap: jest.fn(async () => undefined),
    };

    await bootstrapMfe({
      registryUrl: REGISTRY_URL,
      sharedDepsUrl: SHARED_DEPS_URL,
      core: { url: CORE_URL, integrity: CORE_INTEGRITY },
      deps,
    });

    // The surface is installed BEFORE the first loadScript call (which is now
    // the core load, ahead of shared-deps).
    expect(order[0]).toBe('installChunkErrorSurface');
    expect(order[1]).toBe(`loadScript:${CORE_URL}`);
  });
});
