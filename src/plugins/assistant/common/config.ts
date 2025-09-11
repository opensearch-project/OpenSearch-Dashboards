/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AssistantConfig {
  agent: {
    enabled: boolean;
    endpoint?: string;
    type: 'jarvis' | 'langgraph';
    timeout?: number;
    debug?: boolean;
    maxRetries?: number;
    retryDelay?: number;
    auth: {
      type: 'none' | 'basic' | 'bearer' | 'custom';
      username?: string;
      password?: string;
      token?: string;
      headers?: Record<string, string>;
    };
  };
}
