/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import { LabelProps } from './types';

export const Label = ({ text, className, children }: LabelProps) => (
  <div className={`osd:flex osd:items-center osd:text-body-secondary ${className}`}>
    <div className="osd:flex osd:items-center">{children}</div>
    <div className="osd:flex osd:text-xs">{text}</div>
  </div>
);
