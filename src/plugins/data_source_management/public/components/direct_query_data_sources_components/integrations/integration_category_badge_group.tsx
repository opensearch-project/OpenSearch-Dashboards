/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiBadge, EuiBadgeGroup, EuiToolTip } from '@elastic/eui';
import React from 'react';

export const badges = (labels: string[]) => {
  if (labels.length <= 3) {
    return (
      <EuiBadgeGroup>
        {labels.map((label) => {
          return <EuiBadge>{label}</EuiBadge>;
        })}
      </EuiBadgeGroup>
    );
  } else {
    const tooltip = `+${labels.length - 2} more`;
    return (
      <EuiBadgeGroup>
        <EuiBadge>{labels[0]}</EuiBadge>
        <EuiBadge>{labels[1]}</EuiBadge>
        <EuiBadge>
          <EuiToolTip
            content={labels
              .slice(2)
              .map((item: string, index: number) => (index ? ', ' : '') + item)}
          >
            <h4>{tooltip}</h4>
          </EuiToolTip>
        </EuiBadge>
      </EuiBadgeGroup>
    );
  }
};
