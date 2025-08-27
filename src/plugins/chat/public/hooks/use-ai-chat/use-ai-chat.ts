/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useAIContext } from '../../context';
import { Message } from '../../../common/types';

export interface UseAIChatReturn {
  /**
   * The messages that are currently in the chat in AG-UI format.
   */
  messages: Message[];

  // /**
  //  * Send a new message to the chat
  //  *
  //  * ```tsx
  //  * await sendMessage({
  //  *   id: "123",
  //  *   role: "user",
  //  *   content: "Hello, process this request",
  //  * });
  //  * ```
  //  */
  // sendMessage: (message: Message, options?: AppendMessageOptions) => Promise<void>;

  // /**
  //  * Remove a specific message by ID
  //  *
  //  * ```tsx
  //  * deleteMessage("123");
  //  * ```
  //  */
  // deleteMessage: (messageId: string) => void;

  // /**
  //  * Regenerate the response for a specific message
  //  *
  //  * ```tsx
  //  * reloadMessages("123");
  //  * ```
  //  */
  // reloadMessages: (messageId: string) => Promise<void>;

  // /**
  //  * Stop the current message generation
  //  *
  //  * ```tsx
  //  * if (isLoading) {
  //  *   stopGeneration();
  //  * }
  //  * ```
  //  */
  // stopGeneration: () => void;

  // /**
  //  * Clear all messages and reset chat state
  //  *
  //  * ```tsx
  //  * reset();
  //  * console.log(messages); // []
  //  * ```
  //  */
  // reset: () => void;

  /**
   * Whether the chat is currently generating a response
   *
   * ```tsx
   * if (isLoading) {
   *   console.log("Loading...");
   * } else {
   *   console.log("Not loading");
   * }
   */
  isLoading: boolean;

  // /** Manually trigger chat completion (advanced usage) */
  // runChatCompletion: () => Promise<Message[]>;

  // /** MCP (Model Context Protocol) server configurations */
  // mcpServers: MCPServerConfig[];

  // /** Update MCP server configurations */
  // setMcpServers: (mcpServers: MCPServerConfig[]) => void;

  // /**
  //  * Current suggestions array
  //  * Use this to read the current suggestions or in conjunction with setSuggestions for manual control
  //  */
  // suggestions: SuggestionItem[];

  // /**
  //  * Manually set suggestions
  //  * Useful for manual mode or custom suggestion workflows
  //  */
  // setSuggestions: (suggestions: SuggestionItem[]) => void;

  // /**
  //  * Trigger AI-powered suggestion generation
  //  * Uses configurations from useCopilotChatSuggestions hooks
  //  * Respects global debouncing - only one generation can run at a time
  //  *
  //  * ```tsx
  //  * generateSuggestions();
  //  * console.log(suggestions); // [suggestion1, suggestion2, suggestion3]
  //  * ```
  //  */
  // generateSuggestions: () => Promise<void>;

  // /**
  //  * Clear all current suggestions
  //  * Also resets suggestion generation state
  //  */
  // resetSuggestions: () => void;

  // /** Whether suggestions are currently being generated */
  // isLoadingSuggestions: boolean;

  /** Interrupt content for human-in-the-loop workflows */
  interrupt: string | React.ReactElement | null;
}

export function useAIChat(): UseAIChatReturn {
  const { isLoading } = useAIContext();

  return {
    messages: [],
    isLoading,
    interrupt: null,
  };
}
