/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { transform, facetTransform } from './transform';

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

describe('facetTransform', () => {
  const doubleA = (data: any[]) => data.map((item) => ({ ...item, a: item.a * 2 }));

  it('handle one facet group and apply transforms to this group', () => {
    const state = {
      data: [
        { cat: 'x', a: 1 },
        { cat: 'x', a: 2 },
      ],
    } as any;

    const result = facetTransform('cat', doubleA)(state);

    expect(result.transformedData).toEqual([
      [
        { cat: 'x', a: 2 },
        { cat: 'x', a: 4 },
      ],
    ]);
  });

  it('group data by facet column and apply transforms to each group', () => {
    const state = {
      data: [
        { cat: 'x', a: 1 },
        { cat: 'y', a: 3 },
        { cat: 'x', a: 2 },
      ],
    } as any;

    const result = facetTransform('cat', doubleA)(state);

    expect(result.transformedData).toEqual([
      [
        { cat: 'x', a: 2 },
        { cat: 'x', a: 4 },
      ],
      [{ cat: 'y', a: 6 }],
    ]);
  });
});
