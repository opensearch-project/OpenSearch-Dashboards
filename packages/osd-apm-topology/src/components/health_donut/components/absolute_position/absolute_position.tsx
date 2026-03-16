/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import type { AbsolutePositionProps } from './types';
import './styles.scss';

export const AbsolutePosition: React.FC<AbsolutePositionProps> = ({ children, ...positioning }) => (
  <div className="celAbsolute" style={{ ...positioning }}>
    {children}
  </div>
);
