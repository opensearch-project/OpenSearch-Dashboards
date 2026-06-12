/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export function getSwcLoaderConfig({
  targets,
  jsx,
  syntax,
}: {
  targets?: string[];
  jsx?: boolean;
  syntax: string;
}) {
  return {
    loader: 'builtin:swc-loader',
    options: {
      jsc: {
        parser: {
          syntax,
          ...(syntax === 'ecmascript' && jsx ? { jsx: true } : {}),
          ...(syntax === 'typescript' && jsx ? { tsx: true } : {}),
          decorators: true,
          dynamicImport: true,
        },
        externalHelpers: true,
        transform: {
          react: {
            runtime: 'automatic',
          },
          useDefineForClassFields: true,
        },
      },
      env: {
        targets,
        forceAllTransforms: true,
        mode: 'entry',
        coreJs: '3.2.1',
      },
      isModule: 'unknown',
    },
  };
}

/**
 * A single webpack/rspack `module.rules` entry. Typed structurally (rather than via
 * `@rspack/core`'s `RuleSetRule`) so this foundational `@osd/utils` package does not
 * have to take a dependency on `@rspack/core`; every field used here is assignable to
 * the corresponding `RuleSetRule` field in the consuming configs.
 */
export interface RspackModuleRule {
  test?: RegExp;
  include?: RegExp | RegExp[];
  exclude?: RegExp[];
  resolve?: { fullySpecified?: boolean };
  use?: ReturnType<typeof getSwcLoaderConfig>;
}

/**
 * The set of `module.rules` that transpile first-party TypeScript/JavaScript (and the
 * handful of `node_modules` packages that ship only modern, untranspiled sources) for
 * the configured browser targets via `builtin:swc-loader`.
 *
 * These rules were duplicated between the optimizer
 * (`packages/osd-optimizer/src/worker/webpack.config.ts`) and the MFE build
 * (`packages/osd-mfe/src/mfe_rspack_config.ts`). Extracting them here gives both a
 * single canonical definition so the loader settings can't silently drift. The rules
 * are returned in the same relative order both builds already used:
 *   1. `.ts`/`.tsx`/`.js`/`.jsx` (TypeScript + JSX) transpile
 *   2. `.m?js` resolve rule (allow extensionless ESM resolution)
 *   3. `.cjs` (CommonJS, modern syntax) transpile
 *   4. selective `node_modules` ESM-only packages transpile
 *
 * The optimizer's `.cjs` rule excludes only `core-js`; the MFE build additionally
 * excludes the Module Federation runtime and swc's helper runtime (it builds MF
 * containers, the optimizer does not). Those extra excludes are supplied via
 * `extraCjsExcludes` rather than hard-coded, keeping a single rule definition.
 *
 * NOTE: today only the MFE build imports this — the optimizer is intentionally left
 * untouched. It lives alongside `getSwcLoaderConfig` (which BOTH builds already import
 * from `@osd/utils`) so the optimizer can adopt it later with a one-line, same-package
 * change.
 */
export function getSharedLoaderRules({
  targets,
  extraCjsExcludes = [],
}: {
  /** Browser targets (from the repo's browserslist) the swc-loader transpiles for. */
  targets?: string[];
  /**
   * Additional `node_modules` paths to EXCLUDE from the `.cjs` transpile rule, on top
   * of the always-excluded `core-js`. The MFE build passes the Module Federation
   * runtime and `@swc/helpers` here (see its call site for why).
   */
  extraCjsExcludes?: RegExp[];
}): RspackModuleRule[] {
  return [
    {
      test: /\.(j|t)sx?$/,
      exclude: [
        /* vega-lite, reactflow and some of its dependencies don't have es5 builds
         * so we need to build from source and transpile for webpack v4
         * kbn-handlebars uses modern syntax (nullish coalescing) that needs transpilation
         */
        /[\/\\]node_modules[\/\\](?!(vega(-lite|-label|-functions|-scenegraph)?|kbn-handlebars|@?reactflow)[\/\\])/,
        // Don't attempt to look into release artifacts of the plugins
        /[\/\\]plugins[\/\\][^\/\\]+[\/\\]build[\/\\]/,
        // exclude core-js
        /node_modules[\\/]core-js/,
      ],
      use: getSwcLoaderConfig({ syntax: 'typescript', jsx: true, targets }),
    },
    {
      test: /\.m?js$/,
      resolve: {
        // This allows Rspack to resolve ES modules without the .js/.mjs extension
        fullySpecified: false,
      },
    },
    {
      // Transpile CommonJS sources shipped by node_modules that use modern syntax.
      // core-js is excluded so its polyfills are not reprocessed; callers may add more
      // excludes via `extraCjsExcludes`.
      test: /\.cjs$/,
      include: /node_modules/,
      exclude: [/node_modules[\\/]core-js/, ...extraCjsExcludes],
      use: getSwcLoaderConfig({ syntax: 'ecmascript', targets }),
    },
    {
      // A few node_modules ship only modern/untranspiled ESM and have no es5 build, so
      // they must be transpiled from source for the browser targets.
      test: /\.m?js$/,
      include: [
        /node_modules[\\/]@dagrejs/,
        /node_modules[\\/]@xyflow/,
        /node_modules[\\/]fast-png/,
        /node_modules[\\/]iobuffer/,
      ],
      exclude: [/node_modules[\\/]core-js/],
      use: getSwcLoaderConfig({ syntax: 'ecmascript', targets }),
    },
  ];
}
