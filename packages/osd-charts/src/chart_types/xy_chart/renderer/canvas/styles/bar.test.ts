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
import { buildBarStyles } from './bar';
import { Fill, Stroke } from '../../../../../geoms/types';
import { getColorFromVariant } from '../../../../../utils/commons';
import { stringToRGB } from '../../../../partition_chart/layout/utils/d3_utils';

jest.mock('../../../../partition_chart/layout/utils/d3_utils');
jest.mock('../../../../../utils/commons');

const COLOR = 'aquamarine';

describe('Bar styles', () => {
  describe('#buildBarStyles', () => {
    let result: { fill: Fill; stroke: Stroke };
    let baseColor = COLOR;
    let themeRectStyle = MockStyles.rect();
    let themeRectBorderStyle = MockStyles.rectBorder();
    let geometryStateStyle = MockStyles.geometryState();

    function setDefaults() {
      baseColor = COLOR;
      themeRectStyle = MockStyles.rect();
      themeRectBorderStyle = MockStyles.rectBorder();
      geometryStateStyle = MockStyles.geometryState();
    }

    beforeEach(() => {
      result = buildBarStyles(baseColor, themeRectStyle, themeRectBorderStyle, geometryStateStyle);
    });

    it('should call getColorFromVariant with correct args for fill', () => {
      expect(getColorFromVariant).nthCalledWith(1, baseColor, themeRectStyle.fill);
    });

    it('should call getColorFromVariant with correct args for border', () => {
      expect(getColorFromVariant).nthCalledWith(1, baseColor, themeRectBorderStyle.stroke);
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
      const fillOpacity = 0.6;
      const strokeOpacity = 0.8;
      const geoOpacity = 0.75;

      beforeAll(() => {
        setDefaults();
        themeRectStyle = MockStyles.rect({ opacity: fillOpacity });
        themeRectBorderStyle = MockStyles.rectBorder({ strokeOpacity });
        geometryStateStyle = MockStyles.geometryState({ opacity: geoOpacity });
        (getColorFromVariant as jest.Mock).mockImplementation(() => {
          const { length } = (getColorFromVariant as jest.Mock).mock.calls;
          return length === 1 ? fillColor : strokeColor;
        });
      });

      it('should return correct fill opacity', () => {
        const expected = fillColorOpacity * fillOpacity * geoOpacity;
        expect(result.fill.color.opacity).toEqual(expected);
      });

      it('should return correct stroke opacity', () => {
        const expected = strokeColorOpacity * strokeOpacity * geoOpacity;
        expect(result.stroke.color.opacity).toEqual(expected);
      });

      describe('themeRectBorderStyle opacity is undefined', () => {
        beforeAll(() => {
          themeRectBorderStyle = {
            ...MockStyles.rectBorder(),
            strokeOpacity: undefined,
          };
        });

        it('should use themeRectStyle opacity', () => {
          const expected = strokeColorOpacity * fillOpacity * geoOpacity;
          expect(result.stroke.color.opacity).toEqual(expected);
        });
      });
    });

    describe('Width', () => {
      describe('visible is set to false', () => {
        beforeAll(() => {
          themeRectBorderStyle = MockStyles.rectBorder({ visible: false });
        });

        it('should set stroke width to zero', () => {
          expect(result.stroke.width).toEqual(0);
        });
      });

      describe('visible is set to true', () => {
        const strokeWidth = 22;

        beforeAll(() => {
          themeRectBorderStyle = MockStyles.rectBorder({ visible: true, strokeWidth });
        });

        it('should set stroke width to strokeWidth', () => {
          expect(result.stroke.width).toEqual(strokeWidth);
        });
      });
    });
  });
});
