/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Logger } from '../../../../../core/server';
import { AssistantConfigType } from '../config';
import {
  ConfigService as IConfigService,
  ConfigValidationError,
  ClientConfig,
} from '../../common/types';

export class ConfigService implements IConfigService {
  private config: AssistantConfigType;
  private logger: Logger;

  constructor(config: AssistantConfigType, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  public getConfig(): AssistantConfigType {
    return this.config;
  }

  public getClientConfig(): ClientConfig {
    return {
      agent: {
        enabled: this.config.agent.enabled,
        endpoint: this.config.agent.enabled ? this.config.agent.endpoint : undefined,
        type: this.config.agent.type,
        capabilities: this.getCapabilities(),
      },
    };
  }

  public isEnabled(): boolean {
    return this.config.agent.enabled;
  }

  public validate(): ConfigValidationError[] {
    const errors: ConfigValidationError[] = [];

    if (this.config.agent.enabled) {
      if (!this.config.agent.endpoint) {
        errors.push({
          path: 'agent.endpoint',
          message: 'Endpoint is required when agent is enabled',
          value: this.config.agent.endpoint,
        });
      }

      if (this.config.agent.timeout < 1000) {
        errors.push({
          path: 'agent.timeout',
          message: 'Timeout must be at least 1000ms',
          value: this.config.agent.timeout,
        });
      }

      if (this.config.agent.maxRetries < 0) {
        errors.push({
          path: 'agent.maxRetries',
          message: 'Max retries cannot be negative',
          value: this.config.agent.maxRetries,
        });
      }

      // Validate auth configuration
      if (this.config.agent.auth.type === 'basic') {
        if (!this.config.agent.auth.username) {
          errors.push({
            path: 'agent.auth.username',
            message: 'Username is required for basic authentication',
          });
        }
        if (!this.config.agent.auth.password) {
          errors.push({
            path: 'agent.auth.password',
            message: 'Password is required for basic authentication',
          });
        }
      }

      if (this.config.agent.auth.type === 'bearer' && !this.config.agent.auth.token) {
        errors.push({
          path: 'agent.auth.token',
          message: 'Token is required for bearer authentication',
        });
      }
    }

    return errors;
  }

  public getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    if (!this.config.agent.enabled) {
      return headers;
    }

    switch (this.config.agent.auth.type) {
      case 'basic':
        if (this.config.agent.auth.username && this.config.agent.auth.password) {
          const credentials = Buffer.from(
            `${this.config.agent.auth.username}:${this.config.agent.auth.password}`
          ).toString('base64');
          headers.Authorization = `Basic ${credentials}`;
        }
        break;

      case 'bearer':
        if (this.config.agent.auth.token) {
          headers.Authorization = `Bearer ${this.config.agent.auth.token}`;
        }
        break;

      case 'custom':
        if (this.config.agent.auth.headers) {
          Object.assign(headers, this.config.agent.auth.headers);
        }
        break;
    }

    return headers;
  }

  private getCapabilities(): string[] {
    const capabilities: string[] = [];

    if (this.config.agent.enabled) {
      capabilities.push('chat');
      capabilities.push('streaming');
      capabilities.push('contexts');
      capabilities.push('tools');

      if (this.config.agent.type === 'jarvis') {
        capabilities.push('jarvis-agent');
      } else if (this.config.agent.type === 'langgraph') {
        capabilities.push('langgraph-agent');
      }
    }

    return capabilities;
  }

  public logConfig(): void {
    if (this.config.agent.debug) {
      this.logger.debug('Assistant configuration:', {
        enabled: this.config.agent.enabled,
        endpoint: this.config.agent.endpoint,
        type: this.config.agent.type,
        timeout: this.config.agent.timeout,
        maxRetries: this.config.agent.maxRetries,
        retryDelay: this.config.agent.retryDelay,
        authType: this.config.agent.auth.type,
      });
    } else {
      this.logger.info('Assistant agent enabled:', this.config.agent.enabled);
    }
  }
}
