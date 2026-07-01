/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tiny static file server for the OSD MFE scratch host.
 *
 * Serves three roots plus one generated config endpoint:
 *   /                     -> packages/osd-mfe/scratch_host/index.html
 *   /init.js              -> packages/osd-mfe/scratch_host/init.js
 *   /mfe/<id>/*           -> target/mfe/<id>/*                      (built remotes)
 *   /shared-deps/*        -> packages/osd-ui-shared-deps/target/*   (defines __osdSharedDeps__)
 *   /mfe-host-config.js   -> generated JS that sets window.__OSD_MFE_HOST_CONFIG__
 *
 * The config endpoint derives, from @osd/ui-shared-deps, the map of shared
 * package roots -> their __osdSharedDeps__ global property, plus the installed
 * version of each (read from node_modules). The scratch host uses this to seed
 * the Module Federation share scope. Deriving it here (rather than hardcoding in
 * the committed host) keeps the shared set in lock-step with the actual build.
 *
 * Usage (standalone, for manual browsing):  node packages/osd-mfe/dev/local_asset_server.js [port] [pluginId]
 * Or import { startServer } from this module (used by verify_mfe_scratch.js).
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const WORKSPACE_DIR = process.env.WORKSPACE_DIR || path.resolve(__dirname, '../../..');
const OSD_DIR =
  process.env.OSD_DIR ||
  WORKSPACE_DIR;

const SCRATCH_HOST_DIR = path.join(OSD_DIR, 'packages/osd-mfe/scratch_host');
const MFE_DIR = path.join(OSD_DIR, 'target/mfe');
const SHARED_DEPS_DIR = path.join(OSD_DIR, 'packages/osd-ui-shared-deps/target');
const UI_SHARED_DEPS_INDEX = path.join(OSD_DIR, 'packages/osd-ui-shared-deps/index.js');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.cjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.txt': 'text/plain; charset=utf-8',
};

/** Resolve the package "root" specifier (mirror of packages/osd-mfe/src/mfe_shared_deps.ts). */
function packageRootOf(specifier) {
  if (specifier.startsWith('@')) {
    return specifier.split('/').slice(0, 2).join('/');
  }
  return specifier.split('/')[0];
}

/**
 * Build the host config: shared package roots -> __osdSharedDeps__ global key,
 * and each root's installed version. Derived from @osd/ui-shared-deps externals.
 */
function buildHostConfig(pluginId) {
  // Bust require cache so edits to the externals map are reflected on restart.
  delete require.cache[require.resolve(UI_SHARED_DEPS_INDEX)];
  const uiSharedDeps = require(UI_SHARED_DEPS_INDEX);
  const externals = uiSharedDeps.externals || {};
  const prefix = '__osdSharedDeps__.';

  const sharedRoots = {};
  Object.keys(externals).forEach((specifier) => {
    // Only top-level package roots map cleanly to MF shared singletons; sub-path
    // / JSON specifiers (e.g. @elastic/eui/lib/services) stay as plain externals.
    if (packageRootOf(specifier) !== specifier) {
      return;
    }
    const target = externals[specifier];
    // Only simple `__osdSharedDeps__.X` targets (single property) are seedable.
    if (typeof target === 'string' && target.indexOf(prefix) === 0) {
      const prop = target.slice(prefix.length);
      if (prop && prop.indexOf('.') === -1) {
        sharedRoots[specifier] = prop;
      }
    }
  });

  const versions = {};
  Object.keys(sharedRoots).forEach((pkgName) => {
    try {
      const pkgJson = path.join(OSD_DIR, 'node_modules', pkgName, 'package.json');
      versions[pkgName] = JSON.parse(fs.readFileSync(pkgJson, 'utf8')).version || '0.0.0';
    } catch (e) {
      versions[pkgName] = '0.0.0';
    }
  });

  return {
    // The MF container global is namespaced with `osdMfe_` (see
    // OpenSearch-Dashboards/packages/osd-mfe/src/mfe_rspack_config.ts) so plugin
    // ids cannot collide with browser globals; match that here.
    remote: { scope: `osdMfe_${pluginId}`, module: './public' },
    sharedRoots,
    versions,
  };
}

function send(res, status, body, contentType) {
  res.writeHead(status, {
    'Content-Type': contentType || 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

/** Safely resolve a request path under a root, rejecting traversal escapes. */
function resolveUnder(root, relPath) {
  const resolved = path.normalize(path.join(root, relPath));
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    return null;
  }
  return resolved;
}

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      send(res, 404, 'Not found: ' + filePath);
      return;
    }
    send(res, 200, data, MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream');
  });
}

function createServer(pluginId) {
  const remoteId = pluginId || 'inspector';
  return http.createServer((req, res) => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    } catch (e) {
      send(res, 400, 'Bad request');
      return;
    }

    if (pathname === '/' || pathname === '/index.html') {
      serveFile(res, path.join(SCRATCH_HOST_DIR, 'index.html'));
      return;
    }
    if (pathname === '/init.js') {
      serveFile(res, path.join(SCRATCH_HOST_DIR, 'init.js'));
      return;
    }
    if (pathname === '/favicon.ico') {
      send(res, 204, '');
      return;
    }
    if (pathname === '/mfe-host-config.js') {
      const cfg = buildHostConfig(remoteId);
      const js = 'window.__OSD_MFE_HOST_CONFIG__ = ' + JSON.stringify(cfg) + ';';
      send(res, 200, js, MIME['.js']);
      return;
    }
    if (pathname.startsWith('/mfe/')) {
      const target = resolveUnder(MFE_DIR, pathname.slice('/mfe/'.length));
      if (!target) {
        send(res, 403, 'Forbidden');
        return;
      }
      serveFile(res, target);
      return;
    }
    if (pathname.startsWith('/shared-deps/')) {
      const target = resolveUnder(SHARED_DEPS_DIR, pathname.slice('/shared-deps/'.length));
      if (!target) {
        send(res, 403, 'Forbidden');
        return;
      }
      serveFile(res, target);
      return;
    }

    send(res, 404, 'Not found: ' + pathname);
  });
}

/**
 * Start the static server. Binds to 127.0.0.1 only (local test harness).
 * @returns {Promise<{server: http.Server, port: number, url: string, close: () => Promise<void>}>}
 */
function startServer(options) {
  const opts = options || {};
  const pluginId = opts.pluginId || 'inspector';
  const port = typeof opts.port === 'number' ? opts.port : 0;
  return new Promise((resolve, reject) => {
    const server = createServer(pluginId);
    server.on('error', reject);
    server.listen(port, '127.0.0.1', () => {
      const actualPort = server.address().port;
      resolve({
        server,
        port: actualPort,
        url: 'http://127.0.0.1:' + actualPort,
        close: () =>
          new Promise((res) => {
            server.close(() => res());
          }),
      });
    });
  });
}

module.exports = { startServer, createServer, buildHostConfig };

// Run standalone for manual browsing.
if (require.main === module) {
  const port = Number(process.argv[2]) || 5701;
  const pluginId = process.argv[3] || 'inspector';
  startServer({ port, pluginId })
    .then((s) => {
      // eslint-disable-next-line no-console
      console.log('MFE scratch host server: ' + s.url + '  (remote: ' + pluginId + ')');
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Failed to start server:', err);
      process.exit(1);
    });
}
