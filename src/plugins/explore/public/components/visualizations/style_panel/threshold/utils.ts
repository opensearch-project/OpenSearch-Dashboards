/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { ThresholdLineStyle, ThresholdLines } from '../../types';

/**
 * Get stroke dash array for different line styles
 * @param style The line style ('dashed', 'dot-dashed', or 'full')
 * @returns The stroke dash array or undefined for solid lines
 */
export const getStrokeDash = (style: string): number[] | undefined => {
  switch (style) {
    case ThresholdLineStyle.Dashed:
      return [5, 5];
    case ThresholdLineStyle.DotDashed:
      return [5, 5, 1, 5];
    case ThresholdLineStyle.Full:
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
export const createThresholdLayer = (
  thresholdLines: ThresholdLines | undefined,
  tooltipMode: string = 'all',
  barEncodingDefault?: 'x' | 'y'
): any => {
  if (!thresholdLines || thresholdLines.length === 0) {
    return null;
  }

  const encodingChannel = barEncodingDefault ?? 'y';
  // Filter active thresholds
  const activeThresholds = thresholdLines.filter((threshold) => threshold.show);

  if (activeThresholds.length === 0) {
    return null;
  }

  // Create a layer for each threshold
  const layers = activeThresholds.map((threshold) => {
    const markType = 'rule';
    const markConfig: any = {
      color: threshold.color,
      strokeWidth: threshold.width,
      tooltip:
        tooltipMode !== 'hidden'
          ? {
              content: { signal: '' },
              shared: true,
            }
          : false,
    };

    // Apply stroke dash based on threshold style
    markConfig.strokeDash = getStrokeDash(threshold.style);

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

    // Add tooltip content if enabled
    if (tooltipMode !== 'hidden') {
      const thresholdName = threshold.name ? `${threshold.name}: ` : '';

      layer.encoding.tooltip = {
        value:
          thresholdName +
          i18n.translate('explore.vis.thresholdValue', {
            defaultMessage: 'Threshold: ',
          }) +
          threshold.value,
      };
    }

    return layer;
  });

  // Return a layer object with the layers array
  return layers.length > 0 ? { layer: layers } : null;
};
