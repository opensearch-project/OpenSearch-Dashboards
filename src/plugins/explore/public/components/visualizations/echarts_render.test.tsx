/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { act, render } from '@testing-library/react';
import { BehaviorSubject } from 'rxjs';
import { EchartsRender } from './echarts_render';
import { LegendTarget } from './utils/legend';

const mockEchartsInstance = {
  resize: jest.fn(),
  dispose: jest.fn(),
  isDisposed: jest.fn(() => false),
  on: jest.fn(),
  off: jest.fn(),
  setOption: jest.fn(),
  setTheme: jest.fn(),
  dispatchAction: jest.fn(),
};

jest.mock('echarts', () => ({
  init: jest.fn(() => mockEchartsInstance),
  registerTheme: jest.fn(),
}));

describe('EchartsRender', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      disconnect: jest.fn(),
    }));
  });

  it('highlights series targets by seriesName', () => {
    const highlightedLegendTarget$ = new BehaviorSubject<LegendTarget | undefined>(undefined);

    render(
      <EchartsRender
        spec={{ series: [{ type: 'line', name: 'seriesA' }] }}
        highlightedLegendTarget$={highlightedLegendTarget$}
      />
    );

    act(() => {
      highlightedLegendTarget$.next({ type: 'series', name: 'seriesA' });
    });

    expect(mockEchartsInstance.dispatchAction).toHaveBeenCalledWith({
      type: 'highlight',
      seriesName: 'seriesA',
    });
  });

  it('highlights data targets by seriesIndex and name', () => {
    const highlightedLegendTarget$ = new BehaviorSubject<LegendTarget | undefined>(undefined);

    render(
      <EchartsRender
        spec={{ series: [{ type: 'pie', data: [{ name: 'sliceA', value: 1 }] }] }}
        highlightedLegendTarget$={highlightedLegendTarget$}
      />
    );

    act(() => {
      highlightedLegendTarget$.next({ type: 'data', name: 'sliceA', seriesIndex: 0 });
    });

    expect(mockEchartsInstance.dispatchAction).toHaveBeenCalledWith({
      type: 'highlight',
      seriesIndex: 0,
      name: 'sliceA',
    });
  });
});
