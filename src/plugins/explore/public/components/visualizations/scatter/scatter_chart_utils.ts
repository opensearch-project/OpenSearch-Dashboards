/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { VisColumn, FieldSetting } from '../types';

export function inferAxesFromColumns(
  numerical?: VisColumn[],
  categorical?: VisColumn[]
): { x: FieldSetting | undefined; y: FieldSetting | undefined } {
  if (numerical?.length === 2 && categorical?.length === 0) {
    return {
      x: {
        default: numerical[0],
      },
      y: {
        default: numerical[1],
      },
    };
  }
  if (numerical?.length === 2 && categorical?.length === 1) {
    return {
      x: {
        default: numerical[0],
      },
      y: { default: numerical[1] },
    };
  }

  if (numerical?.length === 3 && categorical?.length === 1) {
    return {
      x: {
        default: numerical[0],
        options: numerical,
      },
      y: { default: numerical[1], options: numerical },
    };
  }
  return { x: undefined, y: undefined };
}
