/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const PLUGIN_ID = 'chat';
export const PLUGIN_NAME = 'chat';
export const CHAT_DEFAULT_AG_UI_URL = 'http://localhost:3000';

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
