/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ThresholdLineStyle, ThresholdLines, ThresholdOptions } from '../../types';
import { transformThresholdLinesToThreshold } from '../../style_panel/threshold/threshold_utils';

/**
 * Get stroke dash array for different line styles
 * @param style The line style ('dashed', 'dot-dashed', or 'full')
 * @returns The stroke dash array or undefined for solid lines
 */
export const getStrokeDash = (style: ThresholdLineStyle): number[] | undefined => {
  switch (style) {
    case ThresholdLineStyle.Dashed:
      return [5, 5];
    case ThresholdLineStyle.DotDashed:
      return [5, 5, 1, 5];
    case ThresholdLineStyle.Solid:
    default:
      return undefined;
  }
};

/**
 * Create threshold line layers for any chart type
 * @param thresholdLines The threshold lines array
 * @param tooltipMode The tooltip mode ('all', 'hidden', etc.)
 * @returns Array of threshold layer configurations or null if disabled
 */

// TODO move it to threshold folder in clean-up
export const createThresholdLayer = (
  thresholdOptions?: ThresholdOptions,
  thresholdLines?: ThresholdLines,
  barEncodingDefault?: 'x' | 'y'
): any => {
  const activeThresholds =
    thresholdLines && !thresholdOptions?.thresholds
      ? transformThresholdLinesToThreshold(thresholdLines)
      : thresholdOptions?.thresholds ?? [];

  const activeThresholdStyles =
    thresholdLines && thresholdLines?.length > 0 && !thresholdOptions?.thresholdStyle
      ? thresholdLines[0].style
      : thresholdOptions?.thresholdStyle ?? ThresholdLineStyle.Off;

  if (activeThresholdStyles === ThresholdLineStyle.Off || activeThresholds.length === 0) {
    return null;
  }

  const encodingChannel = barEncodingDefault ?? 'y';

  const layers = activeThresholds.map((threshold) => {
    const markType = 'rule';
    const markConfig: any = {
      color: threshold.color,
      strokeWidth: 1,
    };

    // Apply stroke dash based on threshold style
    markConfig.strokeDash = getStrokeDash(activeThresholdStyles);

    // Create the base layer
    const layer: any = {
      mark: {
        type: markType,
        ...markConfig,
      },
      encoding: {
        [encodingChannel]: {
          datum: threshold.value,
          type: 'quantitative',
        },
      },
    };

    return layer;
  });

  // Return a layer object with the layers array
  return layers.length > 0 ? { layer: layers } : null;
};
