/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getSharedLoaderRules } from './rspack';

describe('getSharedLoaderRules', () => {
  it('returns the TS, .m?js resolve, .cjs and selective-node_modules rules in order', () => {
    const rules = getSharedLoaderRules({ targets: ['chrome 100'] });

    expect(rules).toHaveLength(4);
    // 1. TypeScript/JSX transpile
    expect(rules[0].test).toEqual(/\.(j|t)sx?$/);
    // 2. extensionless ESM resolution (no loader)
    expect(rules[1]).toEqual({ test: /\.m?js$/, resolve: { fullySpecified: false } });
    // 3. CommonJS transpile
    expect(rules[2].test).toEqual(/\.cjs$/);
    expect(rules[2].include).toEqual(/node_modules/);
    // 4. selective ESM-only node_modules transpile
    expect(rules[3].test).toEqual(/\.m?js$/);
    expect(rules[3].include).toEqual([
      /node_modules[\\/]@dagrejs/,
      /node_modules[\\/]@xyflow/,
      /node_modules[\\/]fast-png/,
      /node_modules[\\/]iobuffer/,
    ]);
  });

  it('always excludes core-js from the .cjs rule and appends extra excludes in order', () => {
    const mf = /node_modules[\\/]@module-federation[\\/]/;
    const swc = /node_modules[\\/]@swc[\\/]helpers[\\/]/;
    const rules = getSharedLoaderRules({ targets: [], extraCjsExcludes: [mf, swc] });

    expect(rules[2].exclude).toEqual([/node_modules[\\/]core-js/, mf, swc]);
  });

  it('defaults the .cjs excludes to just core-js when none are supplied', () => {
    const rules = getSharedLoaderRules({ targets: [] });

    expect(rules[2].exclude).toEqual([/node_modules[\\/]core-js/]);
  });

  it('wires the swc-loader onto the transpile rules and the browser targets through', () => {
    const targets = ['chrome 109'];
    const rules = getSharedLoaderRules({ targets });

    // The resolve-only rule (index 1) carries no loader.
    expect(rules[1].use).toBeUndefined();

    for (const index of [0, 2, 3]) {
      const use = rules[index].use;
      expect(use).toBeDefined();
      expect(use!.loader).toBe('builtin:swc-loader');
      expect(use!.options.env.targets).toBe(targets);
    }

    // The TS rule transpiles TypeScript + JSX; the .cjs/ESM rules use plain ecmascript.
    expect(rules[0].use!.options.jsc.parser.syntax).toBe('typescript');
    expect(rules[2].use!.options.jsc.parser.syntax).toBe('ecmascript');
    expect(rules[3].use!.options.jsc.parser.syntax).toBe('ecmascript');
  });
});
