/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { cloneDeep } from 'lodash';
import {
  OpenSearchDashboardsDatatable,
  OpenSearchDashboardsDatatableColumn,
} from '../../../expressions/public';
import {
  enableVisLayersInSpecConfig,
  isVisLayerColumn,
  generateVisLayerFilterString,
  addMissingRowsToTableBounds,
  addPointInTimeEventsLayersToTable,
  addPointInTimeEventsLayersToSpec,
} from './helpers';
import { VIS_LAYER_COLUMN_TYPE, VisLayerTypes, PointInTimeEventsVisLayer, VisLayer } from '../';
import {
  TEST_DATATABLE_MULTIPLE_VIS_LAYERS,
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
  TEST_RESULT_SPEC_WITH_VIS_INTERACTION_CONFIG,
  TEST_SPEC_MULTIPLE_VIS_LAYERS,
  TEST_SPEC_NO_VIS_LAYERS,
  TEST_SPEC_SINGLE_VIS_LAYER,
  TEST_VIS_LAYERS_MULTIPLE,
  TEST_VIS_LAYERS_SINGLE,
  TEST_VIS_LAYERS_SINGLE_EMPTY_EVENTS,
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
        ...TEST_DATATABLE_SINGLE_VIS_LAYER_EMPTY,
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
    it('vis layer with out-of-bounds timestamps are not added', function () {
      expect(
        addPointInTimeEventsLayersToTable(
          TEST_DATATABLE_NO_VIS_LAYERS,
          TEST_DIMENSIONS,
          TEST_VIS_LAYERS_SINGLE_INVALID_BOUNDS
        )
      ).toStrictEqual(TEST_DATATABLE_SINGLE_VIS_LAYER_EMPTY);
    });
    // below case should not happen since only VisLayers with a populated
    // set of events should be passed from the plugins. but, if it does
    // happen, we can handle it more gracefully instead of throwing an error
    it('vis layer with empty events adds nothing to datatable', function () {
      expect(
        addPointInTimeEventsLayersToTable(
          TEST_DATATABLE_NO_VIS_LAYERS,
          TEST_DIMENSIONS,
          // @ts-ignore
          TEST_VIS_LAYERS_SINGLE_EMPTY_EVENTS
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
});
