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

import { getFinalTooltipPosition } from '../../../components/tooltip/utils';

describe('Tooltip position', () => {
  const container = {
    width: 100,
    height: 100,
    top: 10,
    left: 10,
  };
  const tooltip = {
    width: 40,
    height: 30,
    top: 0,
    left: 0,
  };
  const portalWidth = 50;
  describe('horizontal rotated chart', () => {
    it('can position the tooltip on the top left corner', () => {
      const position = getFinalTooltipPosition(container, tooltip, portalWidth, {
        isRotated: false,
        y1: 0,
        y0: 0,
        x0: 10,
        x1: 10,
        padding: 5,
      });
      expect(position.left).toBe('25px');
      expect(position.top).toBe('10px');
    });

    it('can position the tooltip on the bottom left corner', () => {
      const position = getFinalTooltipPosition(container, tooltip, portalWidth, {
        isRotated: false,
        y0: 90,
        y1: 90,
        x0: 10,
        x1: 10,
        padding: 5,
      });
      expect(position.left).toBe('25px');
      expect(position.top).toBe('80px');
    });

    it('can position the tooltip on the top right corner', () => {
      const position = getFinalTooltipPosition(container, tooltip, portalWidth, {
        isRotated: false,
        y0: 0,
        y1: 0,
        x0: 100,
        x1: 100,
        padding: 5,
      });
      expect(position.left).toBe('55px');
      expect(position.top).toBe('10px');
    });

    it('can position the tooltip on the bottom right corner', () => {
      const position = getFinalTooltipPosition(container, tooltip, portalWidth, {
        isRotated: false,
        y0: 90,
        y1: 90,
        x0: 100,
        x1: 100,
        padding: 5,
      });
      expect(position.left).toBe('55px');
      expect(position.top).toBe('80px');
    });

    it('should render on right if portal width is within right side', () => {
      const position = getFinalTooltipPosition(container, tooltip, 44, {
        isRotated: false,
        y0: 0,
        y1: 0,
        x0: 50,
        x1: 50,
        padding: 5,
      });
      expect(position.left).toBe('65px');
    });

    it('should render on left if portal width is NOT within right side', () => {
      const position = getFinalTooltipPosition(container, tooltip, 46, {
        isRotated: false,
        y0: 0,
        y1: 0,
        x0: 50,
        x1: 50,
        padding: 5,
      });
      expect(position.left).toBe('9px');
    });
  });

  describe('vertical rotated chart', () => {
    it('can position the tooltip on the top left corner', () => {
      const position = getFinalTooltipPosition(container, tooltip, portalWidth, {
        isRotated: true,
        y0: 0,
        y1: 0,
        x1: 10,
        x0: 10,
        padding: 5,
      });
      expect(position.left).toBe('20px');
      expect(position.top).toBe('15px');
    });

    it('can position the tooltip on the bottom left corner', () => {
      const position = getFinalTooltipPosition(container, tooltip, portalWidth, {
        isRotated: true,
        y0: 90,
        y1: 90,
        x1: 10,
        x0: 10,
        padding: 5,
      });
      expect(position.left).toBe('20px');
      expect(position.top).toBe('65px');
    });

    it('can position the tooltip on the top right corner', () => {
      const position = getFinalTooltipPosition(container, tooltip, portalWidth, {
        isRotated: true,
        y0: 0,
        y1: 0,
        x1: 100,
        x0: 100,
        padding: 5,
      });
      expect(position.left).toBe('70px');
      expect(position.top).toBe('15px');
    });

    it('can position the tooltip on the bottom right corner', () => {
      const position = getFinalTooltipPosition(container, tooltip, portalWidth, {
        isRotated: true,
        y0: 90,
        y1: 90,
        x1: 100,
        x0: 100,
        padding: 5,
      });
      expect(position.left).toBe('70px');
      expect(position.top).toBe('65px');
    });

    it('should render on right if portal width is within right side', () => {
      const position = getFinalTooltipPosition(container, tooltip, 44, {
        isRotated: true,
        y0: 0,
        y1: 0,
        x0: 50,
        x1: 50,
        padding: 5,
      });
      expect(position.left).toBe('60px');
    });

    it('should render on left if portal width is NOT within right side', () => {
      const position = getFinalTooltipPosition(container, tooltip, 51, {
        isRotated: true,
        y0: 0,
        y1: 0,
        x0: 50,
        x1: 50,
        padding: 5,
      });
      expect(position.left).toBe('70px');
    });
  });
});
