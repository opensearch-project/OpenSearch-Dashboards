/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { transform } from './transform';

describe('transform', () => {
  it('applies single transformation function', () => {
    const state = { data: [{ a: 1 }, { a: 2 }] } as any;
    const addB = (data: any[]) => data.map((item) => ({ ...item, b: item.a * 2 }));

    const result = transform(addB)(state);

    expect(result.transformedData).toEqual([
      { a: 1, b: 2 },
      { a: 2, b: 4 },
    ]);
  });

  it('applies multiple transformation functions in sequence', () => {
    const state = { data: [{ a: 1 }, { a: 2 }] } as any;
    const addB = (data: any[]) => data.map((item) => ({ ...item, b: item.a * 2 }));
    const addC = (data: any[]) => data.map((item) => ({ ...item, c: item.a + item.b }));

    const result = transform(addB, addC)(state);

    expect(result.transformedData).toEqual([
      { a: 1, b: 2, c: 3 },
      { a: 2, b: 4, c: 6 },
    ]);
  });

  it('preserves original state properties', () => {
    const state = { data: [{ a: 1 }], otherProp: 'value' } as any;
    const identity = (data: any[]) => data;

    const result = transform(identity)(state);

    // @ts-ignore
    expect(result.otherProp).toBe('value');
  });
});
