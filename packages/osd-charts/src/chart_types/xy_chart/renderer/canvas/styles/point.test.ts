/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License. */

import { MockStyles } from '../../../../../mocks';
import { buildPointStyles } from './point';
import { Fill, Stroke } from '../../../../../geoms/types';
import { getColorFromVariant } from '../../../../../utils/commons';
import { stringToRGB } from '../../../../partition_chart/layout/utils/d3_utils';
import { PointStyle } from '../../../../../utils/themes/theme';

jest.mock('../../../../partition_chart/layout/utils/d3_utils');
jest.mock('../../../../../utils/commons');

const COLOR = 'aquamarine';

describe('Point styles', () => {
  describe('#buildPointStyles', () => {
    let result: { fill: Fill; stroke: Stroke; radius: number };
    let baseColor = COLOR;
    let themePointStyle = MockStyles.point();
    let geometryStateStyle = MockStyles.geometryState();
    let overrides: Partial<PointStyle> = {};

    function setDefaults() {
      baseColor = COLOR;
      themePointStyle = MockStyles.point();
      geometryStateStyle = MockStyles.geometryState();
      overrides = {};
    }

    beforeEach(() => {
      result = buildPointStyles(baseColor, themePointStyle, geometryStateStyle, overrides);
    });

    it('should call getColorFromVariant with correct args for fill', () => {
      expect(getColorFromVariant).nthCalledWith(1, baseColor, themePointStyle.fill);
    });

    it('should call getColorFromVariant with correct args for border', () => {
      expect(getColorFromVariant).nthCalledWith(1, baseColor, themePointStyle.stroke);
    });

    it('should set strokeWidth from themePointStyle', () => {
      expect(result.stroke.width).toBe(themePointStyle.strokeWidth);
    });

    it('should set radius from themePointStyle', () => {
      expect(result.radius).toBe(themePointStyle.radius);
    });

    describe('Colors', () => {
      const fillColor = '#4aefb8';
      const strokeColor = '#a740cf';

      beforeAll(() => {
        setDefaults();
        (getColorFromVariant as jest.Mock).mockImplementation(() => {
          const { length } = (getColorFromVariant as jest.Mock).mock.calls;
          return length === 1 ? fillColor : strokeColor;
        });
      });

      it('should call stringToRGB with values from getColorFromVariant', () => {
        expect(stringToRGB).nthCalledWith(1, fillColor, expect.any(Function));
        expect(stringToRGB).nthCalledWith(2, strokeColor, expect.any(Function));
      });

      it('should return fill with color', () => {
        expect(result.fill.color).toEqual(stringToRGB(fillColor));
      });

      it('should return stroke with color', () => {
        expect(result.stroke.color).toEqual(stringToRGB(strokeColor));
      });
    });

    describe('Opacity', () => {
      const fillColorOpacity = 0.5;
      const strokeColorOpacity = 0.25;
      const fillColor = `rgba(10,10,10,${fillColorOpacity})`;
      const strokeColor = `rgba(10,10,10,${strokeColorOpacity})`;
      const pointOpacity = 0.6;
      const geoOpacity = 0.75;

      beforeAll(() => {
        setDefaults();
        themePointStyle = MockStyles.point({ opacity: pointOpacity });
        geometryStateStyle = MockStyles.geometryState({ opacity: geoOpacity });
        (getColorFromVariant as jest.Mock).mockImplementation(() => {
          const { length } = (getColorFromVariant as jest.Mock).mock.calls;
          return length === 1 ? fillColor : strokeColor;
        });
      });

      it('should return correct fill opacity', () => {
        const expected = fillColorOpacity * pointOpacity * geoOpacity;
        expect(result.fill.color.opacity).toEqual(expected);
      });

      it('should return correct stroke opacity', () => {
        const expected = strokeColorOpacity * pointOpacity * geoOpacity;
        expect(result.stroke.color.opacity).toEqual(expected);
      });
    });

    describe('Overrides', () => {
      const fillColorOpacity = 0.5;
      const strokeColorOpacity = 0.25;
      const pointOpacity = 0.6;
      const geoOpacity = 0.75;

      beforeAll(() => {
        setDefaults();
        overrides = MockStyles.point({
          visible: true,
          stroke: `rgba(10,10,10,${strokeColorOpacity})`,
          strokeWidth: 12,
          fill: `rgba(10,10,10,${fillColorOpacity})`,
          opacity: 0.77,
          radius: 21,
        });
        themePointStyle = MockStyles.point({ opacity: pointOpacity });
        geometryStateStyle = MockStyles.geometryState({ opacity: geoOpacity });
        (getColorFromVariant as jest.Mock).mockImplementation(() => {
          const { length } = (getColorFromVariant as jest.Mock).mock.calls;
          return length === 1 ? overrides.fill : overrides.stroke;
        });
      });

      it('should set radius', () => {
        expect(result.radius).toBe(overrides.radius);
      });

      describe('colors', () => {
        it('should call stringToRGB with values from getColorFromVariant', () => {
          expect(stringToRGB).nthCalledWith(1, overrides.fill, expect.any(Function));
          expect(stringToRGB).nthCalledWith(2, overrides.stroke, expect.any(Function));
        });

        it('should return fill with color', () => {
          const { opacity, ...color } = stringToRGB(overrides.fill!);
          expect(result.fill.color).toMatchObject(color);
        });

        it('should return stroke with color', () => {
          const { opacity, ...color } = stringToRGB(overrides.stroke!);
          expect(result.stroke.color).toMatchObject(color);
        });

        describe('opacity', () => {
          it('should return correct fill opacity', () => {
            const expected = fillColorOpacity * overrides.opacity! * geoOpacity;
            expect(result.fill.color.opacity).toEqual(expected);
          });

          it('should return correct stroke opacity', () => {
            const expected = strokeColorOpacity * overrides.opacity! * geoOpacity;
            expect(result.stroke.color.opacity).toEqual(expected);
          });
        });
      });
    });
  });
});
