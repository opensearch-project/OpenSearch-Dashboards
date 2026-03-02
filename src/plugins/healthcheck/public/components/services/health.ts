/*
 * Copyright Wazuh
 * SPDX-License-Identifier: Apache-2.0
 */

import { TaskInfo } from 'src/core/common/healthcheck';

const taskStatusColorMapping = {
  green: 'success',
  yellow: 'warning',
  red: 'danger',
  gray: 'subdued',
};

export function mapTaskStatusToHealthColor(status: TaskInfo['result']) {
  return (status && taskStatusColorMapping[status]) || taskStatusColorMapping.gray;
}
