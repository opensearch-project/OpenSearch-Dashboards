/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisualizationBuilder } from './visualization_builder';
import { visualizationRegistry } from './visualization_registry';
import { VisColumn, VisFieldType } from './types';
import { VisualizationRegistryService } from '../../services/visualization_registry_service';

// Register all built-in visualizations into the singleton registry
new VisualizationRegistryService();

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
      const builder = new VisualizationBuilder({});
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
      const builder = new VisualizationBuilder({});
      const setVisConfigSpy = jest.spyOn(builder, 'setVisConfig');
      // mock invalid chart type at runtime
      builder.onChartTypeChange('invalid-chart-type' as any);
      expect(setVisConfigSpy).toHaveBeenCalledWith(undefined);
    });

    test('should do nothing if no config for chart type', () => {
      // Mock no chart type config
      const getVisualizationSpy = jest
        .spyOn(visualizationRegistry, 'getVisualization')
        .mockReturnValue(undefined);
      const builder = new VisualizationBuilder({});
      const setVisConfigSpy = jest.spyOn(builder, 'setVisConfig');
      builder.onChartTypeChange('line');
      expect(setVisConfigSpy).toHaveBeenCalledWith(undefined);
      getVisualizationSpy.mockRestore();
    });

    test('should reset styles to defaults if chart type changed', () => {
      const builder = new VisualizationBuilder({});
      const setVisConfigSpy = jest.spyOn(builder, 'setVisConfig');
      jest.spyOn(builder, 'setAxesMapping');
      jest.spyOn(builder, 'reuseCurrentAxesMapping');
      jest.spyOn(builder, 'createAutoVis');

      builder.visConfig$.next({ type: 'heatmap', styles: {} as any });

      // updated chart type
      builder.onChartTypeChange('line');
      const lineStyleDefaults = visualizationRegistry.getVisualization('line')?.ui.style.defaults;
      expect(setVisConfigSpy).toHaveBeenCalledWith({ type: 'line', styles: lineStyleDefaults });
    });

    test('should set chart type to table with current axes mapping', () => {
      const builder = new VisualizationBuilder({});
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
      const tableStyleDefaults = visualizationRegistry.getVisualization('table')?.ui.style.defaults;
      expect(setVisConfigSpy).toHaveBeenCalledWith({
        type: 'table',
        styles: tableStyleDefaults,
        axesMapping: { x: 'field0', y: 'field1' },
      });
    });

    test('should update axes mapping by reusing fields of the current axes mapping', () => {
      const builder = new VisualizationBuilder({});
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
      const builder = new VisualizationBuilder({});
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
      const builder = new VisualizationBuilder({});
      const setVisConfigSpy = jest.spyOn(builder, 'setVisConfig');
      jest.spyOn(builder, 'reuseCurrentAxesMapping');
      // mock auto visualization created
      jest.spyOn(builder, 'createAutoVis');

      builder.data$.next({
        numericalColumns: [],
        categoricalColumns: [],
        dateColumns: [],
        transformedData: [],
        unknownColumns: [],
      });
      builder.visConfig$.next({
        type: 'line',
        axesMapping: { theta: 'field0', color: 'field1' },
        // current chart type and styles
        styles: {} as any,
      });

      // update chart type
      builder.onChartTypeChange('bar');
      const defaultStyles = visualizationRegistry.getVisualization('bar')?.ui.style.defaults;
      expect(setVisConfigSpy).toHaveBeenCalledWith({ type: 'bar', styles: defaultStyles });
    });

    test('should turn off raw table when switching to table type', () => {
      const builder = new VisualizationBuilder({});

      builder.showRawTable$.next(true);
      builder.visConfig$.next({ type: 'bar', axesMapping: {}, styles: {} as any });

      builder.onChartTypeChange('table');
      expect(builder.showRawTable$.value).toBe(false);
    });
  });

  describe('createAutoVis()', () => {
    test('should return undefined if cannot find matched chart', () => {
      const builder = new VisualizationBuilder({});
      // Empty data
      expect(
        builder.createAutoVis({
          numericalColumns: [],
          categoricalColumns: [],
          dateColumns: [],
          transformedData: [],
          unknownColumns: [],
        })
      ).toBe(undefined);

      // Data with too many fields which won't match an existing rule
      expect(
        builder.createAutoVis({
          numericalColumns: createMockVisColumns(4, VisFieldType.Numerical),
          categoricalColumns: [],
          dateColumns: [],
          transformedData: [],
          unknownColumns: [],
        })
      ).toBe(undefined);

      // Auto create metric chart
      expect(
        builder.createAutoVis({
          numericalColumns: createMockVisColumns(1, VisFieldType.Numerical),
          categoricalColumns: [],
          dateColumns: [],
          transformedData: [],
          unknownColumns: [],
        })
      ).toEqual({ chartType: 'metric', axesMapping: { value: 'name-numerical-0' } });
    });
  });

  describe('reuseCurrentAxesMapping()', () => {
    test('return `undefined` if chart type is invalid', () => {
      const builder = new VisualizationBuilder({});
      const axesMapping = builder.reuseCurrentAxesMapping(
        // mock invalid chart type
        'invalid-chart-type' as any,
        { x: 'name-0', y: 'name-1' },
        undefined
      );
      expect(axesMapping).toBe(undefined);
    });

    test('should return new axes mapping', () => {
      const builder = new VisualizationBuilder({});
      const axesMapping = builder.reuseCurrentAxesMapping(
        'line',
        { theta: 'name-numerical-0', color: 'name-categorical-0' },
        {
          numericalColumns: createMockVisColumns(1, VisFieldType.Numerical),
          categoricalColumns: createMockVisColumns(1, VisFieldType.Categorical),
          dateColumns: [],
          transformedData: [],
          unknownColumns: [],
        }
      );
      // For line, the axes are x/y
      expect(axesMapping).toEqual({ x: 'name-categorical-0', y: ['name-numerical-0'] });
    });
  });

  describe('onDataChange()', () => {
    test('should do nothing if no data', () => {
      const builder = new VisualizationBuilder({});
      const setVisConfigSpy = jest.spyOn(builder, 'setVisConfig');
      jest.spyOn(builder, 'createAutoVis');

      // data is undefined
      builder.onDataChange(undefined);
      expect(setVisConfigSpy).not.toHaveBeenCalled();
    });

    test('should do nothing if chart type is `table`', () => {
      const builder = new VisualizationBuilder({});
      const setVisConfigSpy = jest.spyOn(builder, 'setVisConfig');
      jest.spyOn(builder, 'createAutoVis');

      builder.visConfig$.next({ type: 'table' });

      builder.onDataChange({
        numericalColumns: createMockVisColumns(1, VisFieldType.Numerical),
        categoricalColumns: createMockVisColumns(1, VisFieldType.Categorical),
        dateColumns: [],
        transformedData: [],
        unknownColumns: [],
      });
      expect(setVisConfigSpy).not.toHaveBeenCalled();
    });

    test('should create auto vis if chart type or axes mapping can no longer be applied to the data', () => {
      {
        const builder = new VisualizationBuilder({});
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
          unknownColumns: [],
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
        const builder = new VisualizationBuilder({});
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
          unknownColumns: [],
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
      const builder = new VisualizationBuilder({});
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
        unknownColumns: [],
      });
      expect(setVisConfigSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'table' }));
    });

    test('should do nothing if the axes mapping can be used on the data', () => {
      const builder = new VisualizationBuilder({});
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
        unknownColumns: [],
      });
      expect(setVisConfigSpy).not.toHaveBeenCalled();
    });

    test('should try to preserve current chart type using reuseAxesMapping', () => {
      const builder = new VisualizationBuilder({});
      const reuseAxesMappingSpy = jest
        .spyOn(visualizationRegistry, 'reuseAxesMapping')
        .mockReturnValue({ x: 'name-numerical-0', y: 'name-numerical-1' });

      builder.visConfig$.next({
        type: 'line',
        axesMapping: { x: 'name-date-0', y: 'name-numerical-0' },
      });

      builder.onDataChange({
        numericalColumns: createMockVisColumns(2, VisFieldType.Numerical),
        categoricalColumns: [],
        dateColumns: [],
        transformedData: [],
        unknownColumns: [],
      });

      expect(reuseAxesMappingSpy).toHaveBeenCalledWith(
        'line',
        { x: 'name-date-0', y: 'name-numerical-0' },
        expect.any(Array)
      );
      expect(builder.visConfig$.value?.type).toBe('line');
      reuseAxesMappingSpy.mockRestore();
    });

    test('should try to create auto vis with current chart type when reuseAxesMapping fails', () => {
      const builder = new VisualizationBuilder({});
      jest.spyOn(visualizationRegistry, 'reuseAxesMapping').mockReturnValue(undefined);
      const createAutoVisSpy = jest.spyOn(builder, 'createAutoVis');

      builder.visConfig$.next({
        type: 'line',
        axesMapping: { x: 'name-date-0', y: 'name-numerical-0' },
      });

      builder.onDataChange({
        numericalColumns: createMockVisColumns(2, VisFieldType.Numerical),
        categoricalColumns: [],
        dateColumns: [],
        transformedData: [],
        unknownColumns: [],
      });

      // Should call createAutoVis with the current chart type
      expect(createAutoVisSpy).toHaveBeenCalledWith(expect.anything(), 'line');
    });

    test('should preserve custom styles when preserving chart type', () => {
      const builder = new VisualizationBuilder({});
      const customStyles = { addLegend: true, title: 'My Chart' } as any;
      jest
        .spyOn(visualizationRegistry, 'reuseAxesMapping')
        .mockReturnValue({ x: 'name-numerical-0', y: 'name-numerical-1' });

      builder.visConfig$.next({
        type: 'line',
        axesMapping: { x: 'name-date-0', y: 'name-numerical-0' },
        styles: customStyles,
      });

      builder.onDataChange({
        numericalColumns: createMockVisColumns(2, VisFieldType.Numerical),
        categoricalColumns: [],
        dateColumns: [],
        transformedData: [],
        unknownColumns: [],
      });

      expect(builder.visConfig$.value?.type).toBe('line');
      expect(builder.visConfig$.value?.styles).toBe(customStyles);
    });

    test('should reset styles when falling back to any chart type', () => {
      const builder = new VisualizationBuilder({});
      const customStyles = { addLegend: true, title: 'My Chart' } as any;
      jest.spyOn(visualizationRegistry, 'reuseAxesMapping').mockReturnValue(undefined);
      jest.spyOn(builder, 'createAutoVis').mockImplementation((data, chartType) => {
        if (chartType) return undefined; // Fail for specific chart type
        return { chartType: 'bar', axesMapping: { x: 'field0', y: 'field1' } };
      });

      builder.visConfig$.next({
        type: 'line',
        axesMapping: { x: 'name-date-0', y: 'name-numerical-0' },
        styles: customStyles,
      });

      builder.onDataChange({
        numericalColumns: createMockVisColumns(2, VisFieldType.Numerical),
        categoricalColumns: [],
        dateColumns: [],
        transformedData: [],
        unknownColumns: [],
      });

      expect(builder.visConfig$.value?.type).toBe('bar');
      const defaultStyles = visualizationRegistry.getVisualization('bar')?.ui.style.defaults;
      expect(builder.visConfig$.value?.styles).toEqual(defaultStyles);
      expect(builder.visConfig$.value?.styles).not.toBe(customStyles);
    });

    test('should preserve splitField configuration across data changes', () => {
      const builder = new VisualizationBuilder({});
      jest
        .spyOn(visualizationRegistry, 'reuseAxesMapping')
        .mockReturnValue({ x: 'name-numerical-0', y: 'name-numerical-1' });

      builder.visConfig$.next({
        type: 'line',
        axesMapping: { x: 'name-date-0', y: 'name-numerical-0' },
        splitField: 'category',
        splitLayout: 'horizontal',
        showSplitLabel: true,
      });

      builder.onDataChange({
        numericalColumns: createMockVisColumns(2, VisFieldType.Numerical),
        categoricalColumns: [{ name: 'category', schema: 'categorical' } as any],
        dateColumns: [],
        transformedData: [],
        unknownColumns: [],
      });

      expect(builder.visConfig$.value?.splitField).toBe('category');
      expect(builder.visConfig$.value?.splitLayout).toBe('horizontal');
      expect(builder.visConfig$.value?.showSplitLabel).toBe(true);
    });
  });

  test('should update with normalized data', () => {
    const builder = new VisualizationBuilder({});
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
      unknownColumns: [],
    });
  });

  test('should set styles', () => {
    const builder = new VisualizationBuilder({});
    expect(builder.visConfig$.value).toBe(undefined);
    builder.setVisConfig({ type: 'line', styles: { addLegend: true } as any });
    expect(builder.visConfig$.value).toEqual({ type: 'line', styles: { addLegend: true } as any });
  });

  test('should update styles', () => {
    const builder = new VisualizationBuilder({});
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
    const builder = new VisualizationBuilder({});
    // initial vis config
    builder.visConfig$.next({ type: 'line' });
    expect(builder.visConfig$.value?.axesMapping).toEqual(undefined);
    builder.setAxesMapping({ x: 'field-0', y: 'field-1' });
    expect(builder.visConfig$.value?.axesMapping).toEqual({ x: 'field-0', y: 'field-1' });
  });

  test('should set chart type', () => {
    const builder = new VisualizationBuilder({});
    expect(builder.visConfig$.value?.type).toBe(undefined);
    builder.setCurrentChartType('heatmap');
    expect(builder.visConfig$.value?.type).toBe('heatmap');
  });

  test('should reset vis state', () => {
    const builder = new VisualizationBuilder({});
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

  describe('applyVisConfig()', () => {
    test('should apply valid config and return true', () => {
      const builder = new VisualizationBuilder({});
      const result = (builder as any).applyVisConfig('line', { x: 'field0', y: 'field1' }, false);

      expect(result).toBe(true);
      expect(builder.visConfig$.value?.type).toBe('line');
      expect(builder.visConfig$.value?.axesMapping).toEqual({ x: 'field0', y: 'field1' });
    });

    test('should return false for invalid chart type', () => {
      const builder = new VisualizationBuilder({});
      // Mock invalid chart type
      const getVisualizationSpy = jest
        .spyOn(visualizationRegistry, 'getVisualization')
        .mockReturnValue(undefined);

      const result = (builder as any).applyVisConfig('invalid-type', {}, false);

      expect(result).toBe(false);
      expect(builder.visConfig$.value).toBe(undefined);
      getVisualizationSpy.mockRestore();
    });

    test('should preserve split field configuration', () => {
      const builder = new VisualizationBuilder({});
      builder.visConfig$.next({
        type: 'bar',
        splitField: 'category',
        splitLayout: 'horizontal',
        showSplitLabel: true,
      });

      const result = (builder as any).applyVisConfig('line', { x: 'field0', y: 'field1' }, false);

      expect(result).toBe(true);
      expect(builder.visConfig$.value?.splitField).toBe('category');
      expect(builder.visConfig$.value?.splitLayout).toBe('horizontal');
      expect(builder.visConfig$.value?.showSplitLabel).toBe(true);
    });

    test('should preserve styles when preserveStyles is true', () => {
      const builder = new VisualizationBuilder({});
      const customStyles = { addLegend: true, title: 'Custom Title' } as any;
      builder.visConfig$.next({
        type: 'bar',
        styles: customStyles,
      });

      const result = (builder as any).applyVisConfig('line', { x: 'field0', y: 'field1' }, true);

      expect(result).toBe(true);
      expect(builder.visConfig$.value?.styles).toBe(customStyles);
    });

    test('should use default styles when preserveStyles is false', () => {
      const builder = new VisualizationBuilder({});
      const customStyles = { addLegend: true, title: 'Custom Title' } as any;
      builder.visConfig$.next({
        type: 'bar',
        styles: customStyles,
      });

      const result = (builder as any).applyVisConfig('line', { x: 'field0', y: 'field1' }, false);
      const defaultStyles = visualizationRegistry.getVisualization('line')?.ui.style.defaults;

      expect(result).toBe(true);
      expect(builder.visConfig$.value?.styles).toEqual(defaultStyles);
      expect(builder.visConfig$.value?.styles).not.toBe(customStyles);
    });
  });
});

describe('showRawTable$', () => {
  test('should update when calling setShowRawTable', () => {
    const builder = new VisualizationBuilder({});

    expect(builder.showRawTable$.value).toBe(false);
    builder.setShowRawTable(true);
    expect(builder.showRawTable$.value).toBe(true);
  });
});
