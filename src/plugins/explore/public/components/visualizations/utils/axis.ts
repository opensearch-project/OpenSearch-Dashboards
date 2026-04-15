/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DEFAULT_X_AXIS_CONFIG,
  DEFAULT_Y_2_AXIS_CONFIG,
  DEFAULT_Y_AXIS_CONFIG,
} from '../constants';
import { AxisRole, StandardAxes, VisColumn } from '../types';

export const getAxisConfigByColumnMapping = (
  axisColumnMappings: Partial<Record<AxisRole, VisColumn>>,
  standardAxes: StandardAxes[] = []
) => {
  const results: StandardAxes[] = [];
  Object.keys(axisColumnMappings).forEach((role) => {
    const column = axisColumnMappings[role as AxisRole];
    if (column) {
      const found = standardAxes.find((config) => config.axisRole === role);
      if (found) {
        if (role === AxisRole.X) {
          results[0] = found;
        } else if (role === AxisRole.Y) {
          results[1] = found;
        } else if (role === AxisRole.Y_SECOND) {
          results[2] = found;
        }
      } else {
        if (role === AxisRole.X) {
          results[0] = DEFAULT_X_AXIS_CONFIG;
        } else if (role === AxisRole.Y) {
          results[1] = DEFAULT_Y_AXIS_CONFIG;
        } else if (role === AxisRole.Y_SECOND) {
          results[2] = DEFAULT_Y_2_AXIS_CONFIG;
        }
      }
    }
  });
  return results.filter(Boolean);
};
