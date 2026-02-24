/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { FaultsSwatch } from '../Swatches/FaultsSwatch';
import { Label } from './Label';
import type { LabelProps } from './types';

export const FaultsLabel = ({ text, children = <FaultsSwatch /> }: LabelProps) => (
  <Label text={text} className="osd:gap-1.5">
    {children}
  </Label>
);
