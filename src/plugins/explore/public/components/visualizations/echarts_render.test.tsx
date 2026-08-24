/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { act, render } from '@testing-library/react';
import { BehaviorSubject } from 'rxjs';
import { EchartsRender } from './echarts_render';
import { LegendTarget } from './utils/legend';

jest.mock('echarts', () => ({
  init: jest.fn(),
  registerTheme: jest.fn(),
}));

const createMockEchartsInstance = () => {
  const handlers = new Map<string, (params: any) => void>();
  const zrenderHandlers = new Map<string, () => void>();

  return {
    resize: jest.fn(),
    dispose: jest.fn(),
    isDisposed: jest.fn(() => false),
    on: jest.fn((event: string, handler: (params: any) => void) => {
      handlers.set(event, handler);
    }),
    off: jest.fn((event: string) => {
      handlers.delete(event);
    }),
    emit: (event: string, params: any) => handlers.get(event)?.(params),
    emitZrender: (event: string) => zrenderHandlers.get(event)?.(),
    getZr: jest.fn(() => ({
      on: jest.fn((event: string, handler: () => void) => {
        zrenderHandlers.set(event, handler);
      }),
      off: jest.fn((event: string) => {
        zrenderHandlers.delete(event);
      }),
    })),
    setOption: jest.fn(),
    setTheme: jest.fn(),
    dispatchAction: jest.fn(),
    convertToPixel: jest.fn(() => 180),
    getWidth: jest.fn(() => 400),
    getHeight: jest.fn(() => 300),
    getModel: jest.fn(() => ({
      getComponent: jest.fn(() => ({
        axis: {
          grid: {
            getRect: () => ({ x: 20, y: 30, width: 320, height: 180 }),
          },
        },
      })),
    })),
    group: '',
  };
};

describe('EchartsRender', () => {
  let mockEchartsInstances: Array<ReturnType<typeof createMockEchartsInstance>>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockEchartsInstances = [];
    jest.requireMock('echarts').init.mockImplementation(() => {
      const instance = createMockEchartsInstance();
      mockEchartsInstances.push(instance);
      return instance;
    });
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

    expect(mockEchartsInstances[0].dispatchAction).toHaveBeenCalledWith({
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

    expect(mockEchartsInstances[0].dispatchAction).toHaveBeenCalledWith({
      type: 'highlight',
      seriesIndex: 0,
      name: 'sliceA',
    });
  });

  it('stops synchronizing after the group is removed', () => {
    const spec = { series: [{ type: 'line' as const, data: [1, 2] }] };
    const { rerender } = render(
      <>
        <EchartsRender spec={spec} group="dashboard-123" />
        <EchartsRender spec={spec} group="dashboard-123" />
      </>
    );
    const [source, target] = mockEchartsInstances;
    const axesInfo = [{ axisDim: 'x', axisIndex: 0, value: 1234 }];

    act(() => {
      source.emitZrender('mousemove');
      source.emit('updateAxisPointer', { axesInfo });
    });
    expect(target.dispatchAction).toHaveBeenCalledTimes(1);

    target.dispatchAction.mockClear();
    rerender(
      <>
        <EchartsRender spec={spec} group="dashboard-123" />
        <EchartsRender spec={spec} />
      </>
    );
    expect(target.dispatchAction).toHaveBeenCalledWith({ type: 'hideTip' });
    expect(target.dispatchAction).toHaveBeenCalledWith({
      type: 'updateAxisPointer',
      currTrigger: 'leave',
    });

    target.dispatchAction.mockClear();
    act(() => {
      source.emit('updateAxisPointer', { axesInfo });
    });
    expect(target.dispatchAction).not.toHaveBeenCalled();
  });

  it('synchronizes an axis pointer using the target chart coordinates', () => {
    const spec = { series: [{ type: 'line' as const, data: [1, 2] }] };
    render(
      <>
        <EchartsRender spec={spec} group="dashboard-123" />
        <EchartsRender spec={spec} group="dashboard-123" />
      </>
    );

    const [source, target] = mockEchartsInstances;
    const axesInfo = [{ axisDim: 'x', axisIndex: 0, value: 1234 }];

    act(() => {
      source.emitZrender('mousemove');
      source.emit('updateAxisPointer', { axesInfo });
    });

    expect(target.convertToPixel).toHaveBeenCalledWith({ xAxisIndex: 0 }, 1234);
    expect(target.dispatchAction).toHaveBeenCalledWith({
      type: 'updateAxisPointer',
      axesInfo,
      x: 180,
      y: 120,
    });

    source.dispatchAction.mockClear();
    act(() => {
      target.emit('updateAxisPointer', { axesInfo });
    });
    expect(source.dispatchAction).not.toHaveBeenCalled();
  });

  it('clears a target when the shared axis value is outside its visible range', () => {
    const spec = { series: [{ type: 'line' as const, data: [1, 2] }] };
    render(
      <>
        <EchartsRender spec={spec} group="dashboard-123" />
        <EchartsRender spec={spec} group="dashboard-123" />
      </>
    );

    const [source, target] = mockEchartsInstances;
    const axesInfo = [{ axisDim: 'x', axisIndex: 0, value: 1234 }];

    act(() => {
      source.emitZrender('mousemove');
      source.emit('updateAxisPointer', { axesInfo });
    });
    expect(target.dispatchAction).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'updateAxisPointer' })
    );

    target.dispatchAction.mockClear();
    target.convertToPixel.mockReturnValue(500);
    act(() => {
      source.emit('updateAxisPointer', { axesInfo });
    });

    expect(target.dispatchAction).toHaveBeenCalledWith({ type: 'hideTip' });
    expect(target.dispatchAction).toHaveBeenCalledWith({
      type: 'updateAxisPointer',
      currTrigger: 'leave',
    });
  });

  it('hides synchronized tooltips and pointers when the source pointer leaves', () => {
    const spec = { series: [{ type: 'line' as const, data: [1, 2] }] };
    render(
      <>
        <EchartsRender spec={spec} group="dashboard-123" />
        <EchartsRender spec={spec} group="dashboard-123" />
      </>
    );

    const [source, target] = mockEchartsInstances;
    act(() => {
      source.emitZrender('mousemove');
      source.emitZrender('globalout');
    });

    expect(target.dispatchAction).toHaveBeenCalledWith({ type: 'hideTip' });
    expect(target.dispatchAction).toHaveBeenCalledWith({
      type: 'updateAxisPointer',
      currTrigger: 'leave',
    });
  });
});
