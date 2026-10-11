/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// extract-zip 2.0.1 is its final release and has no fix for CVE-2026-56876 or
// CVE-2026-19693, both of which allow writes outside the destination directory
// through symlink archive entries. A `**/extract-zip` resolution points the
// package name at this shim so the four devDependencies that hard-code
// `require('extract-zip')` -- cypress, chromedriver, ms-chromium-edge-driver and
// @percy/core -- get a safe implementation without changes to their code.
//
// @electron-internal/extract-zip is ESM-only and exports a named `extract`
// rather than a callable default, so it is loaded with a dynamic import. That
// keeps `require()` of this shim synchronous, which is what the callers expect.
//
// Only `dir` is forwarded: the replacement's options are `{ dir }` alone. Any
// `onEntry` callback is accepted and ignored, as is the stray third argument
// left over from extract-zip 1.x's callback API. The practical effect is that
// cypress's unzip progress indicator no longer advances; extraction itself
// still completes and resolves normally.
//
// Written in ES5: everything under scripts/ runs before the Node version check,
// so .eslintrc.js restricts this directory to untranspiled syntax.
module.exports = function extractZip(zipPath, opts) {
  var dir = opts && opts.dir;
  return import('@electron-internal/extract-zip').then(function (mod) {
    return mod.extract(zipPath, { dir: dir });
  });
};
