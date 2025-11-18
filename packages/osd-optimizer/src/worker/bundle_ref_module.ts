/* eslint-disable @osd/eslint/require-license-header */

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
 * @notice
 *
 * This module was heavily inspired by the externals plugin that ships with webpack@97d58d31
 * MIT License http://www.opensource.org/licenses/mit-license.php
 * Author Tobias Koppers @sokra
 */

import webpack, { Chunk, Compilation, Module } from 'webpack';
import { BundleRef } from '../common';

const { RawSource } = webpack.sources;

export class BundleRefModule extends Module {
  public built = false;
  public buildMeta?: any;
  public buildInfo?: any;
  public exportsArgument = '__webpack_exports__';

  constructor(public readonly ref: BundleRef) {
    super('osd/bundleRef', null);
  }

  libIdent() {
    return this.ref.exportId;
  }

  chunkCondition(chunk: Chunk, compilation: Compilation) {
    return compilation.chunkGraph.getNumberOfEntryModules(chunk) > 0;
  }

  identifier() {
    return '@osd/bundleRef ' + JSON.stringify(this.ref.exportId);
  }

  readableIdentifier() {
    return this.identifier();
  }

  needBuild(context: any, callback: any) {
    return callback(null, !this.buildMeta);
  }

  build(_: any, __: any, ___: any, ____: any, callback: () => void) {
    this.built = true;
    this.buildMeta = {};
    this.buildInfo = {};
    callback();
  }

  codeGeneration(_: any) {
    const sources = new Map();
    sources.set(
      'javascript',
      new RawSource(`
        __webpack_require__.r(__webpack_exports__);
        var ns = __osdBundles__.get('${this.ref.exportId}');
        Object.defineProperties(__webpack_exports__, Object.getOwnPropertyDescriptors(ns))
      `)
    );

    const data = new Map();
    data.set('url', this.ref.exportId);

    return {
      sources,
      runtimeRequirements: new Set(['module', '__webpack_exports__', '__webpack_require__']),
      data,
    };
  }

  source() {
    return `
      __webpack_require__.r(__webpack_exports__);
      var ns = __osdBundles__.get('${this.ref.exportId}');
      Object.defineProperties(__webpack_exports__, Object.getOwnPropertyDescriptors(ns))
    `;
  }

  size() {
    return 42;
  }

  updateHash(hash: any, context: any) {
    hash.update(this.identifier());
    super.updateHash(hash, context);
  }
}
