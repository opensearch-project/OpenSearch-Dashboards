/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getAxisConfigByColumnMapping } from './axis';
import {
  DEFAULT_X_AXIS_CONFIG,
  DEFAULT_Y_AXIS_CONFIG,
  DEFAULT_Y_2_AXIS_CONFIG,
} from '../constants';
import { AxisRole, StandardAxes, VisColumn, VisFieldType, Positions } from '../types';

describe('getAxisConfigByColumnMapping', () => {
  // Mock VisColumn for testing
  const mockVisColumn: VisColumn = {
    id: 1,
    name: 'test_column',
    schema: VisFieldType.Numerical,
    column: 'test_column',
    validValuesCount: 100,
    uniqueValuesCount: 50,
  };

  // Mock StandardAxes configurations
  const mockXAxisConfig: StandardAxes = {
    position: Positions.BOTTOM,
    show: true,
    labels: {
      show: true,
      filter: true,
      rotate: 0,
      truncate: 100,
    },
    title: {
      text: 'Custom X Axis',
    },
    grid: {
      showLines: true,
    },
    axisRole: AxisRole.X,
  };

  const mockYAxisConfig: StandardAxes = {
    position: Positions.LEFT,
    show: true,
    labels: {
      show: true,
      filter: true,
      rotate: 0,
      truncate: 100,
    },
    title: {
      text: 'Custom Y Axis',
    },
    grid: {
      showLines: true,
    },
    axisRole: AxisRole.Y,
  };

  const mockY2AxisConfig: StandardAxes = {
    position: Positions.RIGHT,
    show: true,
    labels: {
      show: true,
      filter: true,
      rotate: 0,
      truncate: 100,
    },
    title: {
      text: 'Custom Y2 Axis',
    },
    grid: {
      showLines: true,
    },
    axisRole: AxisRole.Y_SECOND,
  };

  describe('with empty inputs', () => {
    it('should return empty array when axisColumnMappings is empty', () => {
      const result = getAxisConfigByColumnMapping({});
      expect(result).toEqual([]);
    });

    it('should return empty array when axisColumnMappings has no valid columns', () => {
      const result = getAxisConfigByColumnMapping({
        [AxisRole.X]: undefined,
        [AxisRole.Y]: undefined,
      });
      expect(result).toEqual([]);
    });
  });

  describe('with default configurations', () => {
    it('should return default X axis config when X axis column is mapped and no standardAxes provided', () => {
      const axisColumnMappings = {
        [AxisRole.X]: mockVisColumn,
      };
      const result = getAxisConfigByColumnMapping(axisColumnMappings);
      expect(result).toEqual([DEFAULT_X_AXIS_CONFIG]);
    });

    it('should return multiple default configs in correct order', () => {
      const axisColumnMappings = {
        [AxisRole.X]: mockVisColumn,
        [AxisRole.Y]: mockVisColumn,
        [AxisRole.Y_SECOND]: mockVisColumn,
      };
      const result = getAxisConfigByColumnMapping(axisColumnMappings);
      expect(result).toEqual([
        DEFAULT_X_AXIS_CONFIG,
        DEFAULT_Y_AXIS_CONFIG,
        DEFAULT_Y_2_AXIS_CONFIG,
      ]);
    });
  });

  describe('with custom standardAxes configurations', () => {
    it('should use custom X axis config when provided in standardAxes', () => {
      const axisColumnMappings = {
        [AxisRole.X]: mockVisColumn,
      };
      const standardAxes = [mockXAxisConfig];
      const result = getAxisConfigByColumnMapping(axisColumnMappings, standardAxes);
      expect(result).toEqual([mockXAxisConfig]);
    });

    it('should use custom configs when available and default configs when not', () => {
      const axisColumnMappings = {
        [AxisRole.X]: mockVisColumn,
        [AxisRole.Y]: mockVisColumn,
        [AxisRole.Y_SECOND]: mockVisColumn,
      };
      const standardAxes = [mockXAxisConfig]; // Only X axis has custom config
      const result = getAxisConfigByColumnMapping(axisColumnMappings, standardAxes);
      expect(result).toEqual([
        mockXAxisConfig, // Custom X config
        DEFAULT_Y_AXIS_CONFIG, // Default Y config
        DEFAULT_Y_2_AXIS_CONFIG, // Default Y2 config
      ]);
    });
  });

  describe('with mixed scenarios', () => {
    it('should handle partial axis mappings with custom configs', () => {
      const axisColumnMappings = {
        [AxisRole.X]: mockVisColumn,
        [AxisRole.Y_SECOND]: mockVisColumn,
        // No Y axis mapping
      };
      const standardAxes = [mockXAxisConfig, mockY2AxisConfig];
      const result = getAxisConfigByColumnMapping(axisColumnMappings, standardAxes);
      expect(result).toEqual([mockXAxisConfig, mockY2AxisConfig]);
    });

    it('should ignore standardAxes that do not match any mapped columns', () => {
      const axisColumnMappings = {
        [AxisRole.X]: mockVisColumn,
      };
      const standardAxes = [mockXAxisConfig, mockYAxisConfig, mockY2AxisConfig];
      const result = getAxisConfigByColumnMapping(axisColumnMappings, standardAxes);
      expect(result).toEqual([mockXAxisConfig]);
    });

    it('should handle empty standardAxes array', () => {
      const axisColumnMappings = {
        [AxisRole.X]: mockVisColumn,
        [AxisRole.Y]: mockVisColumn,
      };
      const standardAxes: StandardAxes[] = [];
      const result = getAxisConfigByColumnMapping(axisColumnMappings, standardAxes);
      expect(result).toEqual([DEFAULT_X_AXIS_CONFIG, DEFAULT_Y_AXIS_CONFIG]);
    });

    it('should maintain correct array positions even with sparse mappings', () => {
      const axisColumnMappings = {
        [AxisRole.Y_SECOND]: mockVisColumn, // Only Y2 mapped
      };
      const result = getAxisConfigByColumnMapping(axisColumnMappings);
      expect(result).toEqual([DEFAULT_Y_2_AXIS_CONFIG]);
      expect(result.length).toBe(1);
    });

    it('should handle non-standard axis roles gracefully', () => {
      const axisColumnMappings = {
        [AxisRole.COLOR]: mockVisColumn, // Non-standard axis role
        [AxisRole.X]: mockVisColumn,
      };
      const result = getAxisConfigByColumnMapping(axisColumnMappings);
      expect(result).toEqual([DEFAULT_X_AXIS_CONFIG]);
    });

    it('should handle undefined column values in mappings', () => {
      const axisColumnMappings = {
        [AxisRole.X]: mockVisColumn,
        [AxisRole.Y]: undefined,
        [AxisRole.Y_SECOND]: mockVisColumn,
      };
      const result = getAxisConfigByColumnMapping(axisColumnMappings);
      expect(result).toEqual([DEFAULT_X_AXIS_CONFIG, DEFAULT_Y_2_AXIS_CONFIG]);
    });

    it('should handle standardAxes with mismatched axisRole', () => {
      const axisColumnMappings = {
        [AxisRole.X]: mockVisColumn,
      };
      const mismatchedConfig: StandardAxes = {
        ...mockXAxisConfig,
        axisRole: AxisRole.Y, // Mismatched role
      };
      const standardAxes = [mismatchedConfig];
      const result = getAxisConfigByColumnMapping(axisColumnMappings, standardAxes);
      expect(result).toEqual([DEFAULT_X_AXIS_CONFIG]); // Should use default since no match found
    });
  });
});
