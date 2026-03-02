/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Metrics } from '../types/common.types';

export const DEFAULT_METRICS: Metrics = {
  requests: 0,
  faults5xx: 0,
  errors4xx: 0,
};

export const GROUP_NODE_TYPE = 'ServiceGroup';
export const AWS_SERVICE_NODE_TYPE = 'AWS::Service';
