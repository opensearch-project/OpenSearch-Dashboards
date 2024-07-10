/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreStart } from '../../../core/public';
import { WorkspaceClient } from './workspace_client';

export type Services = CoreStart & { workspaceClient: WorkspaceClient };

export interface WorkspaceUseCase {
  id: string;
  title: string;
  description: string;
  features: string[];
  systematic?: boolean;
  order?: number;
}
