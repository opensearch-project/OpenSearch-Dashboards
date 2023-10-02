/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { cloneDeep } from 'lodash';
import {
  OpenSearchDashboardsDatatable,
  OpenSearchDashboardsDatatableColumn,
} from '../../../expressions/public';
import { YAxisConfig } from '../../../vis_type_vega/public';
import {
  enableVisLayersInSpecConfig,
  isVisLayerColumn,
  generateVisLayerFilterString,
  addMissingRowsToTableBounds,
  addPointInTimeEventsLayersToTable,
  addPointInTimeEventsLayersToSpec,
  generateVisLayerTooltipFields,
  addVisEventSignalsToSpecConfig,
  calculateYAxisPadding,
  augmentEventChartSpec,
} from './helpers';
import {
  VIS_LAYER_COLUMN_TYPE,
  VisLayerTypes,
  PointInTimeEventsVisLayer,
  VisLayer,
  VisFlyoutContext,
  VisAugmenterEmbeddableConfig,
} from '../';
import {
  TEST_DATATABLE_MULTIPLE_VIS_LAYERS,
  TEST_DATATABLE_MULTIPLE_VIS_LAYERS_ONE_EMPTY,
  TEST_DATATABLE_NO_VIS_LAYERS,
  TEST_DATATABLE_ONLY_VIS_LAYERS,
  TEST_DATATABLE_SINGLE_ROW_NO_VIS_LAYERS,
  TEST_DATATABLE_SINGLE_ROW_SINGLE_VIS_LAYER,
  TEST_DATATABLE_SINGLE_VIS_LAYER,
  TEST_DATATABLE_SINGLE_VIS_LAYER_EMPTY,
  TEST_DATATABLE_SINGLE_VIS_LAYER_ON_BOUNDS,
  TEST_DIMENSIONS,
  TEST_DIMENSIONS_INVALID_BOUNDS,
  TEST_DIMENSIONS_SINGLE_ROW,
  TEST_RESULT_SPEC_MULTIPLE_VIS_LAYERS,
  TEST_RESULT_SPEC_SINGLE_VIS_LAYER,
  TEST_RESULT_SPEC_SINGLE_VIS_LAYER_EMPTY,
  TEST_SPEC_MULTIPLE_VIS_LAYERS,
  TEST_SPEC_NO_VIS_LAYERS,
  TEST_SPEC_SINGLE_VIS_LAYER,
  TEST_VIS_LAYERS_MULTIPLE,
  TEST_VIS_LAYERS_MULTIPLE_ONE_EMPTY,
  TEST_VIS_LAYERS_SINGLE,
  TEST_VIS_LAYERS_SINGLE_INVALID_BOUNDS,
  TEST_VIS_LAYERS_SINGLE_ON_BOUNDS,
} from '../test_constants';

describe('helpers', function () {
  describe('enableVisLayersInSpecConfig()', function () {
    const pointInTimeEventsVisLayer = {
      type: VisLayerTypes.PointInTimeEvents,
      originPlugin: 'test-plugin',
      pluginResource: {
        type: 'test-resource-type',
        id: 'test-resource-id',
        name: 'test-resource-name',
        urlPath: 'test-resource-url-path',
      },
      events: [
        {
          timestamp: 1234,
          metadata: {
            pluginResourceId: 'test-resource-id',
          },
        },
      ],
    } as PointInTimeEventsVisLayer;
    const invalidVisLayer = ({
      type: 'something-invalid',
      originPlugin: 'test-plugin',
      pluginResource: {
        type: 'test-resource-type',
        id: 'test-resource-id',
        name: 'test-resource-name',
        urlPath: 'test-resource-url-path',
      },
    } as unknown) as VisLayer;

    it('updates config with just a valid Vislayer', function () {
      const baseConfig = {
        kibana: {
          hideWarnings: true,
        },
      };
      const updatedConfig = enableVisLayersInSpecConfig({ config: baseConfig }, [
        pointInTimeEventsVisLayer,
      ]);
      const expectedArr = [
        ...new Map<VisLayerTypes, boolean>([[VisLayerTypes.PointInTimeEvents, true]]),
      ];
      // @ts-ignore
      baseConfig.kibana.visibleVisLayers = expectedArr;
      expect(updatedConfig).toStrictEqual(baseConfig);
    });
    it('updates config with a valid and invalid VisLayer', function () {
      const baseConfig = {
        kibana: {
          hideWarnings: true,
        },
      };
      const updatedConfig = enableVisLayersInSpecConfig({ config: baseConfig }, [
        pointInTimeEventsVisLayer,
        invalidVisLayer,
      ]);
      const expectedArr = [
        ...new Map<VisLayerTypes, boolean>([[VisLayerTypes.PointInTimeEvents, true]]),
      ];
      // @ts-ignore
      baseConfig.kibana.visibleVisLayers = expectedArr;
      expect(updatedConfig).toStrictEqual(baseConfig);
    });
    it('does not update config if no valid VisLayer', function () {
      const baseConfig = {
        kibana: {
          hideWarnings: true,
        },
      };
      const updatedConfig = enableVisLayersInSpecConfig({ config: baseConfig }, [invalidVisLayer]);
      // @ts-ignore
      baseConfig.kibana.visibleVisLayers = [...new Map<VisLayerTypes, boolean>()];
      expect(updatedConfig).toStrictEqual(baseConfig);
    });
    it('does not update config if empty VisLayer list', function () {
      const baseConfig = {
        kibana: {
          hideWarnings: true,
        },
      };
      const updatedConfig = enableVisLayersInSpecConfig({ config: baseConfig }, []);
      // @ts-ignore
      baseConfig.kibana.visibleVisLayers = [...new Map<VisLayerTypes, boolean>()];
      expect(updatedConfig).toStrictEqual(baseConfig);
    });
  });

  describe('isVisLayerColumn()', function () {
    it('return false for column with invalid type', function () {
      const column = {
        id: 'test-id',
        name: 'test-name',
        meta: {
          type: 'invalid-type',
        },
      } as OpenSearchDashboardsDatatableColumn;
      expect(isVisLayerColumn(column)).toBe(false);
    });
    it('return false for column with no meta field', function () {
      const column = {
        id: 'test-id',
        name: 'test-name',
      } as OpenSearchDashboardsDatatableColumn;
      expect(isVisLayerColumn(column)).toBe(false);
    });
    it('return true for column with valid type', function () {
      const column = {
        id: 'test-id',
        name: 'test-name',
        meta: {
          type: VIS_LAYER_COLUMN_TYPE,
        },
      } as OpenSearchDashboardsDatatableColumn;
      expect(isVisLayerColumn(column)).toBe(true);
    });
  });

  describe('generateVisLayerFilterString()', function () {
    it('empty array returns false', function () {
      const visLayerColumnIds = [] as string[];
      const filterString = 'false';
      expect(generateVisLayerFilterString(visLayerColumnIds)).toStrictEqual(filterString);
    });
    it('array with one value returns correct filter string', function () {
      const visLayerColumnIds = ['test-id-1'];
      const filterString = `datum['test-id-1'] > 0`;
      expect(generateVisLayerFilterString(visLayerColumnIds)).toStrictEqual(filterString);
    });
    it('array with multiple values returns correct filter string', function () {
      const visLayerColumnIds = ['test-id-1', 'test-id-2'];
      const filterString = `datum['test-id-1'] > 0 || datum['test-id-2'] > 0`;
      expect(generateVisLayerFilterString(visLayerColumnIds)).toStrictEqual(filterString);
    });
  });

  describe('generateVisLayerTooltipFields()', function () {
    it('empty array returns empty', function () {
      const visLayerColumnIds = [] as string[];
      const tooltipFields = [] as Array<{ field: string }>;
      expect(generateVisLayerTooltipFields(visLayerColumnIds)).toStrictEqual(tooltipFields);
    });
    it('array with one value returns correct array', function () {
      const visLayerColumnIds = ['test-id-1'];
      const tooltipFields = [{ field: 'test-id-1' }];
      expect(generateVisLayerTooltipFields(visLayerColumnIds)).toStrictEqual(tooltipFields);
    });
    it('array with multiple values returns correct array', function () {
      const visLayerColumnIds = ['test-id-1', 'test-id-2'];
      const tooltipFields = [{ field: 'test-id-1' }, { field: 'test-id-2' }];
      expect(generateVisLayerTooltipFields(visLayerColumnIds)).toStrictEqual(tooltipFields);
    });
  });

  describe('addMissingRowsToTableBounds()', function () {
    const columnId = 'test-id';
    const columnName = 'test-name';
    const allRows = [
      {
        [columnId]: 1,
      },
      {
        [columnId]: 2,
      },
      {
        [columnId]: 3,
      },
      {
        [columnId]: 4,
      },
      {
        [columnId]: 5,
      },
    ];
    it('adds single row if start/end times are the same', function () {
      const datatable = {
        type: 'opensearch_dashboards_datatable',
        columns: [
          {
            id: columnId,
            name: columnName,
          },
        ],
        rows: [],
      } as OpenSearchDashboardsDatatable;
      const dimensions = {
        x: {
          params: {
            interval: 1,
            bounds: {
              min: 1,
              max: 1,
            },
          },
          label: columnName,
        },
      };
      const result = addMissingRowsToTableBounds(datatable, dimensions);
      const expectedTable = {
        ...datatable,
        rows: [allRows[0]],
      };
      expect(result).toStrictEqual(expectedTable);
    });
    it('adds all rows if there is none to begin with', function () {
      const datatable = {
        type: 'opensearch_dashboards_datatable',
        columns: [
          {
            id: columnId,
            name: columnName,
          },
        ],
        rows: [],
      } as OpenSearchDashboardsDatatable;
      const dimensions = {
        x: {
          params: {
            interval: 1,
            bounds: {
              min: 1,
              max: 5,
            },
          },
          label: columnName,
        },
      };
      const result = addMissingRowsToTableBounds(datatable, dimensions);
      const expectedTable = {
        ...datatable,
        rows: allRows,
      };
      expect(result).toStrictEqual(expectedTable);
    });
    it('fill rows at beginning', function () {
      const missingRows = cloneDeep(allRows);
      missingRows.shift();
      missingRows.shift();
      const datatable = {
        type: 'opensearch_dashboards_datatable',
        columns: [
          {
            id: columnId,
            name: columnName,
          },
        ],
        rows: missingRows,
      } as OpenSearchDashboardsDatatable;
      const dimensions = {
        x: {
          params: {
            interval: 1,
            bounds: {
              min: 1,
              max: 5,
            },
          },
          label: columnName,
        },
      };
      const result = addMissingRowsToTableBounds(datatable, dimensions);
      const expectedTable = {
        ...datatable,
        rows: allRows,
      };
      expect(result).toStrictEqual(expectedTable);
    });
    it('fill rows at end', function () {
      const missingRows = cloneDeep(allRows);
      missingRows.pop();
      missingRows.pop();
      const datatable = {
        type: 'opensearch_dashboards_datatable',
        columns: [
          {
            id: columnId,
            name: columnName,
          },
        ],
        rows: missingRows,
      } as OpenSearchDashboardsDatatable;
      const dimensions = {
        x: {
          params: {
            interval: 1,
            bounds: {
              min: 1,
              max: 5,
            },
          },
          label: columnName,
        },
      };
      const result = addMissingRowsToTableBounds(datatable, dimensions);
      const expectedTable = {
        ...datatable,
        rows: allRows,
      };
      expect(result).toStrictEqual(expectedTable);
    });
  });

  describe('addPointInTimeEventsLayersToTable()', function () {
    it('single vis layer is added correctly', function () {
      expect(
        addPointInTimeEventsLayersToTable(
          TEST_DATATABLE_NO_VIS_LAYERS,
          TEST_DIMENSIONS,
          TEST_VIS_LAYERS_SINGLE
        )
      ).toStrictEqual(TEST_DATATABLE_SINGLE_VIS_LAYER);
    });
    it('multiple vis layers are added correctly', function () {
      expect(
        addPointInTimeEventsLayersToTable(
          TEST_DATATABLE_NO_VIS_LAYERS,
          TEST_DIMENSIONS,
          TEST_VIS_LAYERS_MULTIPLE
        )
      ).toStrictEqual(TEST_DATATABLE_MULTIPLE_VIS_LAYERS);
    });
    it('invalid bounds adds no row data', function () {
      expect(
        addPointInTimeEventsLayersToTable(
          {
            ...TEST_DATATABLE_NO_VIS_LAYERS,
            rows: [],
          },
          TEST_DIMENSIONS_INVALID_BOUNDS,
          TEST_VIS_LAYERS_SINGLE
        )
      ).toStrictEqual({
        ...TEST_DATATABLE_NO_VIS_LAYERS,
        rows: [],
      });
    });
    it('vis layers with single row are added correctly', function () {
      expect(
        addPointInTimeEventsLayersToTable(
          TEST_DATATABLE_SINGLE_ROW_NO_VIS_LAYERS,
          TEST_DIMENSIONS_SINGLE_ROW,
          TEST_VIS_LAYERS_SINGLE
        )
      ).toStrictEqual(TEST_DATATABLE_SINGLE_ROW_SINGLE_VIS_LAYER);
    });
    it('vis layers with no existing rows/data are added correctly', function () {
      expect(
        addPointInTimeEventsLayersToTable(
          {
            ...TEST_DATATABLE_NO_VIS_LAYERS,
            rows: [],
          },
          TEST_DIMENSIONS,
          TEST_VIS_LAYERS_SINGLE
        )
      ).toStrictEqual(TEST_DATATABLE_ONLY_VIS_LAYERS);
    });
    it('vis layers with one having events and the other empty are added correctly', function () {
      expect(
        addPointInTimeEventsLayersToTable(
          TEST_DATATABLE_NO_VIS_LAYERS,

          TEST_DIMENSIONS,
          TEST_VIS_LAYERS_MULTIPLE_ONE_EMPTY
        )
      ).toStrictEqual(TEST_DATATABLE_MULTIPLE_VIS_LAYERS_ONE_EMPTY);
    });
    it('vis layer with out-of-bounds timestamps are not added', function () {
      expect(
        addPointInTimeEventsLayersToTable(
          TEST_DATATABLE_NO_VIS_LAYERS,
          TEST_DIMENSIONS,
          TEST_VIS_LAYERS_SINGLE_INVALID_BOUNDS
        )
      ).toStrictEqual(TEST_DATATABLE_SINGLE_VIS_LAYER_EMPTY);
    });
    it('vis layer with events on edge of bounds are added', function () {
      expect(
        addPointInTimeEventsLayersToTable(
          TEST_DATATABLE_NO_VIS_LAYERS,
          TEST_DIMENSIONS,
          TEST_VIS_LAYERS_SINGLE_ON_BOUNDS
        )
      ).toStrictEqual(TEST_DATATABLE_SINGLE_VIS_LAYER_ON_BOUNDS);
    });
  });

  describe('addPointInTimeEventsLayersToSpec()', function () {
    it('spec with single time series produces correct spec', function () {
      const expectedSpec = TEST_RESULT_SPEC_SINGLE_VIS_LAYER;
      const returnSpec = addPointInTimeEventsLayersToSpec(
        TEST_DATATABLE_SINGLE_VIS_LAYER,
        TEST_DIMENSIONS,
        TEST_SPEC_SINGLE_VIS_LAYER
      );
      // deleting the scale fields since this contain generated
      // fields based on timezone env it is run in
      delete expectedSpec.vconcat[1].encoding.x.scale;
      delete returnSpec.vconcat[1].encoding.x.scale;
      expect(returnSpec).toEqual(expectedSpec);
    });
    it('spec with multiple time series produces correct spec', function () {
      const expectedSpec = TEST_RESULT_SPEC_MULTIPLE_VIS_LAYERS;
      const returnSpec = addPointInTimeEventsLayersToSpec(
        TEST_DATATABLE_MULTIPLE_VIS_LAYERS,
        TEST_DIMENSIONS,
        TEST_SPEC_MULTIPLE_VIS_LAYERS
      );
      // deleting the scale fields since this contain generated
      // fields based on timezone env it is run in
      delete expectedSpec.vconcat[1].encoding.x.scale;
      delete returnSpec.vconcat[1].encoding.x.scale;
      expect(returnSpec).toEqual(expectedSpec);
    });
    it('spec with vis layers with empty data produces correct spec', function () {
      const expectedSpec = TEST_RESULT_SPEC_SINGLE_VIS_LAYER_EMPTY;
      const returnSpec = addPointInTimeEventsLayersToSpec(
        TEST_DATATABLE_SINGLE_VIS_LAYER_EMPTY,
        TEST_DIMENSIONS,
        TEST_SPEC_NO_VIS_LAYERS
      );
      // deleting the scale fields since this contain generated
      // fields based on timezone env it is run in
      delete expectedSpec.vconcat[1].encoding.x.scale;
      delete returnSpec.vconcat[1].encoding.x.scale;
      expect(returnSpec).toEqual(expectedSpec);
    });
  });

  describe('addVisEventSignalsToSpecConfig()', () => {
    it('vis event signal is added for point in time annotations', () => {
      const startSpec = {
        kibana: {},
      };
      const endSpec = addVisEventSignalsToSpecConfig(startSpec);
      expect(endSpec.kibana.signals.POINT_IN_TIME_ANNOTATION.length).toBeGreaterThan(0);
    });
    it('tooltip configuration is specified', () => {
      const startSpec = {
        kibana: {},
      };
      const endSpec = addVisEventSignalsToSpecConfig(startSpec);
      expect(endSpec.tooltips).not.toBeNull();
    });
  });

  describe('calculateYAxisPadding()', () => {
    it('calculation includes sum of all y axis fields', () => {
      const sampleConfig = {
        minExtent: 1,
        offset: 1,
        translate: 1,
        domainWidth: 1,
        labelPadding: 1,
        titlePadding: 1,
        tickOffset: 1,
        tickSize: 1,
      } as YAxisConfig;
      // derived from each value in sample config + default padding of 3
      expect(calculateYAxisPadding(sampleConfig)).toEqual(11);
    });
    it('calculation defaults to 0 for missing y axis fields', () => {
      const sampleConfig = {
        minExtent: 1,
      } as YAxisConfig;
      // derived from each value in sample config + default padding of 3
      expect(calculateYAxisPadding(sampleConfig)).toEqual(4);
    });
  });

  describe('augmentEventChartSpec()', () => {
    it('not in flyout - no change', () => {
      const config = {
        inFlyout: false,
        flyoutContext: VisFlyoutContext.BASE_VIS,
      } as VisAugmenterEmbeddableConfig;
      const origSpec = {
        config: { some: 'config' },
        vconcat: [{ base: 'vis' }, { event: 'vis' }],
      };

      expect(augmentEventChartSpec(config, origSpec)).toEqual(origSpec);
    });
    it('in flyout + base vis context', () => {
      const config = {
        inFlyout: true,
        flyoutContext: VisFlyoutContext.BASE_VIS,
      } as VisAugmenterEmbeddableConfig;
      const origSpec = {
        config: { some: 'config' },
        vconcat: [{ base: 'vis' }, { event: 'vis' }],
      };

      const returnSpec = augmentEventChartSpec(config, origSpec) as any;
      // legend should be forced to the top
      expect(returnSpec.config.legend.orient).toEqual('top');
      // y-axis should be a set, consistent, nonzero width
      expect(returnSpec.config.axisY.minExtent).toBeGreaterThan(0);
      expect(returnSpec.config.axisY.maxExtent).toBeGreaterThan(0);
      expect(returnSpec.config.axisY.offset).toEqual(0);
      expect(returnSpec.vconcat.length).toEqual(2);
    });
    it('in flyout + event vis context', () => {
      const config = {
        inFlyout: true,
        flyoutContext: VisFlyoutContext.EVENT_VIS,
      } as VisAugmenterEmbeddableConfig;
      const origSpec = {
        config: { some: 'config' },
        vconcat: [
          { base: 'vis' },
          {
            event: 'vis',
            encoding: {
              x: {
                axis: {
                  some: 'field',
                },
              },
            },
            mark: {
              some: 'other-field',
            },
          },
        ],
      };

      const returnSpec = augmentEventChartSpec(config, origSpec) as any;
      const xAxisConfig = returnSpec.vconcat[0].encoding.x.axis;
      // y-axis should be a set, consistent, nonzero width
      expect(returnSpec.config.axisY.minExtent).toBeGreaterThan(0);
      expect(returnSpec.config.axisY.maxExtent).toBeGreaterThan(0);
      expect(returnSpec.config.axisY.offset).toEqual(0);
      // x-axis should be hidden
      expect(xAxisConfig.grid).toEqual(false);
      expect(xAxisConfig.ticks).toEqual(false);
      expect(xAxisConfig.labels).toEqual(false);
      expect(xAxisConfig.title).toEqual(null);
      expect(returnSpec.vconcat.length).toEqual(1);
    });
    it('in flyout + timeline vis context', () => {
      const config = {
        inFlyout: true,
        flyoutContext: VisFlyoutContext.TIMELINE_VIS,
      } as VisAugmenterEmbeddableConfig;
      const origSpec = {
        config: { some: 'config' },
        vconcat: [{ base: 'vis' }, { event: 'vis' }],
      };

      const returnSpec = augmentEventChartSpec(config, origSpec) as any;
      // y-axis should be a set, consistent, nonzero width
      expect(returnSpec.config.axisY.minExtent).toBeGreaterThan(0);
      expect(returnSpec.config.axisY.maxExtent).toBeGreaterThan(0);
      expect(returnSpec.config.axisY.offset).toEqual(0);
      // should have transform param set on the event chart
      expect(returnSpec.vconcat[0].transform.length).toBeGreaterThan(0);
      expect(returnSpec.vconcat.length).toEqual(1);
    });
  });
});
