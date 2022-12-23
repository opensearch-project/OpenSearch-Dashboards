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
  enableEventsInConfig,
  isVisLayerColumn,
  generateVisLayerFilterString,
  addMissingRowsToTableBounds,
  addPointInTimeEventsLayersToTable,
  addPointInTimeEventsLayersToSpec,
} from './helpers';
import { VIS_LAYER_COLUMN_TYPE } from '../';
import {
  TEST_DATATABLE_MULTIPLE_VIS_LAYERS,
  TEST_DATATABLE_NO_VIS_LAYERS,
  TEST_DATATABLE_ONLY_VIS_LAYERS,
  TEST_DATATABLE_SINGLE_ROW_NO_VIS_LAYERS,
  TEST_DATATABLE_SINGLE_ROW_SINGLE_VIS_LAYER,
  TEST_DATATABLE_SINGLE_VIS_LAYER,
  TEST_DATATABLE_SINGLE_VIS_LAYER_EMPTY,
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
  TEST_VIS_LAYERS_SINGLE,
} from '../test_constants';

describe('helpers', function () {
  describe('enableEventsInConfig()', function () {
    it('updates config with undefined showEvents field', function () {
      const baseConfig = {
        kibana: {
          hideWarnings: true,
        },
      };
      const updatedConfig = enableEventsInConfig(baseConfig);
      // @ts-ignore
      baseConfig.kibana.showEvents = true;
      expect(updatedConfig).toStrictEqual(baseConfig);
    });
    it('updates config with false showEvents field', function () {
      const baseConfig = {
        kibana: {
          hideWarnings: true,
          showEvents: false,
        },
      };
      const updatedConfig = enableEventsInConfig(baseConfig);
      baseConfig.kibana.showEvents = true;
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
