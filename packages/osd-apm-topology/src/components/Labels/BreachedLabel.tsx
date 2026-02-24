/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { SliStatusIcon } from '../SliStatusIcon';
import { Label } from './Label';
import type { LabelProps } from './types';

export const BreachedLabel = ({
  text,
  children = <SliStatusIcon status="breached" size={22} />,
}: LabelProps) => (
  <Label text={text} className="osd:gap-0.5">
    {children}
  </Label>
);
