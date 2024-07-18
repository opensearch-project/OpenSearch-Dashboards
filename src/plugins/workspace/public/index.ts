/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkspacePlugin } from './plugin';
export { getUseCaseFromFeatureConfig } from './utils';
export { WORKSPACE_USE_CASES } from '../common/constants';

export function plugin() {
  return new WorkspacePlugin();
}
