/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import { ContextProviderPlugin } from './plugin';

export function plugin() {
  return new ContextProviderPlugin();
}

export { ContextProviderPlugin };
export * from './types';
export { useAssistantContext } from './hooks/use_assistant_context';
export { useTextSelection } from './hooks/use_text_selection';
export { TextSelectionMonitor } from './components/text_selection_monitor';
export { useAssistantAction } from './hooks/use_assistant_action';
export { AssistantActionService } from './services/assistant_action_service';
export type { AssistantAction, RenderProps, ToolStatus } from './hooks/use_assistant_action';
export type { ToolCallState, ToolDefinition } from './services/assistant_action_service';
