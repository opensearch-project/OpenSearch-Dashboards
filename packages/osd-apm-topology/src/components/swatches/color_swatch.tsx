/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { ColorSwatchProps } from './types';

export const COLOR_SWATCH_TEST_ID = 'color-swatch';

export const ColorSwatch = ({ color, ...rest }: ColorSwatchProps) => (
  <div
    {...rest}
    data-test-subj={COLOR_SWATCH_TEST_ID}
    className="osd:w-4 osd:aspect-square osd:rounded-xs osd:inline-block"
    style={{ backgroundColor: color }}
  />
);
