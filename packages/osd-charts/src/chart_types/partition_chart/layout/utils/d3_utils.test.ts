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

import {
  stringToRGB,
  validateColor,
  defaultD3Color,
  argsToRGB,
  RgbObject,
  argsToRGBString,
  RGBtoString,
} from './d3_utils';

describe('d3 Utils', () => {
  describe('stringToRGB', () => {
    describe('bad colors or undefined', () => {
      it('should return default color for undefined color string', () => {
        expect(stringToRGB()).toMatchObject({
          r: 255,
          g: 0,
          b: 0,
          opacity: 1,
        });
      });

      it('should return default RgbObject', () => {
        expect(stringToRGB('not a color')).toMatchObject({
          r: 255,
          g: 0,
          b: 0,
          opacity: 1,
        });
      });

      it('should return default color if bad opacity', () => {
        expect(stringToRGB('rgba(50,50,50,x)')).toMatchObject({
          r: 255,
          g: 0,
          b: 0,
          opacity: 1,
        });
      });
    });

    describe('hex colors', () => {
      it('should return RgbObject', () => {
        expect(stringToRGB('#ef713d')).toMatchObject({
          r: 239,
          g: 113,
          b: 61,
        });
      });

      it('should return RgbObject from shorthand', () => {
        expect(stringToRGB('#ccc')).toMatchObject({
          r: 204,
          g: 204,
          b: 204,
        });
      });

      it('should return RgbObject with correct opacity', () => {
        // https://gist.github.com/lopspower/03fb1cc0ac9f32ef38f4
        expect(stringToRGB('#ef713d80').opacity).toBeCloseTo(0.5, 1);
      });

      it('should return correct RgbObject for alpha value of 0', () => {
        expect(stringToRGB('#00000000')).toMatchObject({
          r: 0,
          g: 0,
          b: 0,
          opacity: 0,
        });
      });
    });

    describe('rgb colors', () => {
      it('should return RgbObject', () => {
        expect(stringToRGB('rgb(50,50,50)')).toMatchObject({
          r: 50,
          g: 50,
          b: 50,
        });
      });

      it('should return RgbObject with correct opacity', () => {
        expect(stringToRGB('rgba(50,50,50,0.25)').opacity).toBe(0.25);
      });

      it('should return correct RgbObject for alpha value of 0', () => {
        expect(stringToRGB('rgba(50,50,50,0)')).toMatchObject({
          r: 50,
          g: 50,
          b: 50,
          opacity: 0,
        });
      });
    });

    describe('hsl colors', () => {
      it('should return RgbObject', () => {
        expect(stringToRGB('hsl(0,0%,50%)')).toMatchObject({
          r: 127.5,
          g: 127.5,
          b: 127.5,
        });
      });

      it('should return RgbObject with correct opacity', () => {
        expect(stringToRGB('hsla(0,0%,50%,0.25)').opacity).toBe(0.25);
      });

      it('should return correct RgbObject for alpha value of 0', () => {
        expect(stringToRGB('hsla(0,0%,50%,0)')).toEqual({
          r: 127.5,
          g: 127.5,
          b: 127.5,
          opacity: 0,
        });
      });
    });

    describe('named colors', () => {
      it('should return RgbObject', () => {
        expect(stringToRGB('aquamarine')).toMatchObject({
          r: 127,
          g: 255,
          b: 212,
        });
      });

      it('should return default RgbObject with 0 opacity', () => {
        expect(stringToRGB('transparent')).toMatchObject({
          r: 0,
          g: 0,
          b: 0,
          opacity: 0,
        });
      });

      it('should return default RgbObject with 0 opacity even with override', () => {
        expect(stringToRGB('transparent', 0.5)).toMatchObject({
          r: 0,
          g: 0,
          b: 0,
          opacity: 0,
        });
      });
    });

    describe('Optional opactiy override', () => {
      it('should override opacity from color', () => {
        expect(stringToRGB('rgba(50,50,50,0.25)', 0.75).opacity).toBe(0.75);
      });

      it('should use OpacityFn to compute opacity override', () => {
        expect(stringToRGB('rgba(50,50,50,0.25)', (o) => o * 2).opacity).toBe(0.5);
      });
    });
  });

  describe('validateColor', () => {
    it.each<string>(['r', 'g', 'b', 'opacity'])('should return null if %s is NaN', (value) => {
      expect(
        validateColor({
          ...defaultD3Color,
          [value]: NaN,
        }),
      ).toBeNull();
    });

    it('should return valid colors', () => {
      expect(validateColor(defaultD3Color)).toBe(defaultD3Color);
    });
  });

  describe('argsToRGB', () => {
    it.each<keyof RgbObject>(['r', 'g', 'b', 'opacity'])('should return defaultD3Color if %s is NaN', (value) => {
      const { r, g, b, opacity }: RgbObject = {
        ...defaultD3Color,
        [value]: NaN,
      };
      expect(argsToRGB(r, g, b, opacity)).toEqual(defaultD3Color);
    });

    it('should return valid colors', () => {
      const { r, g, b, opacity } = defaultD3Color;
      expect(argsToRGB(r, g, b, opacity)).toEqual(defaultD3Color);
    });
  });

  describe('argsToRGBString', () => {
    it('should return valid colors', () => {
      const { r, g, b, opacity } = defaultD3Color;
      expect(argsToRGBString(r, g, b, opacity)).toBe('rgb(255, 0, 0)');
    });
  });

  describe('RGBtoString', () => {
    it('should return valid colors', () => {
      expect(RGBtoString(defaultD3Color)).toBe('rgb(255, 0, 0)');
    });
  });
});
