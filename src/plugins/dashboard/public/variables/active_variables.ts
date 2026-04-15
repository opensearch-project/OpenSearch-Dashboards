/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Variable } from './types';

/**
 * Module-level storage for the currently active dashboard's variables.
 * Set by DashboardContainer when rendered, read by DashboardStart.getActiveVariables().
 */
let activeVariables: Variable[] | undefined;

export function setActiveVariables(variables: Variable[] | undefined) {
  activeVariables = variables;
}

export function getActiveVariables(): Variable[] | undefined {
  return activeVariables;
}
