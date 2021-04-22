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
 * under the License.
 */

import { stringToRGB } from '../../../../../common/color_library_wrappers';
import { Stroke } from '../../../../../geoms/types';
import { MockStyles } from '../../../../../mocks';
import * as common from '../../../../../utils/common';
import { buildLineStyles } from './line';

jest.mock('../../../../../common/color_library_wrappers');
jest.spyOn(common, 'getColorFromVariant');

const COLOR = 'aquamarine';

describe('Line styles', () => {
  describe('#buildLineStyles', () => {
    let result: Stroke;
    let baseColor = COLOR;
    let themeLineStyle = MockStyles.line();
    let geometryStateStyle = MockStyles.geometryState();

    function setDefaults() {
      baseColor = COLOR;
      themeLineStyle = MockStyles.line();
      geometryStateStyle = MockStyles.geometryState();
    }

    beforeEach(() => {
      result = buildLineStyles(baseColor, themeLineStyle, geometryStateStyle);
    });

    it('should call getColorFromVariant with correct args for stroke', () => {
      expect(common.getColorFromVariant).nthCalledWith(1, baseColor, themeLineStyle.stroke);
    });

    it('should set strokeWidth from themeLineStyle', () => {
      expect(result.width).toBe(themeLineStyle.strokeWidth);
    });

    it('should set dash from themeLineStyle', () => {
      expect(result.dash).toEqual(themeLineStyle.dash);
    });

    describe('Colors', () => {
      const strokeColor = '#4aefb8';

      beforeAll(() => {
        setDefaults();
        (common.getColorFromVariant as jest.Mock).mockReturnValue(strokeColor);
      });

      it('should call stringToRGB with values from getColorFromVariant', () => {
        expect(stringToRGB).nthCalledWith(1, strokeColor, expect.any(Function));
      });

      it('should return stroke with color', () => {
        expect(result.color).toEqual(stringToRGB(strokeColor));
      });
    });

    describe('Opacity', () => {
      const strokeColorOpacity = 0.5;
      const strokeColor = `rgba(10,10,10,${strokeColorOpacity})`;
      const strokeOpacity = 0.6;
      const geoOpacity = 0.75;

      beforeAll(() => {
        setDefaults();
        themeLineStyle = MockStyles.line({ opacity: strokeOpacity });
        geometryStateStyle = MockStyles.geometryState({ opacity: geoOpacity });
        (common.getColorFromVariant as jest.Mock).mockReturnValue(strokeColor);
      });

      it('should return correct stroke opacity', () => {
        const expected = strokeColorOpacity * strokeOpacity * geoOpacity;
        expect(result.color.opacity).toEqual(expected);
      });
    });
  });
});
