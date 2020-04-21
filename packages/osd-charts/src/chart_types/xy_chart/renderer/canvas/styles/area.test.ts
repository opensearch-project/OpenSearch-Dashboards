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
import { buildAreaStyles } from './area';
import { Fill } from '../../../../../geoms/types';
import { getColorFromVariant } from '../../../../../utils/commons';
import { stringToRGB } from '../../../../partition_chart/layout/utils/d3_utils';

jest.mock('../../../../partition_chart/layout/utils/d3_utils');
jest.mock('../../../../../utils/commons');

const COLOR = 'aquamarine';

describe('Area styles', () => {
  describe('#buildAreaStyles', () => {
    let result: Fill;
    let baseColor = COLOR;
    let themeAreaStyle = MockStyles.area();
    let geometryStateStyle = MockStyles.geometryState();

    function setDefaults() {
      baseColor = COLOR;
      themeAreaStyle = MockStyles.area();
      geometryStateStyle = MockStyles.geometryState();
    }

    beforeEach(() => {
      result = buildAreaStyles(baseColor, themeAreaStyle, geometryStateStyle);
    });

    it('should call getColorFromVariant with correct args for fill', () => {
      expect(getColorFromVariant).nthCalledWith(1, baseColor, themeAreaStyle.fill);
    });

    describe('Colors', () => {
      const fillColor = '#4aefb8';

      beforeAll(() => {
        setDefaults();
        (getColorFromVariant as jest.Mock).mockReturnValue(fillColor);
      });

      it('should call stringToRGB with values from getColorFromVariant', () => {
        expect(stringToRGB).nthCalledWith(1, fillColor, expect.any(Function));
      });

      it('should return fill with color', () => {
        expect(result.color).toEqual(stringToRGB(fillColor));
      });
    });

    describe('Opacity', () => {
      const fillColorOpacity = 0.5;
      const fillColor = `rgba(10,10,10,${fillColorOpacity})`;
      const fillOpacity = 0.6;
      const geoOpacity = 0.75;

      beforeAll(() => {
        setDefaults();
        themeAreaStyle = MockStyles.area({ opacity: fillOpacity });
        geometryStateStyle = MockStyles.geometryState({ opacity: geoOpacity });
        (getColorFromVariant as jest.Mock).mockReturnValue(fillColor);
      });

      it('should return correct fill opacity', () => {
        const expected = fillColorOpacity * fillOpacity * geoOpacity;
        expect(result.color.opacity).toEqual(expected);
      });
    });
  });
});
