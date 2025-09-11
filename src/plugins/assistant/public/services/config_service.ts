/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ClientConfig } from '../../common/types';

export class ClientConfigService {
  private config: ClientConfig;

  constructor(config: ClientConfig) {
    this.config = config;
  }

  public getConfig(): ClientConfig {
    return this.config;
  }

  public isEnabled(): boolean {
    return this.config.agent.enabled;
  }

  public getAgentEndpoint(): string | undefined {
    return this.config.agent.endpoint;
  }

  public getAgentType(): string {
    return this.config.agent.type;
  }

  public getCapabilities(): string[] {
    return this.config.agent.capabilities || [];
  }

  public hasCapability(capability: string): boolean {
    return this.getCapabilities().includes(capability);
  }

  public canStream(): boolean {
    return this.hasCapability('streaming');
  }

  public canUseTools(): boolean {
    return this.hasCapability('tools');
  }

  public canUseContexts(): boolean {
    return this.hasCapability('contexts');
  }
}
