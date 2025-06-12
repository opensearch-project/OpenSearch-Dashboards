/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiButtonEmpty } from '@elastic/eui';

export interface RecentQuerySelectorProps {
  size?: 'xs' | 's' | 'l';
}

/**
 * Placeholder component for recent query selection
 * TODO: Implement full functionality with query history
 */
export const RecentQuerySelector: React.FC<RecentQuerySelectorProps> = ({ size = 's' }) => {
  const handleClick = () => {
    // TODO: Implement recent query dropdown functionality
  };

  return (
    <EuiButtonEmpty
      size={size}
      iconType="clock"
      onClick={handleClick}
      data-test-subj="exploreRecentQueriesButton"
    >
      Recent queries
    </EuiButtonEmpty>
  );
};
