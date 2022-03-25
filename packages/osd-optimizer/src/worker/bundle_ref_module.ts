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

// @ts-ignore not typed by @types/webpack
import Module from 'webpack/lib/Module';
import { BundleRef } from '../common';

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

  chunkCondition(chunk: any) {
    return chunk.hasEntryModule();
  }

  identifier() {
    return '@osd/bundleRef ' + JSON.stringify(this.ref.exportId);
  }

  readableIdentifier() {
    return this.identifier();
  }

  needRebuild() {
    return false;
  }

  build(_: any, __: any, ___: any, ____: any, callback: () => void) {
    this.built = true;
    this.buildMeta = {};
    this.buildInfo = {};
    callback();
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

  updateHash(hash: any) {
    hash.update(this.identifier());
    super.updateHash(hash);
  }
}
