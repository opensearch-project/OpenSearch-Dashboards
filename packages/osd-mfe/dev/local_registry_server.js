/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * Standalone MOCK dynamic-registry HTTP service (Phase 2, Story 5).
 *
 * This is a plain node `http` server in the harness — it is intentionally NOT an
 * OSD route. Wiring the registry into OSD's HTML render is Phase 3; keeping the
 * mock decoupled keeps Phase 2 additive. The service mimics the production model
 * from docs/01-MFE-DESIGN.md §5: "the server fetches the registry from a dynamic
 * service at serve time". It does two things:
 *
 *   GET /registry          -> the CURRENT registry JSON, read THROUGH the
 *                             FileRegistryProvider (so it inherits mtime-based
 *                             hot-reload: editing registry.json is reflected on
 *                             the very next request — no restart, no rebuild).
 *   GET /mfe/<id>/<path>   -> the built remote artifacts under target/mfe/<id>/,
 *                             so this process doubles as the local "CDN" origin
 *                             that the registry's remoteEntry URLs point at
 *                             (REGISTRY_BASE_URL defaults to http://localhost:8080).
 *   GET /shared-deps/<path> -> the built shared-deps bundles under
 *                             packages/osd-ui-shared-deps/target/, which the MFE
 *                             bootstrap loads cross-origin to seed the MF share
 *                             scope before core boot (docs §6, step 1).
 *   GET /  (and /health)   -> a tiny human/JSON index describing the endpoints.
 *
 * ALL responses carry permissive CORS headers and OPTIONS preflight is answered
 * with 204, because OSD --mfe (:5602) loads every artifact here cross-origin.
 *
 * Because /registry is served through the RegistryProvider interface, the exact
 * same read path the Phase 3 render will use is exercised here, and the
 * "flip a version = data edit" liveness proof (Story 6) works against a long-
 * running instance.
 *
 * Usage (standalone):
 *   source harness/env.sh
 *   node packages/osd-mfe/dev/local_registry_server.js [port]      # default port 8080
 *   curl -s http://localhost:8080/registry
 *
 * Or import { startServer } from this module (used by verify_registry_dynamic.js).
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// The OSD repo root holds both the TS RegistryProvider and the built artifacts.
const WORKSPACE_DIR = process.env.WORKSPACE_DIR || path.resolve(__dirname, '../../..');
const OSD_DIR =
  process.env.OSD_DIR ||
  WORKSPACE_DIR;

// Built MF remotes live here; this is the local "CDN" origin root for /mfe/*.
const MFE_DIR = path.join(OSD_DIR, 'target/mfe');

// Built shared-deps bundles (react, react-dom, @elastic/eui, …) live here; this
// is the local "CDN" origin root for /shared-deps/*. The MFE bootstrap on :5602
// loads these cross-origin to seed the Module Federation share scope BEFORE core
// boot (see docs/01-MFE-DESIGN.md §6, step 1).
const SHARED_DEPS_DIR = path.join(OSD_DIR, 'packages/osd-ui-shared-deps/target');

// Built browser MFE bootstrap bundle (assigns window.__osdBootstrapMfe__) lives
// here; this is the local "CDN" origin root for /bootstrap/*. OSD --mfe (:5602)
// loads it cross-origin from the URL configured as
// `opensearchDashboards.mfe.bootstrapUrl`. Produced by packages/osd-mfe/dev/build_bootstrap.js
// (Phase 3, Story 5); see docs/01-MFE-DESIGN.md §6.
const BOOTSTRAP_DIR = path.join(OSD_DIR, 'target/mfe-bootstrap');

// CORS headers applied to EVERY response. :5602 (OSD --mfe) loads the registry,
// the plugin remotes (/mfe/*), and the shared deps (/shared-deps/*) cross-origin
// from :8080, so the browser requires Access-Control-Allow-Origin on all of them
// (and a positive preflight answer for any request the browser deems non-simple).
// This is a local test origin, so a permissive `*` is intentional and sufficient.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
};

// Default listen port matches REGISTRY_BASE_URL (http://localhost:8080), so the
// remoteEntry URLs baked into the registry data resolve against THIS server.
const DEFAULT_PORT = Number(process.env.REGISTRY_SERVER_PORT) || 8080;

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

// Text asset extensions worth compressing on the wire. The MFE remotes are
// (post-`--dist`, with CSS inlined via style-loader) effectively all `.js`; the
// shared-deps bundle adds `.css`. Mirrors the Phase 7 Story 4 pre-compressed CDN
// deploy so the local origin (:8080) and the CDN behave the same on the wire.
// Already-compressed binaries (fonts, png) are served as-is.
const COMPRESSIBLE_EXTENSIONS = new Set([
  '.js',
  '.mjs',
  '.cjs',
  '.css',
  '.json',
  '.map',
  '.svg',
  '.html',
  '.txt',
]);

/** True when the client's Accept-Encoding header advertises gzip. */
function acceptsGzip(acceptEncoding) {
  return /(^|,)\s*gzip\s*(;|,|$)/i.test(String(acceptEncoding || ''));
}

/**
 * Lazily load the FileRegistryProvider from the OSD package. We register OSD's
 * node environment first (babel auto-transpilation) so the TypeScript sources
 * under packages/osd-mfe/src can be required directly — exactly how
 * scripts/update_registry.js bootstraps. Done lazily so static-only requests do
 * not pay the transpile cost, and so a single provider instance is reused (its
 * mtime cache is what makes hot-reload cheap).
 */
let cachedProvider;
function getProvider(options) {
  const opts = options || {};
  if (cachedProvider && !opts.path) {
    return cachedProvider;
  }
  // setup_node_env registers @babel/register; require it from the OSD repo so the
  // babel config resolves relative to the (in-repo) sources being transpiled.
  // eslint-disable-next-line global-require, import/no-dynamic-require
  require(path.join(OSD_DIR, 'src/setup_node_env'));
  // Require the registry sub-barrel (packages/osd-mfe/src/registry/index.ts) — the
  // top-level src barrel intentionally re-exports only a subset and does NOT expose
  // FileRegistryProvider.
  // eslint-disable-next-line global-require, import/no-dynamic-require
  const { FileRegistryProvider } = require(path.join(OSD_DIR, 'packages/osd-mfe/src/registry'));
  // No explicit path => provider falls back to MFE_REGISTRY_PATH (set by env.sh).
  const provider = new FileRegistryProvider(opts.path ? { path: opts.path } : {});
  if (!opts.path) {
    cachedProvider = provider;
  }
  return provider;
}

function send(res, status, body, contentType) {
  res.writeHead(status, {
    'Content-Type': contentType || 'text/plain; charset=utf-8',
    // Never cache: the whole point is that edits are reflected immediately.
    'Cache-Control': 'no-store',
    // CORS on every response: :5602 loads from this origin cross-origin.
    ...CORS_HEADERS,
  });
  res.end(body);
}

function sendJson(res, status, value) {
  send(res, status, JSON.stringify(value, null, 2) + '\n', MIME['.json']);
}

/** Safely resolve a request path under a root, rejecting traversal escapes. */
function resolveUnder(root, relPath) {
  const resolved = path.normalize(path.join(root, relPath));
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    return null;
  }
  return resolved;
}

function serveFile(res, filePath, acceptEncoding) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      send(res, 404, 'Not found: ' + filePath);
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || 'application/octet-stream';
    // Compress text assets when the client advertises gzip. `Vary:
    // Accept-Encoding` keeps any intermediary cache correct for clients that do
    // not. This makes the local origin match the pre-compressed CDN on the wire.
    if (COMPRESSIBLE_EXTENSIONS.has(ext) && acceptsGzip(acceptEncoding)) {
      const body = zlib.gzipSync(data);
      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Encoding': 'gzip',
        Vary: 'Accept-Encoding',
        // Never cache: the whole point is that edits are reflected immediately.
        'Cache-Control': 'no-store',
        ...CORS_HEADERS,
      });
      res.end(body);
      return;
    }
    res.writeHead(200, {
      'Content-Type': contentType,
      // Advertise that the representation varies by encoding even when we serve
      // identity, so a shared cache never hands a gzip body to a non-gzip client.
      Vary: 'Accept-Encoding',
      'Cache-Control': 'no-store',
      ...CORS_HEADERS,
    });
    res.end(data);
  });
}

/**
 * Serve GET /registry by reading THROUGH the RegistryProvider. The provider
 * re-reads the file only when its mtime changed (hot-reload) and validates it,
 * so a malformed edit surfaces as a 500 rather than serving garbage. We
 * re-serialize the validated object (2-space indent + trailing newline) to
 * mirror how update_registry writes the file.
 *
 * v3 schema compatibility: FileRegistryProvider validates v1-shape only.
 * Phase 16 introduced v3 (schemaVersion: 3, layered default/rollouts/
 * tenantOverrides, plus new global core/orchestrator/themes/sharedDepsCss
 * fields). When the on-disk registry is v3, we read it directly and flatten
 * to a v1-shape view for this endpoint — drops v3-only fields, lifts
 * default.mfes and default.sharedDeps to the top, sets schemaVersion: 1.
 * The OSD server is unaffected (it reads the v3 file via its own v3-aware
 * reader, not via this harness endpoint).
 */
function serveRegistry(res, options) {
  // Step 1: v3 coercion path. Read directly, detect v3, flatten if so.
  const registryPath =
    (options && options.path) ||
    process.env.MFE_REGISTRY_PATH ||
    null;
  if (registryPath) {
    try {
      const raw = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
      if (raw && raw.schemaVersion === 3) {
        const v1View = {
          schemaVersion: 1,
          generatedAt: raw.generatedAt,
          sharedDeps: (raw.default && raw.default.sharedDeps) || null,
          mfes: (raw.default && raw.default.mfes) || {},
        };
        if (raw.signature) v1View.signature = raw.signature;
        sendJson(res, 200, v1View);
        return;
      }
    } catch (_) {
      // Fall through to the legacy validating path below.
    }
  }

  // Step 2: legacy v1 validating path via the production FileRegistryProvider.
  let registry;
  try {
    registry = getProvider(options).read();
  } catch (err) {
    // Missing / invalid / non-JSON registry — report it instead of 200-ing junk.
    sendJson(res, 500, {
      error: 'registry_unavailable',
      message: err && err.message ? err.message : String(err),
    });
    return;
  }
  sendJson(res, 200, registry);
}

function createServer(options) {
  const opts = options || {};
  return http.createServer((req, res) => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    } catch (e) {
      send(res, 400, 'Bad request');
      return;
    }

    // CORS preflight: browsers send OPTIONS for cross-origin requests they deem
    // non-simple. Answer it BEFORE the GET/HEAD gate below so the actual request
    // (GET) is allowed to proceed. 204 No Content + the CORS headers (added by
    // send) is the standard positive preflight response.
    if (req.method === 'OPTIONS') {
      send(res, 204, '');
      return;
    }

    // Only GET/HEAD are meaningful for a read-only mock origin.
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      send(res, 405, 'Method not allowed: ' + req.method);
      return;
    }

    // Client's advertised content codings; static asset routes below use it to
    // decide whether to gzip text bodies (Phase 7 Story 4 transit compression).
    const acceptEncoding = req.headers['accept-encoding'];

    if (pathname === '/' || pathname === '/health') {
      sendJson(res, 200, {
        service: 'osd-mfe-mock-registry',
        endpoints: {
          registry: '/registry',
          artifacts: '/mfe/<pluginId>/remoteEntry.js',
          sharedDeps: '/shared-deps/osd-ui-shared-deps.js',
          bootstrap: '/bootstrap/osd_bootstrap_mfe.js',
          health: '/health',
        },
        registryPath: opts.path || process.env.MFE_REGISTRY_PATH || '(MFE_REGISTRY_PATH unset)',
        mfeDir: MFE_DIR,
        sharedDepsDir: SHARED_DEPS_DIR,
        bootstrapDir: BOOTSTRAP_DIR,
      });
      return;
    }

    if (pathname === '/favicon.ico') {
      send(res, 204, '');
      return;
    }

    // The dynamic registry document (read through the provider; hot-reloads).
    if (pathname === '/registry') {
      serveRegistry(res, opts);
      return;
    }

    // Static "CDN" origin for the built remotes the registry URLs point at.
    if (pathname.startsWith('/mfe/')) {
      const target = resolveUnder(MFE_DIR, pathname.slice('/mfe/'.length));
      if (!target) {
        send(res, 403, 'Forbidden');
        return;
      }
      serveFile(res, target, acceptEncoding);
      return;
    }

    // Static "CDN" origin for the shared-deps bundles. The MFE bootstrap loads
    // these (e.g. /shared-deps/osd-ui-shared-deps.js) cross-origin to seed the MF
    // share scope before core boot. Mapped to packages/osd-ui-shared-deps/target/.
    if (pathname.startsWith('/shared-deps/')) {
      const target = resolveUnder(SHARED_DEPS_DIR, pathname.slice('/shared-deps/'.length));
      if (!target) {
        send(res, 403, 'Forbidden');
        return;
      }
      serveFile(res, target, acceptEncoding);
      return;
    }

    // Static "CDN" origin for the browser MFE bootstrap bundle. OSD --mfe loads
    // this (e.g. /bootstrap/osd_bootstrap_mfe.js) cross-origin; it assigns
    // window.__osdBootstrapMfe__, which the served shell invokes to seed the share
    // scope, load remotes, and drive core boot. Mapped to target/mfe-bootstrap/.
    if (pathname.startsWith('/bootstrap/')) {
      const target = resolveUnder(BOOTSTRAP_DIR, pathname.slice('/bootstrap/'.length));
      if (!target) {
        send(res, 403, 'Forbidden');
        return;
      }
      serveFile(res, target, acceptEncoding);
      return;
    }

    send(res, 404, 'Not found: ' + pathname);
  });
}

/**
 * Start the mock registry server. Binds to 127.0.0.1 only (local test harness).
 *
 * @param {{ port?: number, path?: string }} [options]
 *   port: listen port (default REGISTRY_SERVER_PORT env or 8080)
 *   path: explicit registry file path (default MFE_REGISTRY_PATH env)
 * @returns {Promise<{server: http.Server, port: number, url: string, close: () => Promise<void>}>}
 */
function startServer(options) {
  const opts = options || {};
  const port = typeof opts.port === 'number' ? opts.port : DEFAULT_PORT;
  return new Promise((resolve, reject) => {
    const server = createServer({ path: opts.path });
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

module.exports = { startServer, createServer, getProvider };

// Run standalone for manual use / verify_registry_dynamic.js spawns this too.
if (require.main === module) {
  const port = Number(process.argv[2]) || DEFAULT_PORT;
  startServer({ port })
    .then((s) => {
      // eslint-disable-next-line no-console
      console.log(
        'MFE mock registry server: ' +
          s.url +
          '  (GET /registry, GET /mfe/<id>/remoteEntry.js)'
      );
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Failed to start registry server:', err);
      process.exit(1);
    });
}
