/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isEqual } from 'lodash';
import { toVisSnapshot } from './vis_snapshot';

describe('vis snapshot', () => {
  it('sees a chart type or mapping change, and a single field equal to a one-item list', () => {
    const config = { type: 'line', axesMapping: { x: 'Time', y: 'count' }, styles: {} } as any;
    const snapshot = toVisSnapshot({ config });
    expect(snapshot).toEqual(
      expect.objectContaining({ chartType: 'line', axesMapping: { x: ['Time'], y: ['count'] } })
    );
    expect(
      isEqual(
        snapshot,
        toVisSnapshot({ config: { ...config, axesMapping: { x: 'Time', y: ['count'] } } })
      )
    ).toBe(true);
    expect(isEqual(snapshot, toVisSnapshot({ config: { ...config, type: 'bar' } }))).toBe(false);
  });

  it('treats a missing and an empty title, and no and empty transformations, alike', () => {
    expect(
      isEqual(
        toVisSnapshot({ config: { type: 'line', title: '' } as any }),
        toVisSnapshot({ config: { type: 'line' } as any, dataTransformations: [] })
      )
    ).toBe(true);
  });
});
