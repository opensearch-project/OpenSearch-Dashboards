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

// Types
export type { AssistantAction, RenderProps, ToolStatus } from './hooks/use_assistant_action';
export type { ToolCallState, ToolDefinition } from './services/assistant_action_service';
export type { URLState, UsePageContextOptions } from './hooks/use_page_context';
