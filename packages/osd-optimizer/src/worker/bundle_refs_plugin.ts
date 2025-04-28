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

import Path from 'path';

import webpack from 'webpack';

import { Bundle, BundleRefs, BundleRef } from '../common';
import { BundleRefModule } from './bundle_ref_module';

const RESOLVE_EXTENSIONS = ['.js', '.ts', '.tsx'];

interface RequestData {
  context: string;
  dependencies: Array<{ request: string }>;
}

type Callback<T> = (error?: any, result?: T) => void;
type ModuleFactory = (data: RequestData, callback: Callback<BundleRefModule>) => void;

export class BundleRefsPlugin {
  private readonly resolvedRefEntryCache = new Map<BundleRef, Promise<string>>();
  private readonly resolvedRequestCache = new Map<string, Promise<string | undefined>>();
  private readonly ignorePrefix = Path.resolve(this.bundle.contextDir) + Path.sep;
  private allowedBundleIds = new Set<string>();

  constructor(private readonly bundle: Bundle, private readonly bundleRefs: BundleRefs) {}

  /**
   * Called by webpack when the plugin is passed in the webpack config
   */
  public apply(compiler: webpack.Compiler) {
    // called whenever the compiler starts to compile, passed the params
    // that will be used to create the compilation
    compiler.hooks.compile.tap('BundleRefsPlugin', (compilationParams: any) => {
      // clear caches because a new compilation is starting, meaning that files have
      // changed and we should re-run resolutions
      this.resolvedRefEntryCache.clear();
      this.resolvedRequestCache.clear();

      // hook into the creation of NormalModule instances in webpack, if the import
      // statement leading to the creation of the module is pointing to a bundleRef
      // entry then create a BundleRefModule instead of a NormalModule.
      compilationParams.normalModuleFactory.hooks.factory.tap(
        'BundleRefsPlugin/normalModuleFactory/factory',
        (wrappedFactory: ModuleFactory): ModuleFactory => (data, callback) => {
          const context = data.context;
          const dep = data.dependencies[0];

          this.maybeReplaceImport(context, dep.request, compiler).then(
            (module) => {
              if (!module) {
                wrappedFactory(data, callback);
              } else {
                callback(undefined, module);
              }
            },
            (error) => callback(error)
          );
        }
      );
    });

    compiler.hooks.compilation.tap('BundleRefsPlugin/getRequiredBundles', (compilation) => {
      this.allowedBundleIds.clear();

      const manifestPath = this.bundle.manifestPath;
      if (!manifestPath) {
        return;
      }

      const deps = this.bundle.readBundleDeps();
      for (const ref of this.bundleRefs.forBundleIds([...deps.explicit, ...deps.implicit])) {
        this.allowedBundleIds.add(ref.bundleId);
      }

      compilation.hooks.additionalAssets.tap('BundleRefsPlugin/watchManifest', () => {
        compilation.fileDependencies.add(manifestPath);
      });

      compilation.hooks.finishModules.tapPromise(
        'BundleRefsPlugin/finishModules',
        async (modules) => {
          const usedBundleIds = (modules as any[])
            .filter((m: any): m is BundleRefModule => m instanceof BundleRefModule)
            .map((m) => m.ref.bundleId);

          const unusedBundleIds = deps.explicit
            .filter((id) => !usedBundleIds.includes(id))
            .join(', ');

          if (unusedBundleIds) {
            const error = new Error(
              `Bundle for [${this.bundle.id}] lists [${unusedBundleIds}] as a required bundle, but does not use it. Please remove it.`
            );
            (error as any).file = manifestPath;
            compilation.errors.push(error);
          }
        }
      );
    });
  }

  private async resolve(request: string, startPath: string, compiler: webpack.Compiler) {
    const resolver = compiler.resolverFactory.get('normal');
    return new Promise<string | undefined>((resolve, reject) => {
      resolver.resolve({}, startPath, request, {}, (err: unknown | null, resolvedPath: string) => {
        if (err) {
          reject(err);
        } else {
          resolve(resolvedPath);
        }
      });
    });
  }

  /**
   * Determine if an import request resolves to a bundleRef export id. If the
   * request resolves to a bundle ref context but none of the exported directories
   * then an error is thrown. If the request does not resolve to a bundleRef then
   * undefined is returned. Otherwise it returns the referenced bundleRef.
   */
  private async maybeReplaceImport(context: string, request: string, compiler: webpack.Compiler) {
    const alias = Object.keys(compiler.options.resolve?.alias ?? {});
    const isAliasRequest = alias.some((a) => request.startsWith(a));

    // For non-alias import path, ignore imports that have loaders defined or are not relative seeming
    if (!isAliasRequest && (request.includes('!') || !request.startsWith('.'))) {
      return;
    }

    const requestExt = Path.extname(request);
    if (requestExt && !RESOLVE_EXTENSIONS.includes(requestExt)) {
      return;
    }

    const resolved = await this.resolve(request, context, compiler);
    if (!resolved) {
      return;
    }

    if (resolved.startsWith(this.ignorePrefix)) {
      return;
    }

    const possibleRefs = this.bundleRefs.filterByContextPrefix(this.bundle, resolved);
    if (!possibleRefs.length) {
      // import doesn't match a bundle context
      return;
    }

    for (const ref of possibleRefs) {
      const resolvedEntry = await this.resolve(`./${ref.entry}`, ref.contextDir, compiler);
      if (resolved !== resolvedEntry) {
        continue;
      }

      if (!this.allowedBundleIds.has(ref.bundleId)) {
        throw new Error(
          `import [${request}] references a public export of the [${ref.bundleId}] bundle, but that bundle is not in the "requiredPlugins" or "requiredBundles" list in the plugin manifest [${this.bundle.manifestPath}]`
        );
      }

      return new BundleRefModule(ref);
    }

    const bundleId = Array.from(new Set(possibleRefs.map((r) => r.bundleId))).join(', ');
    const publicDir = possibleRefs.map((r) => r.entry).join(', ');
    throw new Error(
      `import [${request}] references a non-public export of the [${bundleId}] bundle and must point to one of the public directories: [${publicDir}]`
    );
  }
}
