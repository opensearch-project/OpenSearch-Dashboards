/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiProgress } from '@elastic/eui';

interface Props {
  percent: number;
  count: number;
  value: string;
}

export function StringFieldProgressBar({ value, percent, count }: Props) {
  const ariaLabel = `${value}: ${count} (${percent}%)`;

  return (
    <EuiProgress value={percent} max={100} color="secondary" aria-label={ariaLabel} size="s" />
  );
}
