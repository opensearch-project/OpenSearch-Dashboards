/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import { UiActionsStart } from '../../ui_actions/public';

export interface AIChatbotSetupDependencies {
  contextProvider?: any;
}

export interface AIChatbotStartDependencies {
  uiActions: UiActionsStart;
  contextProvider?: any;
}

export interface AIChatbotSetup {}

export interface AIChatbotStart {
  openChatbot: () => void;
  closeChatbot: () => void;
}

export interface ContextData {
  pageType?: string;
  currentUrl?: string;
  panels?: any[];
  expandedDocuments?: any[];
  filters?: any[];
  query?: any;
  timeRange?: any;
  timestamp?: number;
}

export interface AgentTool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
  execute: (params: any) => Promise<string>;
}