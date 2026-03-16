/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { Logger } from '../utils/logger';

export interface ModelConfig {
  modelId: string;
}

export class ModelConfigManager {
  private static logger = new Logger();
  private static configPath = join(__dirname, '../../configuration/default-model.json');
  private static defaultModelId = 'us.anthropic.claude-sonnet-4-20250514-v1:0';

  static getDefaultModel(): ModelConfig {
    if (existsSync(this.configPath)) {
      try {
        const content = readFileSync(this.configPath, 'utf-8');
        const config = JSON.parse(content) as ModelConfig;
        this.logger.info('Loaded default model configuration', { modelId: config.modelId });
        return config;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.warn('Failed to load default model config, using fallback', {
          error: errorMessage,
          fallback: this.defaultModelId,
        });
      }
    }

    return { modelId: this.defaultModelId };
  }

  static setDefaultModel(modelId: string): void {
    const config: ModelConfig = { modelId };

    try {
      writeFileSync(this.configPath, JSON.stringify(config, null, 2));
      this.logger.info('Updated default model configuration', { modelId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to save default model config', { error: errorMessage });
      throw new Error(`Failed to save model configuration: ${errorMessage}`);
    }
  }

  static resolveModelId(requestModelId?: string): string {
    if (requestModelId) {
      this.logger.debug('Using model from request', { modelId: requestModelId });
      return requestModelId;
    }

    const defaultConfig = this.getDefaultModel();
    this.logger.debug('Using default model', { modelId: defaultConfig.modelId });
    return defaultConfig.modelId;
  }
}
