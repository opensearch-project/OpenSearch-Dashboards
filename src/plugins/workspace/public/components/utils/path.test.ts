/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { join } from './path';

describe('path utils', () => {
  it('should join paths', () => {
    expect(join('/', '/')).toBe('/');
    expect(join('/', '/foo')).toBe('/foo');
    expect(join('foo', '/bar')).toBe('foo/bar');
    expect(join('foo', 'bar')).toBe('foo/bar');
    expect(join('foo', 'bar/baz')).toBe('foo/bar/baz');
    expect(join('/foo', 'bar/baz')).toBe('/foo/bar/baz');
    expect(join('/foo/', 'bar/baz')).toBe('/foo/bar/baz');
  });
});
