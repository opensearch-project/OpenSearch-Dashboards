/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ClientConfig } from '../common/types';
import { AgentClient } from './services';

export interface AssistantPluginSetup {
  getConfig(): ClientConfig;
  getAgentClient(): AgentClient | undefined;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AssistantPluginStart {}
