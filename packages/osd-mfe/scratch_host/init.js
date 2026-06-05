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

/*
 * Scratch Module Federation host bootstrap (browser script, not bundled).
 *
 * The pilot remote is built with consume-only shared singletons (`import: false`
 * in the ModuleFederationPlugin `shared` map — see
 * packages/osd-mfe/src/mfe_shared_deps.ts). That means the remote ships NO copy
 * of react/react-dom/@elastic/eui/etc.; it expects the host to provide them via
 * the Module Federation share scope. This script seeds that share scope from the
 * already-loaded `window.__osdSharedDeps__` globals (exactly the values OSD's
 * existing build externalizes to) and then imports the remote's exposed module.
 *
 * Share-scope entry shape: the embedded @module-federation runtime resolves a
 * shared dependency by reading `entry.lib` / `entry.get()` for the best version
 * key that satisfies the consumer's `requiredVersion`. `get()` must return a
 * factory (`() => moduleExports`) synchronously (the runtime's synchronous
 * resolution path rejects a Promise), so we provide both `lib` (the factory) and
 * a synchronous `get`.
 */

/* eslint-env browser */
/* eslint-disable no-console */

(function bootstrapScratchHost() {
  const statusEl = document.getElementById('status');

  function setStatus(text, kind) {
    if (statusEl) {
      statusEl.textContent = text;
      statusEl.className = kind || '';
    }
  }

  function fail(message, error) {
    const detail = error ? error.stack || error.message || String(error) : '';
    window.__MFE_RESULT__ = {
      ok: false,
      error: message + (detail ? ': ' + detail : ''),
    };
    setStatus('FAILED — ' + message + (detail ? '\n\n' + detail : ''), 'fail');
    console.error('[scratch-host] ' + message, error || '');
  }

  const config = window.__OSD_MFE_HOST_CONFIG__;
  if (!config) {
    fail('window.__OSD_MFE_HOST_CONFIG__ is missing (is /mfe-host-config.js served?)');
    return;
  }
  if (!window.__osdSharedDeps__) {
    fail('window.__osdSharedDeps__ is missing (is /shared-deps/osd-ui-shared-deps.js served?)');
    return;
  }

  const sharedRoots = config.sharedRoots || {};
  const versions = config.versions || {};
  const remote = config.remote || { scope: 'inspector', module: './public' };

  // Build the Module Federation share scope ({ pkgName: { version: entry } })
  // from the OSD shared-deps globals; passed to container.init() below.
  const shareScope = {};
  const seeded = [];
  const missing = [];
  Object.keys(sharedRoots).forEach(function seedOne(pkgName) {
    const globalKey = sharedRoots[pkgName];
    const moduleExports = window.__osdSharedDeps__[globalKey];
    if (typeof moduleExports === 'undefined') {
      missing.push(pkgName + ' (__osdSharedDeps__.' + globalKey + ')');
      return;
    }
    const version = versions[pkgName] || '0.0.0';
    const factory = function moduleFactory() {
      return moduleExports;
    };
    const entry = {};
    entry[version] = {
      // `get` returns the factory synchronously; `lib` is the resolved factory.
      get: function getFactory() {
        return factory;
      },
      lib: factory,
      loaded: 1,
      eager: true,
      from: 'osd-scratch-host',
      version,
      shareConfig: {
        singleton: true,
        requiredVersion: '^' + version,
        eager: true,
        strictVersion: false,
      },
    };
    shareScope[pkgName] = entry;
    seeded.push(pkgName);
  });

  const container = window[remote.scope];
  if (!container || typeof container.get !== 'function') {
    fail('remote container "' + remote.scope + '" not found on window (did remoteEntry.js load?)');
    return;
  }

  Promise.resolve()
    .then(function initContainer() {
      // Initialize the container with our seeded share scope. `init` may be sync
      // or return a promise depending on the runtime; await either way.
      if (typeof container.init === 'function') {
        return container.init(shareScope);
      }
      return undefined;
    })
    .then(function getExposed() {
      return container.get(remote.module);
    })
    .then(function evaluateModule(factory) {
      const exposed = typeof factory === 'function' ? factory() : factory;
      const pluginType = exposed ? typeof exposed.plugin : 'undefined';
      const ok = !!exposed && pluginType === 'function';
      window.__MFE_RESULT__ = {
        ok,
        scope: remote.scope,
        module: remote.module,
        pluginType,
        exports: exposed ? Object.keys(exposed) : [],
        seeded,
        missing,
      };
      if (ok) {
        setStatus(
          [
            'OK — imported "' + remote.scope + remote.module + '"',
            'plugin export: ' + pluginType,
            'exposed keys: ' + Object.keys(exposed).join(', '),
            'shared singletons seeded from __osdSharedDeps__: ' + seeded.length,
          ].join('\n'),
          'ok'
        );
        console.log('[scratch-host] remote loaded; exposed module keys:', Object.keys(exposed));
      } else {
        fail('exposed module loaded but `plugin` export is ' + pluginType);
      }
    })
    .catch(function onError(error) {
      fail('failed to load remote module "' + remote.scope + remote.module + '"', error);
    });
})();
