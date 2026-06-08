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

import { SHARED_SINGLETONS, buildShareScope, readVersion } from './share_scope';

describe('buildShareScope', () => {
  it('seeds react and react-dom as singletons from the host shared deps', () => {
    const React = { version: '16.14.0', tag: 'react' };
    const ReactDom = { version: '16.14.0', tag: 'react-dom' };

    const scope = buildShareScope({ React, ReactDom });

    expect(scope.react['16.14.0'].from).toBe('host');
    expect(scope['react-dom']['16.14.0'].from).toBe('host');

    // `get()` returns a factory; the factory returns the SAME live instance
    // (true singleton identity — no duplicate React at runtime).
    const reactFactory = scope.react['16.14.0'].get() as () => unknown;
    expect(reactFactory()).toBe(React);
    const reactDomFactory = scope['react-dom']['16.14.0'].get() as () => unknown;
    expect(reactDomFactory()).toBe(ReactDom);

    expect(scope.react['16.14.0'].eager).toBe(true);
    expect(scope.react['16.14.0'].loaded).toBe(1);
  });

  it('maps the documented singleton packages to their shared-deps globals', () => {
    expect(SHARED_SINGLETONS.react).toBe('React');
    expect(SHARED_SINGLETONS['react-dom']).toBe('ReactDom');
    expect(SHARED_SINGLETONS['@elastic/eui']).toBe('ElasticEui');
    expect(SHARED_SINGLETONS.lodash).toBe('Lodash');
    // 17 MF shared singletons (numeral + @elastic/numeral share one global).
    expect(Object.keys(SHARED_SINGLETONS)).toHaveLength(17);
  });

  it('skips packages whose global is absent from the shared deps', () => {
    const scope = buildShareScope({ React: { version: '16.14.0' } });
    expect(scope.react).toBeDefined();
    expect(scope.lodash).toBeUndefined();
    expect(scope['@elastic/eui']).toBeUndefined();
  });

  it('keeps a single shared instance across multiple consumers of one scope', () => {
    const React = { version: '16.14.0' };
    const scope = buildShareScope({ React });

    const first = (scope.react['16.14.0'].get() as () => unknown)();
    const second = (scope.react['16.14.0'].get() as () => unknown)();
    expect(first).toBe(second);
    expect(first).toBe(React);
  });
});

describe('readVersion', () => {
  it('prefers .version, then .VERSION, then falls back to 0.0.0', () => {
    expect(readVersion({ version: '1.2.3' })).toBe('1.2.3');
    expect(readVersion({ VERSION: '4.5.6' })).toBe('4.5.6');
    expect(readVersion({})).toBe('0.0.0');
    expect(readVersion(undefined)).toBe('0.0.0');
    expect(readVersion(null)).toBe('0.0.0');
  });
});
