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
import { Compiler, NormalModule } from '@rspack/core';

import { Bundle, BundleRefs } from '../common';

const RESOLVE_EXTENSIONS = ['.js', '.ts', '.tsx'];

export class BundleDepsCheckPlugin {
  private ignorePrefix = '';
  private usedBundleIds: Set<string> = new Set();
  private allowedBundleIds = new Set<string>();

  constructor(private readonly bundle: Bundle, private readonly bundleRefs: BundleRefs) {
    this.ignorePrefix = Path.resolve(this.bundle.contextDir) + Path.sep;
  }

  public apply(compiler: Compiler) {
    compiler.hooks.compilation.tap('BundleDepsCheckPlugin/getRequiredBundles', (compilation) => {
      this.allowedBundleIds.clear();
      this.usedBundleIds.clear();

      const manifestPath = this.bundle.manifestPath;
      if (!manifestPath) {
        return;
      }

      const deps = this.bundle.readBundleDeps();
      for (const ref of this.bundleRefs.forBundleIds([...deps.explicit, ...deps.implicit])) {
        this.allowedBundleIds.add(ref.bundleId);
      }

      compilation.hooks.processAssets.tap(
        {
          name: 'BundleDepsCheckPlugin/watchManifest',
          stage: compiler.rspack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
        },
        () => {
          compilation.fileDependencies.add(manifestPath);
        }
      );

      compilation.hooks.finishModules.tapPromise(
        'BundleDepsCheckPlugin/finishModules',
        async (modules) => {
          // Validate all modules for bundle references, not just newly processed ones
          for (const module of modules) {
            if (module instanceof NormalModule) {
              const userRequest = module.userRequest;

              const requestExt = Path.extname(userRequest);
              if (requestExt && !RESOLVE_EXTENSIONS.includes(requestExt)) {
                continue;
              }

              if (userRequest.startsWith(this.ignorePrefix)) {
                continue;
              }

              const possibleRefs = this.bundleRefs.filterByContextPrefix(this.bundle, userRequest);
              if (!possibleRefs.length) {
                // import doesn't match a bundle context
                continue;
              }

              let foundMatch = false;
              for (const ref of possibleRefs) {
                const resolvedEntry = this.resolve(`./${ref.entry}`, ref.contextDir, compiler);
                if (userRequest !== resolvedEntry) {
                  continue;
                }
                foundMatch = true;

                if (!this.allowedBundleIds.has(ref.bundleId)) {
                  const error = new Error(
                    `import [${userRequest}] references a public export of the [${ref.bundleId}] bundle, but that bundle is not in the "requiredPlugins" or "requiredBundles" list in the plugin manifest [${this.bundle.manifestPath}]`
                  );
                  (error as any).file = manifestPath;
                  compilation.errors.push(error);
                  continue;
                }

                this.usedBundleIds.add(ref.bundleId);
                break;
              }

              // If we found possible refs but none matched, it's a non-public export error
              if (!foundMatch) {
                const bundleId = Array.from(new Set(possibleRefs.map((r) => r.bundleId))).join(
                  ', '
                );
                const publicDir = possibleRefs.map((r) => r.entry).join(', ');
                const error = new Error(
                  `import [${userRequest}] references a non-public export of the [${bundleId}] bundle and must point to one of the public directories: [${publicDir}]`
                );
                (error as any).file = manifestPath;
                compilation.errors.push(error);
              }
            }
          }

          const unusedBundleIds = deps.explicit
            .filter((id) => !this.usedBundleIds.has(id))
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

  private resolve(request: string, startPath: string, compiler: Compiler) {
    const resolver = compiler.resolverFactory.get('normal', compiler.options.resolve);
    try {
      const resolvedPath = resolver.resolveSync({}, startPath, request);
      return resolvedPath;
    } catch (e) {
      return false;
    }
  }
}
