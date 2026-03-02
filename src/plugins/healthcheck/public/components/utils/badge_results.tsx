/*
 * Copyright Wazuh
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiBadge, EuiToolTip } from '@elastic/eui';
import { mapTaskStatusToHealthColor } from '../services/health';
import { RESULT, STATUS_CHECK_EXPLAIN, TASK } from '../../constants';

interface BadgeResultsProps {
  result: RESULT;
  isEnabled: boolean;
}

export const BadgeResults = ({ result, isEnabled }: BadgeResultsProps) => {
  const health = mapTaskStatusToHealthColor(result);

  if (!isEnabled && result === TASK.RUN_RESULT.GRAY.value) {
    return (
      <EuiToolTip content={STATUS_CHECK_EXPLAIN.disabled}>
        <EuiBadge color="default">{result}</EuiBadge>
      </EuiToolTip>
    );
  }

  return (
    <EuiToolTip content={STATUS_CHECK_EXPLAIN[result]}>
      <EuiBadge color={health}>{result}</EuiBadge>
    </EuiToolTip>
  );
};
