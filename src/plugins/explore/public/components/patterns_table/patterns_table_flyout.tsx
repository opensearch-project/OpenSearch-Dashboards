/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiButtonIcon } from '@elastic/eui';

export const PatternsTableFlyout = (record: { pattern: string; count: number; sample: string }) => {
  return (
    <EuiButtonIcon
      iconType={'inspect'}
      onClick={() => {
        alert(`open flyout: ${record.pattern} ${record.count}`);
      }}
    />
  );
};
