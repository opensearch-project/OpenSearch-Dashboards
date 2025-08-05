/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisualizationBuilder } from './visualization_builder';
import { visualizationRegistry } from './visualization_registry';
import { VisColumn, VisFieldType } from './types';

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
      const builder = new VisualizationBuilder({ urlStateStorage: urlStateStorageMock });
      const setCurrentChartTypeSpy = jest.spyOn(builder, 'setCurrentChartType');
      const setStylesSpy = jest.spyOn(builder, 'setStyles');
      const setAxesMappingSpy = jest.spyOn(builder, 'setAxesMapping');

      builder.init();

      expect(setCurrentChartTypeSpy).toHaveBeenCalledWith('line');
      expect(setAxesMappingSpy).toHaveBeenCalledWith({ x: 'field0', y: 'field1' });
      expect(setStylesSpy).toHaveBeenCalledWith({ styles: { addLegend: true }, type: 'line' });
    });
  });

  describe('onChartTypeChange()', () => {
    test('should do nothing if chart type is invalid', () => {
      const builder = new VisualizationBuilder({});
      const setStylesSpy = jest.spyOn(builder, 'setStyles');
      const setAxesMappingSpy = jest.spyOn(builder, 'setAxesMapping');
      builder.onChartTypeChange(
        { numericalColumns: [], categoricalColumns: [], dateColumns: [], transformedData: [] },
        // mock invalid chart type at runtime
        'invalid-chart-type' as any,
        {}
      );
      expect(setStylesSpy).not.toHaveBeenCalled();
      expect(setAxesMappingSpy).not.toHaveBeenCalled();
    });

    test('should do nothing if no config for chart type', () => {
      const getVisualizationConfigSpy = jest
        .spyOn(visualizationRegistry, 'getVisualizationConfig')
        .mockReturnValue(undefined);
      const builder = new VisualizationBuilder({});
      const setStylesSpy = jest.spyOn(builder, 'setStyles');
      const setAxesMappingSpy = jest.spyOn(builder, 'setAxesMapping');
      builder.onChartTypeChange(
        { numericalColumns: [], categoricalColumns: [], dateColumns: [], transformedData: [] },
        'line',
        {}
      );
      expect(setStylesSpy).not.toHaveBeenCalled();
      expect(setAxesMappingSpy).not.toHaveBeenCalled();
      getVisualizationConfigSpy.mockRestore();
    });

    test('should reset styles to defaults if chart type changed', () => {
      const builder = new VisualizationBuilder({});
      const setStylesSpy = jest.spyOn(builder, 'setStyles');
      jest.spyOn(builder, 'setAxesMapping');
      jest.spyOn(builder, 'reuseCurrentAxesMapping');
      jest.spyOn(builder, 'createAutoVis');

      builder.onChartTypeChange(
        { numericalColumns: [], categoricalColumns: [], dateColumns: [], transformedData: [] },
        // updated chart type
        'line',
        {},
        // current chart type and styles
        { type: 'heatmap', styles: {} as any }
      );
      const lineStyleDefaults = visualizationRegistry.getVisualizationConfig('line')?.ui.style
        .defaults;
      expect(setStylesSpy).toHaveBeenCalledWith({ type: 'line', styles: lineStyleDefaults });
    });

    test('should do nothing if chart type is table', () => {
      const builder = new VisualizationBuilder({});
      jest.spyOn(builder, 'setStyles');
      const setAxesMappingSpy = jest.spyOn(builder, 'setAxesMapping');
      jest.spyOn(builder, 'reuseCurrentAxesMapping');
      jest.spyOn(builder, 'createAutoVis');

      builder.onChartTypeChange(
        { numericalColumns: [], categoricalColumns: [], dateColumns: [], transformedData: [] },
        // updated chart type
        'table',
        {},
        // current chart type and styles
        { type: 'heatmap', styles: {} as any }
      );
      expect(setAxesMappingSpy).not.toHaveBeenCalled();
    });

    test('should update axes mapping by reusing fields of the current axes mapping', () => {
      const builder = new VisualizationBuilder({});
      jest.spyOn(builder, 'setStyles');
      const setAxesMappingSpy = jest.spyOn(builder, 'setAxesMapping');
      jest.spyOn(builder, 'reuseCurrentAxesMapping').mockReturnValue({ x: 'field0', y: 'field1' });
      jest.spyOn(builder, 'createAutoVis');

      builder.onChartTypeChange(
        { numericalColumns: [], categoricalColumns: [], dateColumns: [], transformedData: [] },
        // updated chart type
        'line',
        { theta: 'field0', color: 'field1' },
        // current chart type and styles
        { type: 'pie', styles: {} as any }
      );
      expect(setAxesMappingSpy).toHaveBeenCalledWith({ x: 'field0', y: 'field1' });
    });

    test('should update axes mapping based on the auto create chart', () => {
      const builder = new VisualizationBuilder({});
      jest.spyOn(builder, 'setStyles');
      const setAxesMappingSpy = jest.spyOn(builder, 'setAxesMapping');
      jest.spyOn(builder, 'reuseCurrentAxesMapping');
      // mock auto visualization created
      jest
        .spyOn(builder, 'createAutoVis')
        .mockReturnValue({ chartType: 'line', axesMapping: { x: 'field0', y: 'field1' } });

      builder.onChartTypeChange(
        { numericalColumns: [], categoricalColumns: [], dateColumns: [], transformedData: [] },
        // updated chart type
        'line',
        { theta: 'field0', color: 'field1' },
        // current chart type and styles
        { type: 'pie', styles: {} as any }
      );
      expect(setAxesMappingSpy).toHaveBeenCalledWith({ x: 'field0', y: 'field1' });
    });

    test('should fallback to reset axes mapping to empty ', () => {
      const builder = new VisualizationBuilder({});
      jest.spyOn(builder, 'setStyles');
      const setAxesMappingSpy = jest.spyOn(builder, 'setAxesMapping');
      jest.spyOn(builder, 'reuseCurrentAxesMapping');
      // mock auto visualization created
      jest.spyOn(builder, 'createAutoVis');

      builder.onChartTypeChange(
        { numericalColumns: [], categoricalColumns: [], dateColumns: [], transformedData: [] },
        // updated chart type
        'line',
        { theta: 'field0', color: 'field1' },
        // current chart type and styles
        { type: 'pie', styles: {} as any }
      );
      expect(setAxesMappingSpy).toHaveBeenCalledWith({});
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
        }
      );
      // For line, the axes are x/y
      expect(axesMapping).toEqual({ x: 'name-categorical-0', y: 'name-numerical-0' });
    });
  });

  describe('onDataChange()', () => {
    test('should do nothing if no data', () => {
      const builder = new VisualizationBuilder({});
      const setStylesSpy = jest.spyOn(builder, 'setStyles');
      const setAxesMappingSpy = jest.spyOn(builder, 'setAxesMapping');
      const setCurrentChartTypeSpy = jest.spyOn(builder, 'setCurrentChartType');
      jest.spyOn(builder, 'createAutoVis');

      // data is undefined
      builder.onDataChange(undefined);
      expect(setStylesSpy).not.toHaveBeenCalled();
      expect(setAxesMappingSpy).not.toHaveBeenCalled();
      expect(setCurrentChartTypeSpy).not.toHaveBeenCalled();
    });

    test('should do nothing if chart type is `table`', () => {
      const builder = new VisualizationBuilder({});
      const setStylesSpy = jest.spyOn(builder, 'setStyles');
      const setAxesMappingSpy = jest.spyOn(builder, 'setAxesMapping');
      const setCurrentChartTypeSpy = jest.spyOn(builder, 'setCurrentChartType');
      jest.spyOn(builder, 'createAutoVis');

      // data is undefined
      builder.onDataChange(
        {
          numericalColumns: createMockVisColumns(1, VisFieldType.Numerical),
          categoricalColumns: createMockVisColumns(1, VisFieldType.Categorical),
          dateColumns: [],
          transformedData: [],
        },
        'table'
      );
      expect(setStylesSpy).not.toHaveBeenCalled();
      expect(setAxesMappingSpy).not.toHaveBeenCalled();
      expect(setCurrentChartTypeSpy).not.toHaveBeenCalled();
    });

    test('should create auto vis if chart type or axes mapping can no longer be applied to the data', () => {
      {
        const builder = new VisualizationBuilder({});
        const setStylesSpy = jest.spyOn(builder, 'setStyles');
        const setAxesMappingSpy = jest.spyOn(builder, 'setAxesMapping');
        const setCurrentChartTypeSpy = jest.spyOn(builder, 'setCurrentChartType');
        jest.spyOn(builder, 'createAutoVis').mockReturnValue({
          chartType: 'scatter',
          axesMapping: { x: 'name-numerical-0', y: 'name-numerical-1' },
        });

        // Multi data points won't work with metric
        builder.onDataChange(
          {
            numericalColumns: createMockVisColumns(2, VisFieldType.Numerical, {
              validValuesCount: 2,
              uniqueValuesCount: 2,
            }),
            categoricalColumns: [],
            dateColumns: [],
            transformedData: [],
          },
          'metric'
        );
        expect(setStylesSpy).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'scatter', styles: expect.anything() })
        );
        expect(setAxesMappingSpy).toHaveBeenCalledWith({
          x: 'name-numerical-0',
          y: 'name-numerical-1',
        });
        expect(setCurrentChartTypeSpy).toHaveBeenCalledWith('scatter');
      }
      {
        const builder = new VisualizationBuilder({});
        const setStylesSpy = jest.spyOn(builder, 'setStyles');
        const setAxesMappingSpy = jest.spyOn(builder, 'setAxesMapping');
        const setCurrentChartTypeSpy = jest.spyOn(builder, 'setCurrentChartType');
        jest.spyOn(builder, 'createAutoVis').mockReturnValue({
          chartType: 'scatter',
          axesMapping: { x: 'name-numerical-0', y: 'name-numerical-1' },
        });

        builder.onDataChange(
          {
            numericalColumns: createMockVisColumns(2, VisFieldType.Numerical, {
              validValuesCount: 2,
              uniqueValuesCount: 2,
            }),
            categoricalColumns: [],
            dateColumns: [],
            transformedData: [],
          },
          'line',
          // Mapping won't work with the data
          { x: 'name-date-0', y: 'name-numerical-0' }
        );
        expect(setStylesSpy).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'scatter', styles: expect.anything() })
        );
        expect(setAxesMappingSpy).toHaveBeenCalledWith({
          x: 'name-numerical-0',
          y: 'name-numerical-1',
        });
        expect(setCurrentChartTypeSpy).toHaveBeenCalledWith('scatter');
      }
    });

    test('should show a table if no auto vis can be created when chart type or axes mapping can no longer be applied to the data', () => {
      const builder = new VisualizationBuilder({});
      jest.spyOn(builder, 'setStyles');
      jest.spyOn(builder, 'setAxesMapping');
      const setCurrentChartTypeSpy = jest.spyOn(builder, 'setCurrentChartType');
      // Mock auto vis cannot be created
      jest.spyOn(builder, 'createAutoVis').mockReturnValue(undefined);

      builder.onDataChange(
        {
          numericalColumns: createMockVisColumns(2, VisFieldType.Numerical, {
            validValuesCount: 2,
            uniqueValuesCount: 2,
          }),
          categoricalColumns: [],
          dateColumns: [],
          transformedData: [],
        },
        'line',
        // Mapping won't work with the data
        { x: 'name-date-0', y: 'name-numerical-0' }
      );
      expect(setCurrentChartTypeSpy).toHaveBeenCalledWith('table');
    });

    test('should do nothing if the axes mapping can be used on the data', () => {
      const builder = new VisualizationBuilder({});
      const setStylesSpy = jest.spyOn(builder, 'setStyles');
      const setAxesMappingSpy = jest.spyOn(builder, 'setAxesMapping');
      const setCurrentChartTypeSpy = jest.spyOn(builder, 'setCurrentChartType');
      jest.spyOn(builder, 'createAutoVis');

      builder.onDataChange(
        {
          numericalColumns: createMockVisColumns(1, VisFieldType.Numerical),
          categoricalColumns: [],
          dateColumns: createMockVisColumns(1, VisFieldType.Date),
          transformedData: [],
        },
        'line',
        // Mapping can be applied to the data
        { x: 'name-date-0', y: 'name-numerical-0' }
      );
      expect(setStylesSpy).not.toHaveBeenCalled();
      expect(setAxesMappingSpy).not.toHaveBeenCalled();
      expect(setCurrentChartTypeSpy).not.toHaveBeenCalled();
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
    });
  });

  test('should set styles', () => {
    const builder = new VisualizationBuilder({});
    expect(builder.styles$.value).toBe(undefined);
    builder.setStyles({ type: 'line', styles: { addLegend: true } as any });
    expect(builder.styles$.value).toEqual({ type: 'line', styles: { addLegend: true } as any });
  });

  test('should update styles', () => {
    const builder = new VisualizationBuilder({});
    expect(builder.styles$.value).toBe(undefined);
    builder.setStyles({ type: 'line', styles: { addLegend: true } as any });
    expect(builder.styles$.value).toEqual({ type: 'line', styles: { addLegend: true } });

    builder.updateStyles({ addLegend: false, title: 'title' });
    expect(builder.styles$.value).toEqual({
      type: 'line',
      styles: { addLegend: false, title: 'title' },
    });
  });

  test('should set axes mapping', () => {
    const builder = new VisualizationBuilder({});
    expect(builder.axesMapping$.value).toEqual({});
    builder.setAxesMapping({ x: 'field-0', y: 'field-1' });
    expect(builder.axesMapping$.value).toEqual({ x: 'field-0', y: 'field-1' });
  });

  test('should set chart type', () => {
    const builder = new VisualizationBuilder({});
    expect(builder.currentChartType$.value).toBe(undefined);
    builder.setCurrentChartType('heatmap');
    expect(builder.currentChartType$.value).toBe('heatmap');
  });

  test('should reset vis state', () => {
    const builder = new VisualizationBuilder({});
    builder.setCurrentChartType('bar');
    builder.setAxesMapping({ x: 'name', y: 'age' });
    builder.setStyles({ type: 'bar', styles: { addLegend: true } as any });
    builder.handleData(
      [{ _id: '_id', _index: '_index', _score: 10, _source: { age: 10, name: 'name' } }],
      [
        { type: 'int', name: 'age' },
        { type: 'text', name: 'name' },
      ]
    );
    expect(builder.data$.value).not.toBe(undefined);
    expect(builder.styles$.value).not.toBe(undefined);
    expect(builder.axesMapping$.value).not.toEqual({});
    expect(builder.currentChartType$).not.toBe(undefined);

    builder.reset();

    expect(builder.data$.value).toBe(undefined);
    expect(builder.styles$.value).toBe(undefined);
    expect(builder.axesMapping$.value).toEqual({});
    expect(builder.currentChartType$.value).toBe(undefined);
  });
});
