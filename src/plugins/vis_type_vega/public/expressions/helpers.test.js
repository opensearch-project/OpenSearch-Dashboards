/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  buildLayerMark,
  buildXAxis,
  buildYAxis,
  cleanString,
  createSpecFromXYChartDatatable,
  formatDatatable,
  setupConfig,
} from './helpers';
import {
  complexDatatable,
  complexVisParams,
  complexDimensions,
  simpleDatatable,
  simpleVisParams,
  simpleDimensions,
  noXAxisDimensions,
} from './__mocks__';
import {
  TEST_DATATABLE_NO_VIS_LAYERS,
  TEST_DATATABLE_NO_VIS_LAYERS_DIRTY,
} from '../../../vis_augmenter/public';

describe('helpers', function () {
  describe('formatDatatable()', function () {
    it('formatSimpleDatatable', function () {
      expect(formatDatatable(TEST_DATATABLE_NO_VIS_LAYERS)).toBe(TEST_DATATABLE_NO_VIS_LAYERS);
    });
    it('formatDirtyDatatable', function () {
      expect(formatDatatable(TEST_DATATABLE_NO_VIS_LAYERS_DIRTY)).toStrictEqual(
        TEST_DATATABLE_NO_VIS_LAYERS
      );
    });
  });

  describe('cleanString()', function () {
    it('string should not contain quotation marks', function () {
      const dirtyString = '"someString"';
      expect(cleanString(dirtyString)).toBe('someString');
    });
  });

  describe('setupConfig()', function () {
    it('check all legend positions', function () {
      const visAugmenterConfig = {
        some: 'config',
      };
      const baseConfig = {
        view: {
          stroke: null,
        },
        concat: {
          spacing: 0,
        },
        legend: {
          orient: null,
        },
        kibana: {
          hideWarnings: true,
          visAugmenterConfig,
        },
      };
      const positions = ['top', 'right', 'left', 'bottom'];
      positions.forEach((position) => {
        const visParams = { legendPosition: position };
        baseConfig.legend.orient = position;
        baseConfig.legend.offset = position === 'top' || position === 'bottom' ? 0 : 18;
        expect(setupConfig(visParams, visAugmenterConfig)).toStrictEqual(baseConfig);
      });
    });
  });

  describe('buildLayerMark()', function () {
    const types = ['line', 'area', 'histogram'];
    const interpolates = ['linear', 'cardinal', 'step-after'];
    const strokeWidths = [-1, 0, 1, 2, 3, 4];
    const showCircles = [false, true];

    it('check each mark possible value', function () {
      const mark = {
        type: null,
        interpolate: null,
        strokeWidth: null,
        point: null,
      };
      types.forEach((type) => {
        mark.type = type;
        interpolates.forEach((interpolate) => {
          mark.interpolate = interpolate;
          strokeWidths.forEach((strokeWidth) => {
            mark.strokeWidth = strokeWidth;
            showCircles.forEach((showCircle) => {
              mark.point = showCircle;
              const param = {
                type: type,
                interpolate: interpolate,
                lineWidth: strokeWidth,
                showCircles: showCircle,
              };
              expect(buildLayerMark(param)).toStrictEqual(mark);
            });
          });
        });
      });
    });
  });

  describe('buildXAxis()', function () {
    it('build different XAxis', function () {
      const xAxisTitle = 'someTitle';
      const xAxisId = 'someId';
      [true, false].forEach((enableGrid) => {
        const visParams = { grid: { categoryLines: enableGrid } };
        const vegaXAxis = {
          axis: {
            title: xAxisTitle,
            grid: enableGrid,
          },
          field: xAxisId,
          type: 'temporal',
        };
        expect(buildXAxis(xAxisTitle, xAxisId, visParams)).toStrictEqual(vegaXAxis);
      });
    });
  });

  describe('buildYAxis()', function () {
    it('build different YAxis', function () {
      const valueAxis = {
        id: 'someId',
        labels: {
          rotate: 75,
          show: false,
        },
        position: 'left',
        title: {
          text: 'someText',
        },
      };
      const column = { name: 'columnName', id: 'columnId' };
      const visParams = { grid: { valueAxis: true } };
      const vegaYAxis = {
        axis: {
          title: 'someText',
          grid: true,
          orient: 'left',
          labels: false,
          labelAngle: 75,
        },
        field: 'columnId',
        type: 'quantitative',
      };
      expect(buildYAxis(column, valueAxis, visParams)).toStrictEqual(vegaYAxis);

      valueAxis.title.text = '""';
      vegaYAxis.axis.title = 'columnName';
      expect(buildYAxis(column, valueAxis, visParams)).toStrictEqual(vegaYAxis);
    });
    it('build YAxis with percentile rank', function () {
      const valueAxis = {
        id: 'someId',
        labels: {
          rotate: 75,
          show: false,
        },
        position: 'left',
        title: {
          text: 'someText',
        },
      };
      const column = { name: 'columnName', id: 'columnId', meta: { type: 'percentile_ranks' } };
      const visParams = { grid: { valueAxis: true } };
      const vegaYAxis = {
        axis: {
          title: 'someText',
          grid: true,
          orient: 'left',
          labels: false,
          labelAngle: 75,
          format: '.0%',
        },
        field: 'columnId',
        type: 'quantitative',
      };
      expect(buildYAxis(column, valueAxis, visParams)).toStrictEqual(vegaYAxis);
    });
  });

  describe('createSpecFromXYChartDatatable()', function () {
    // Following 3 tests fail since they are persisting temporal data
    // which can cause snapshots to fail depending on the test env they are run on.
    // Tracking issue: https://github.com/opensearch-project/OpenSearch-Dashboards/issues/4555
    // TODO: Add a test for the fix in this PR: https://github.com/opensearch-project/OpenSearch-Dashboards/pull/4554
    it.skip('build simple line chart"', function () {
      expect(
        JSON.stringify(
          createSpecFromXYChartDatatable(
            formatDatatable(JSON.parse(simpleDatatable)),
            JSON.parse(simpleVisParams),
            JSON.parse(simpleDimensions)
          )
        )
      ).toMatchSnapshot();
    });

    it.skip('build empty chart if no x-axis is defined"', function () {
      expect(
        JSON.stringify(
          createSpecFromXYChartDatatable(
            formatDatatable(JSON.parse(simpleDatatable)),
            JSON.parse(simpleVisParams),
            JSON.parse(noXAxisDimensions)
          )
        )
      ).toMatchSnapshot();
    });

    it.skip('build complicated line chart"', function () {
      expect(
        JSON.stringify(
          createSpecFromXYChartDatatable(
            formatDatatable(JSON.parse(complexDatatable)),
            JSON.parse(complexVisParams),
            JSON.parse(complexDimensions)
          )
        )
      ).toMatchSnapshot();
    });
  });
});
