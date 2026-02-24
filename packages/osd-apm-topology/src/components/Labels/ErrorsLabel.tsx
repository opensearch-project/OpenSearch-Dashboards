/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { ErrorsSwatch } from '../Swatches/ErrorsSwatch';
import { Label } from './Label';
import type { LabelProps } from './types';

export const ErrorsLabel = ({ text, children = <ErrorsSwatch /> }: LabelProps) => (
  <Label text={text} className="osd:gap-1.5">
    {children}
  </Label>
);
