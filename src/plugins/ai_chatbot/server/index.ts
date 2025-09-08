import { PluginInitializerContext } from '../../../core/server';
import { AiChatbotPlugin } from './plugin';
import { configSchema, AiChatbotConfigType } from './config';

export function plugin(initializerContext: PluginInitializerContext) {
  return new AiChatbotPlugin(initializerContext);
}

export { AiChatbotConfigType };
export const config = {
  schema: configSchema,
};