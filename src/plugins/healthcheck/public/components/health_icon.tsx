/*
 * Copyright Wazuh
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiHealth, EuiToolTip } from '@elastic/eui';
import { TaskInfo } from 'src/core/common/healthcheck';
import { mapTaskStatusToHealthColor } from './services/health';
import { STATUS_CHECKS_EXPLAIN } from '../constants';

export const HealthIcon = ({
  children,
  tooltip,
  status,
}: {
  children?: React.ReactNode;
  tooltip?: React.ReactNode;
  status: TaskInfo['result'];
}) => {
  return (
    <EuiToolTip content={tooltip || STATUS_CHECKS_EXPLAIN[status]} position="bottom">
      <EuiHealth color={mapTaskStatusToHealthColor(status)}>{children}</EuiHealth>
    </EuiToolTip>
  );
};
