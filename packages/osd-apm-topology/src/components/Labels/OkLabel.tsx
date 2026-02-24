/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { OkSwatch } from '../Swatches/OkSwatch';
import { Label } from './Label';
import type { LabelProps } from './types';

export const OkLabel = ({ text, children = <OkSwatch /> }: LabelProps) => (
  <Label text={text} className="osd:gap-1.5">
    {children}
  </Label>
);
