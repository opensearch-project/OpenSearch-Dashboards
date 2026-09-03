/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const PLUGIN_ID = 'chat';
export const PLUGIN_NAME = 'chat';
export const CHAT_DEFAULT_AG_UI_URL = 'http://localhost:3000';

/**
 * Appended to a halted assistant message. Shown live when the user clicks stop, and persisted by
 * the agent server on halt (OpenSearchSessionManager.HALT_MARKER), so an immediate halt and a
 * later reload show the same "partial answer + this line". Keep the two definitions in sync.
 */
export const HALT_MARKER = '\n\nThe response was stopped.';

/**
 * Prefix used on the tool result content when a tool execution fails locally
 * (e.g. JSON parse error, thrown exception in the executor).
 *
 * The ToolMessage built by `chatService.sendToolResult` only stringifies the
 * result into `content` — it does not carry an `error` flag. By prefixing the
 * error text with this string, the same content survives a snapshot reload
 * and `getToolStatus` can detect it to render the tool row in an error state
 * without needing a separate local-only ToolMessage that would diverge from
 * agentic memory. Using natural-language prose rather than a JSON metadata
 * field keeps the payload readable for the LLM on the next turn.
 */
export const TOOL_EXECUTION_ERROR_PREFIX = 'Tool execution failed: ';

export const SWITCH_DATA_SOURCE_TOOL_NAME = 'switch_data_source';
