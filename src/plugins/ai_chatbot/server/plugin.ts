import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from '../../../core/server';

import { AiChatbotConfigType } from './config';
import { defineClaudeProxyRoutes } from './routes/claude_proxy';

export class AiChatbotPlugin implements Plugin {
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup(core: CoreSetup, plugins: any) {
    this.logger.debug('aiChatbot: Setup');
    
    const router = core.http.createRouter();
    
    // Register routes
    try {
      defineClaudeProxyRoutes(router);
      this.logger.info('aiChatbot: Claude proxy routes registered successfully');
    } catch (error) {
      this.logger.error('aiChatbot: Failed to register routes:', error);
    }
    
    this.logger.info('aiChatbot: Claude proxy routes registered');
  }

  public start(core: CoreStart, plugins: any) {
    this.logger.debug('aiChatbot: Started');
  }

  public stop() {}
}