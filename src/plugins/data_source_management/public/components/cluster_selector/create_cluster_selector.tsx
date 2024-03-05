/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ClusterSelector, ClusterSelectorProps } from './cluster_selector';

export function createClusterSelector() {
  return (props: ClusterSelectorProps) => <ClusterSelector {...props} />;
}
