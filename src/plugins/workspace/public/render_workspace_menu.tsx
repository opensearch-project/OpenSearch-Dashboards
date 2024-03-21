/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CoreStart } from '../../../core/public';
import { WorkspaceMenu } from './components/workspace_menu/workspace_menu';

export function renderWorkspaceMenu(coreStart: CoreStart) {
  return <WorkspaceMenu coreStart={coreStart} />;
}
