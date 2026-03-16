/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisualizationBuilder } from './visualization_builder';
import { visualizationRegistry } from './visualization_registry';
import { VisColumn, VisFieldType } from './types';
import { expressionsPluginMock } from '../../../../expressions/public/mocks';

const createMockVisColumns = (
  size: number,
  type: VisFieldType,
  options = { validValuesCount: 1, uniqueValuesCount: 1 }
) => {
  const result: VisColumn[] = [];
  for (let i = 0; i < size; i++) {
    result.push({
      id: i,
      name: `name-${type}-${i}`,
      schema: type,
      column: `field-${type}-${i}`,
      ...options,
    });
  }
  return result;
};

describe('VisualizationBuilder', () => {
  describe('init()', () => {
    test('it should init() once', () => {
      const builder = new VisualizationBuilder({
        getExpressions: () => expressionsPluginMock.createStartContract(),
      });
      const setIsInitializedSpy = jest.spyOn(builder, 'setIsInitialized');

      builder.init();
      expect(setIsInitializedSpy).toHaveBeenCalledWith(true);
      expect(setIsInitializedSpy).toHaveBeenCalledTimes(1);

      builder.init();
      expect(setIsInitializedSpy).toHaveBeenCalledTimes(1);
    });

    test('should initiate with url state', () => {
      const urlStateStorageMock = {
        set: jest.fn(),
        get: jest.fn().mockReturnValue({
          chartType: 'line',
          axesMapping: { x: 'field0', y: 'field1' },
          styleOptions: { addLegend: true },
        }),
        cancel: jest.fn(),
        flush: jest.fn(),
        change$: jest.fn(),
      };
      const builder = new VisualizationBuilder({
        getUrlStateStorage: () => urlStateStorageMock,
        getExpressions: () => expressionsPluginMock.createStartContract(),
      });
      const setVisConfigSpy = jest.spyOn(builder, 'setVisConfig');

      builder.init();

      expect(setVisConfigSpy).toHaveBeenCalledWith({
        styles: { addLegend: true },
        type: 'line',
        axesMapping: { x: 'field0', y: 'field1' },
      });
    });
  });

  describe('onChartTypeChange()', () => {
    test('should do nothing if chart type is invalid', () => {
      const builder = new VisualizationBuilder({
        getExpressions: () => expressionsPluginMock.createStartContract(),
      });
      const setVisConfigSpy = jest.spyOn(builder, 'setVisConfig');
      // mock invalid chart type at runtime
      builder.onChartTypeChange('invalid-chart-type' as any);
      expect(setVisConfigSpy).toHaveBeenCalledWith(undefined);
    });

    test('should do nothing if no config for chart type', () => {
      // Mock no chart type config
      const getVisualizationConfigSpy = jest
        .spyOn(visualizationRegistry, 'getVisualizationConfig')
        .mockReturnValue(undefined);
      const builder = new VisualizationBuilder({
        getExpressions: () => expressionsPluginMock.createStartContract(),
      });
      const setVisConfigSpy = jest.spyOn(builder, 'setVisConfig');
      builder.onChartTypeChange('line');
      expect(setVisConfigSpy).toHaveBeenCalledWith(undefined);
      getVisualizationConfigSpy.mockRestore();
    });

    test('should reset styles to defaults if chart type changed', () => {
      const builder = new VisualizationBuilder({
        getExpressions: () => expressionsPluginMock.createStartContract(),
      });
      const setVisConfigSpy = jest.spyOn(builder, 'setVisConfig');
      jest.spyOn(builder, 'setAxesMapping');
      jest.spyOn(builder, 'reuseCurrentAxesMapping');
      jest.spyOn(builder, 'createAutoVis');

      builder.visConfig$.next({ type: 'heatmap', styles: {} as any });

      // updated chart type
      builder.onChartTypeChange('line');
      const lineStyleDefaults = visualizationRegistry.getVisualizationConfig('line')?.ui.style
        .defaults;
      expect(setVisConfigSpy).toHaveBeenCalledWith({ type: 'line', styles: lineStyleDefaults });
    });

    test('should set chart type to table with current axes mapping', () => {
      const builder = new VisualizationBuilder({
        getExpressions: () => expressionsPluginMock.createStartContract(),
      });
      const setVisConfigSpy = jest.spyOn(builder, 'setVisConfig');
      jest.spyOn(builder, 'reuseCurrentAxesMapping');
      jest.spyOn(builder, 'createAutoVis');

      builder.visConfig$.next({
        type: 'bar',
        axesMapping: { x: 'field0', y: 'field1' },
        styles: {} as any,
      });

      // updated chart type
      builder.onChartTypeChange('table');
      const tableStyleDefaults = visualizationRegistry.getVisualizationConfig('table')?.ui.style
        .defaults;
      expect(setVisConfigSpy).toHaveBeenCalledWith({
        type: 'table',
        styles: tableStyleDefaults,
        axesMapping: { x: 'field0', y: 'field1' },
      });
    });

    test('should update axes mapping by reusing fields of the current axes mapping', () => {
      const builder = new VisualizationBuilder({
        getExpressions: () => expressionsPluginMock.createStartContract(),
      });
      const setVisConfigSpy = jest.spyOn(builder, 'setVisConfig');
      jest.spyOn(builder, 'reuseCurrentAxesMapping').mockReturnValue({ x: 'field0', y: 'field1' });
      jest.spyOn(builder, 'createAutoVis');

      builder.visConfig$.next({
        type: 'pie',
        styles: {} as any,
        axesMapping: { theta: 'field0', color: 'field1' },
      });

      // updated chart type
      builder.onChartTypeChange('line');
      expect(setVisConfigSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'line',
          axesMapping: { x: 'field0', y: 'field1' },
        })
      );
    });

    test('should update axes mapping based on the auto create chart', () => {
      const builder = new VisualizationBuilder({
        getExpressions: () => expressionsPluginMock.createStartContract(),
      });
      const setVisConfigSpy = jest.spyOn(builder, 'setVisConfig');
      jest.spyOn(builder, 'reuseCurrentAxesMapping');
      // mock auto visualization created
      jest
        .spyOn(builder, 'createAutoVis')
        .mockReturnValue({ chartType: 'line', axesMapping: { x: 'field0', y: 'field1' } });

      builder.visConfig$.next({
        type: 'pie',
        axesMapping: { theta: 'field0', color: 'field1' },
        styles: {} as any,
      });

      // updated chart type
      builder.onChartTypeChange('line');
      expect(setVisConfigSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'line',
          axesMapping: { x: 'field0', y: 'field1' },
        })
      );
    });

    test('should fallback to reset axes mapping to empty ', () => {
      const builder = new VisualizationBuilder({
        getExpressions: () => expressionsPluginMock.createStartContract(),
      });
      const setVisConfigSpy = jest.spyOn(builder, 'setVisConfig');
      jest.spyOn(builder, 'reuseCurrentAxesMapping');
      // mock auto visualization created
      jest.spyOn(builder, 'createAutoVis');

      builder.data$.next({
        numericalColumns: [],
        categoricalColumns: [],
        dateColumns: [],
        transformedData: [],
      });
      builder.visConfig$.next({
        type: 'line',
        axesMapping: { theta: 'field0', color: 'field1' },
        // current chart type and styles
        styles: {} as any,
      });

      // update chart type
      builder.onChartTypeChange('bar');
      const defaultStyles = visualizationRegistry.getVisualizationConfig('bar')?.ui.style.defaults;
      expect(setVisConfigSpy).toHaveBeenCalledWith({ type: 'bar', styles: defaultStyles });
    });

    test('should turn off raw table when switching to table type', () => {
      const builder = new VisualizationBuilder({
        getExpressions: () => expressionsPluginMock.createStartContract(),
      });

      builder.showRawTable$.next(true);
      builder.visConfig$.next({ type: 'bar', axesMapping: {}, styles: {} as any });

      builder.onChartTypeChange('table');
      expect(builder.showRawTable$.value).toBe(false);
    });
  });

  describe('createAutoVis()', () => {
    test('should return undefined if cannot find matched chart', () => {
      const builder = new VisualizationBuilder({
        getExpressions: () => expressionsPluginMock.createStartContract(),
      });
      // Empty data
      expect(
        builder.createAutoVis({
          numericalColumns: [],
          categoricalColumns: [],
          dateColumns: [],
          transformedData: [],
        })
      ).toBe(undefined);

      // Data with too many fields which won't match an existing rule
      expect(
        builder.createAutoVis({
          numericalColumns: createMockVisColumns(4, VisFieldType.Numerical),
          categoricalColumns: [],
          dateColumns: [],
          transformedData: [],
        })
      ).toBe(undefined);

      // Auto create metric chart
      expect(
        builder.createAutoVis({
          numericalColumns: createMockVisColumns(1, VisFieldType.Numerical),
          categoricalColumns: [],
          dateColumns: [],
          transformedData: [],
        })
      ).toEqual({ chartType: 'metric', axesMapping: { value: 'name-numerical-0' } });
    });
  });

  describe('reuseCurrentAxesMapping()', () => {
    test('return `undefined` if chart type is invalid', () => {
      const builder = new VisualizationBuilder({
        getExpressions: () => expressionsPluginMock.createStartContract(),
      });
      const axesMapping = builder.reuseCurrentAxesMapping(
        // mock invalid chart type
        'invalid-chart-type' as any,
        { x: 'name-0', y: 'name-1' },
        undefined
      );
      expect(axesMapping).toBe(undefined);
    });

    test('should return new axes mapping', () => {
      const builder = new VisualizationBuilder({
        getExpressions: () => expressionsPluginMock.createStartContract(),
      });
      const axesMapping = builder.reuseCurrentAxesMapping(
        'line',
        { theta: 'name-numerical-0', color: 'name-categorical-0' },
        {
          numericalColumns: createMockVisColumns(1, VisFieldType.Numerical),
          categoricalColumns: createMockVisColumns(1, VisFieldType.Categorical),
          dateColumns: [],
          transformedData: [],
        }
      );
      // For line, the axes are x/y
      expect(axesMapping).toEqual({ x: 'name-categorical-0', y: 'name-numerical-0' });
    });
  });

  describe('onDataChange()', () => {
    test('should do nothing if no data', () => {
      const builder = new VisualizationBuilder({
        getExpressions: () => expressionsPluginMock.createStartContract(),
      });
      const setVisConfigSpy = jest.spyOn(builder, 'setVisConfig');
      jest.spyOn(builder, 'createAutoVis');

      // data is undefined
      builder.onDataChange(undefined);
      expect(setVisConfigSpy).not.toHaveBeenCalled();
    });

    test('should do nothing if chart type is `table`', () => {
      const builder = new VisualizationBuilder({
        getExpressions: () => expressionsPluginMock.createStartContract(),
      });
      const setVisConfigSpy = jest.spyOn(builder, 'setVisConfig');
      jest.spyOn(builder, 'createAutoVis');

      builder.visConfig$.next({ type: 'table' });

      builder.onDataChange({
        numericalColumns: createMockVisColumns(1, VisFieldType.Numerical),
        categoricalColumns: createMockVisColumns(1, VisFieldType.Categorical),
        dateColumns: [],
        transformedData: [],
      });
      expect(setVisConfigSpy).not.toHaveBeenCalled();
    });

    test('should create auto vis if chart type or axes mapping can no longer be applied to the data', () => {
      {
        const builder = new VisualizationBuilder({
          getExpressions: () => expressionsPluginMock.createStartContract(),
        });
        const setVisConfigSpy = jest.spyOn(builder, 'setVisConfig');
        jest.spyOn(builder, 'createAutoVis').mockReturnValue({
          chartType: 'scatter',
          axesMapping: { x: 'name-numerical-0', y: 'name-numerical-1' },
        });

        builder.visConfig$.next({ type: 'metric' });

        // Multi data points won't work with metric
        builder.onDataChange({
          numericalColumns: createMockVisColumns(2, VisFieldType.Numerical, {
            validValuesCount: 2,
            uniqueValuesCount: 2,
          }),
          categoricalColumns: [],
          dateColumns: [],
          transformedData: [],
        });
        expect(setVisConfigSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'scatter',
            styles: expect.anything(),
            axesMapping: {
              x: 'name-numerical-0',
              y: 'name-numerical-1',
            },
          })
        );
      }
      {
        const builder = new VisualizationBuilder({
          getExpressions: () => expressionsPluginMock.createStartContract(),
        });
        const setVisConfigSpy = jest.spyOn(builder, 'setVisConfig');
        jest.spyOn(builder, 'createAutoVis').mockReturnValue({
          chartType: 'scatter',
          axesMapping: { x: 'name-numerical-0', y: 'name-numerical-1' },
        });

        builder.visConfig$.next({
          type: 'line',
          // Mapping won't work with the data
          axesMapping: { x: 'name-date-0', y: 'name-numerical-0' },
        });

        builder.onDataChange({
          numericalColumns: createMockVisColumns(2, VisFieldType.Numerical, {
            validValuesCount: 2,
            uniqueValuesCount: 2,
          }),
          categoricalColumns: [],
          dateColumns: [],
          transformedData: [],
        });
        expect(setVisConfigSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'scatter',
            styles: expect.anything(),
            axesMapping: {
              x: 'name-numerical-0',
              y: 'name-numerical-1',
            },
          })
        );
      }
    });

    test('should show a table if no auto vis can be created when chart type or axes mapping can no longer be applied to the data', () => {
      const builder = new VisualizationBuilder({
        getExpressions: () => expressionsPluginMock.createStartContract(),
      });
      const setVisConfigSpy = jest.spyOn(builder, 'setVisConfig');
      jest.spyOn(builder, 'setAxesMapping');
      // Mock auto vis cannot be created
      jest.spyOn(builder, 'createAutoVis').mockReturnValue(undefined);
      builder.visConfig$.next({
        type: 'line',
        // Mapping won't work with the data
        axesMapping: { x: 'name-date-0', y: 'name-numerical-0' },
      });

      builder.onDataChange({
        numericalColumns: createMockVisColumns(2, VisFieldType.Numerical, {
          validValuesCount: 2,
          uniqueValuesCount: 2,
        }),
        categoricalColumns: [],
        dateColumns: [],
        transformedData: [],
      });
      expect(setVisConfigSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'table' }));
    });

    test('should do nothing if the axes mapping can be used on the data', () => {
      const builder = new VisualizationBuilder({
        getExpressions: () => expressionsPluginMock.createStartContract(),
      });
      const setVisConfigSpy = jest.spyOn(builder, 'setVisConfig');
      jest.spyOn(builder, 'createAutoVis');

      builder.visConfig$.next({
        type: 'line',
        // Mapping can be applied to the data
        axesMapping: { x: 'name-date-0', y: 'name-numerical-0' },
      });

      builder.onDataChange({
        numericalColumns: createMockVisColumns(1, VisFieldType.Numerical),
        categoricalColumns: [],
        dateColumns: createMockVisColumns(1, VisFieldType.Date),
        transformedData: [],
      });
      expect(setVisConfigSpy).not.toHaveBeenCalled();
    });
  });

  test('should update with normalized data', () => {
    const builder = new VisualizationBuilder({
      getExpressions: () => expressionsPluginMock.createStartContract(),
    });
    builder.handleData(
      [{ _id: '_id', _index: '_index', _score: 10, _source: { age: 10, name: 'name' } }],
      [
        { type: 'int', name: 'age' },
        { type: 'text', name: 'name' },
      ]
    );
    expect(builder.data$.value).toEqual({
      categoricalColumns: [
        {
          column: 'field-1',
          id: 1,
          name: 'name',
          schema: 'categorical',
          uniqueValuesCount: 1,
          validValuesCount: 1,
        },
      ],
      dateColumns: [],
      numericalColumns: [
        {
          column: 'field-0',
          id: 0,
          name: 'age',
          schema: 'numerical',
          uniqueValuesCount: 1,
          validValuesCount: 1,
        },
      ],
      transformedData: [
        {
          'field-0': 10,
          'field-1': 'name',
        },
      ],
    });
  });

  test('should set styles', () => {
    const builder = new VisualizationBuilder({
      getExpressions: () => expressionsPluginMock.createStartContract(),
    });
    expect(builder.visConfig$.value).toBe(undefined);
    builder.setVisConfig({ type: 'line', styles: { addLegend: true } as any });
    expect(builder.visConfig$.value).toEqual({ type: 'line', styles: { addLegend: true } as any });
  });

  test('should update styles', () => {
    const builder = new VisualizationBuilder({
      getExpressions: () => expressionsPluginMock.createStartContract(),
    });
    expect(builder.visConfig$.value).toBe(undefined);
    builder.setVisConfig({
      type: 'line',
      styles: { addLegend: true } as any,
      axesMapping: { x: 'field0', y: 'field1' },
    });
    expect(builder.visConfig$.value).toEqual({
      type: 'line',
      styles: { addLegend: true },
      axesMapping: { x: 'field0', y: 'field1' },
    });

    builder.updateStyles({ addLegend: false, title: 'title' });
    expect(builder.visConfig$.value).toEqual({
      type: 'line',
      styles: { addLegend: false, title: 'title' },
      axesMapping: { x: 'field0', y: 'field1' },
    });
  });

  test('should set axes mapping', () => {
    const builder = new VisualizationBuilder({
      getExpressions: () => expressionsPluginMock.createStartContract(),
    });
    // initial vis config
    builder.visConfig$.next({ type: 'line' });
    expect(builder.visConfig$.value?.axesMapping).toEqual(undefined);
    builder.setAxesMapping({ x: 'field-0', y: 'field-1' });
    expect(builder.visConfig$.value?.axesMapping).toEqual({ x: 'field-0', y: 'field-1' });
  });

  test('should set chart type', () => {
    const builder = new VisualizationBuilder({
      getExpressions: () => expressionsPluginMock.createStartContract(),
    });
    expect(builder.visConfig$.value?.type).toBe(undefined);
    builder.setCurrentChartType('heatmap');
    expect(builder.visConfig$.value?.type).toBe('heatmap');
  });

  test('should reset vis state', () => {
    const builder = new VisualizationBuilder({
      getExpressions: () => expressionsPluginMock.createStartContract(),
    });
    builder.setVisConfig({
      type: 'bar',
      styles: { addLegend: true } as any,
      axesMapping: { x: 'name', y: 'age' },
    });
    builder.handleData(
      [{ _id: '_id', _index: '_index', _score: 10, _source: { age: 10, name: 'name' } }],
      [
        { type: 'int', name: 'age' },
        { type: 'text', name: 'name' },
      ]
    );
    expect(builder.data$.value).not.toBe(undefined);
    expect(builder.visConfig$.value).not.toBe(undefined);

    builder.reset();

    expect(builder.data$.value).toBe(undefined);
    expect(builder.visConfig$.value).toBe(undefined);
  });
});

describe('showRawTable$', () => {
  test('should update when calling setShowRawTable', () => {
    const builder = new VisualizationBuilder({
      getExpressions: () => expressionsPluginMock.createStartContract(),
    });

    expect(builder.showRawTable$.value).toBe(false);
    builder.setShowRawTable(true);
    expect(builder.showRawTable$.value).toBe(true);
  });
});
