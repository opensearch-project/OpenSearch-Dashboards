/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ContextProviderPlugin } from './plugin';
import { PluginInitializerContext } from '../../../core/public';

/**
 * @experimental This plugin is experimental and will change in future releases.
 */
export function plugin(initializerContext: PluginInitializerContext) {
  return new ContextProviderPlugin(initializerContext);
}

export { ContextProviderPlugin };
export * from './types';

// Context hooks
export { usePageContext } from './hooks/use_page_context';
export { useDynamicContext } from './hooks/use_dynamic_context';

// Other hooks
export { useTextSelection } from './hooks/use_text_selection';
export { useAssistantAction } from './hooks/use_assistant_action';

// Components
export { TextSelectionMonitor } from './components/text_selection_monitor';

// Services
export { AssistantActionService } from './services/assistant_action_service';
export {
  AssistantActionProvider,
  AssistantActionContext,
} from './contexts/assistant_action_context';
export { GlobalAssistantProvider } from './providers/global_assistant_provider';
export type { AssistantAction, RenderProps, ToolStatus } from './hooks/use_assistant_action';
export type { ToolCallState, ToolDefinition } from './services/assistant_action_service';
export type { URLState, UsePageContextOptions } from './hooks/use_page_context';
