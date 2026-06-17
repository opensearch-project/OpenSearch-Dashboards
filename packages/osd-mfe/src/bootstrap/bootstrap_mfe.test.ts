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
