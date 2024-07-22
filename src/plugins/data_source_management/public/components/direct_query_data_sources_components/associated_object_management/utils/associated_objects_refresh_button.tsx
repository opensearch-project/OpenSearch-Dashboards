/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiButton } from '@elastic/eui';
import React from 'react';
import { ASSC_OBJ_REFRESH_BTN } from './associated_objects_tab_utils';

interface AssociatedObjectsRefreshButtonProps {
  isLoading: boolean;
  onClick: () => void;
}

export const AssociatedObjectsRefreshButton: React.FC<AssociatedObjectsRefreshButtonProps> = (
  props
) => {
  const { isLoading, onClick } = props;

  return (
    <EuiButton iconType="refresh" onClick={onClick} isLoading={isLoading} isDisabled={isLoading}>
      {ASSC_OBJ_REFRESH_BTN}
    </EuiButton>
  );
};
