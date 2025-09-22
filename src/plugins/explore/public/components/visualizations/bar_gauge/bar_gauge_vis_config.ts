/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TitleOptions, ThresholdOptions } from '../types';
import { CalculationMethod } from '../utils/calculation';
import { getColors } from '../theme/default_colors';

export interface ExclusiveBarGaugeConfig {
  orientation: 'vertical' | 'horizontal';
  displayMode: 'gradient' | 'stack' | 'basic';
  valueDisplay: 'valueColor' | 'textColor' | 'hidden';
  namePlacement: 'auto' | 'hidden' | 'top' | 'left';
  showUnfilledArea: boolean;
}

export interface BarGaugeChartStyleControls {
  exclusive?: ExclusiveBarGaugeConfig;
  thresholdsOptions?: ThresholdOptions;
  valueCalculation?: CalculationMethod;
  titleOptions?: TitleOptions;
}

export const defaultBarGaugeChartStyles: BarGaugeChartStyleControls = {
  thresholdsOptions: { thresholds: [], baseColor: getColors().statusGreen },
  valueCalculation: 'last',
};
