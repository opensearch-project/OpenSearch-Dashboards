/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AgentType } from './agent';

export interface AssistantConfig {
  agent: AgentConfig;
}

export interface AgentConfig {
  enabled: boolean;
  endpoint: string;
  type: AgentType;
  timeout: number;
  debug: boolean;
  maxRetries?: number;
  retryDelay?: number;
  auth?: AgentAuthConfig;
}

export interface AgentAuthConfig {
  type: 'none' | 'basic' | 'bearer' | 'custom';
  username?: string;
  password?: string;
  token?: string;
  headers?: Record<string, string>;
}

export interface AssistantConfigSchema {
  agent: {
    enabled: boolean;
    endpoint?: string;
    type?: AgentType;
    timeout?: number;
    debug?: boolean;
    maxRetries?: number;
    retryDelay?: number;
    auth?: AgentAuthConfig;
  };
}

export interface ClientConfig {
  agent: {
    enabled: boolean;
    endpoint?: string;
    type: AgentType;
    capabilities: string[];
  };
}

export interface PluginConfigType {
  agent: {
    enabled: boolean;
    endpoint: string;
    type: AgentType;
    timeout: number;
    debug: boolean;
    maxRetries: number;
    retryDelay: number;
    auth: AgentAuthConfig;
  };
}

export const DEFAULT_CONFIG: PluginConfigType = {
  agent: {
    enabled: false,
    endpoint: 'http://localhost:3000',
    type: 'jarvis',
    timeout: 30000,
    debug: false,
    maxRetries: 3,
    retryDelay: 1000,
    auth: {
      type: 'none',
    },
  },
};

export interface ConfigValidationError {
  path: string;
  message: string;
  value?: unknown;
}

export type ConfigValidator<T = unknown> = (config: T) => ConfigValidationError[];

export interface ConfigService {
  getConfig(): PluginConfigType;
  getClientConfig(): ClientConfig;
  isEnabled(): boolean;
  validate(): ConfigValidationError[];
}
