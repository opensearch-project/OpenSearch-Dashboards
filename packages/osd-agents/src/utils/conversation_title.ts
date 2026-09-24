/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Count genuine human user messages in a conversation, excluding Bedrock
 * Converse tool-result messages.
 *
 * Bedrock's Converse API represents a tool result as a `role: 'user'` message
 * whose `content` array carries a `toolResult` block. A naive `role === 'user'`
 * count is therefore inflated by every backend tool round, which previously
 * defeated the "first turn" detection for conversation-title generation. A
 * genuine human turn is a `role: 'user'` message with NO `toolResult` block.
 * (Frontend client tool results arrive as `role: 'tool'` messages and are never
 * counted here either.)
 */
export function countGenuineHumanMessages(messages: any[]): number {
  if (!Array.isArray(messages)) {
    return 0;
  }
  return messages.filter((msg) => {
    if (!msg || msg.role !== 'user') {
      return false;
    }
    if (
      Array.isArray(msg.content) &&
      msg.content.some((c: any) => c && c.toolResult !== undefined)
    ) {
      return false;
    }
    return true;
  }).length;
}

/**
 * True when the conversation is on its first human turn -- i.e. exactly one
 * genuine human message exists in the history.
 *
 * Building block for isFirstRunOfTurn, which gates one-time conversation-title
 * generation without a client-supplied
 * flag. It is robust across a first turn's backend tool rounds (the Converse
 * tool-result `role: 'user'` messages are excluded) and across the frontend-tool
 * continuation run (those tool results are `role: 'tool'`), so all of them still
 * resolve to a single genuine human message. A genuine second human message
 * makes the count 2, so later turns do not re-generate the title.
 *
 * Note: this relies on the request carrying the full conversation history
 * (the default LocalStorageMemoryProvider sends it). A provider that ships only
 * the current turn would make every turn look like the first; osd-agents is
 * stateless and does not reconstruct history from server-side memory.
 */
export function isFirstHumanTurn(messages: any[]): boolean {
  return countGenuineHumanMessages(messages) === 1;
}

/**
 * True when the messages array contains at least one assistant message.
 *
 * On a frontend-tool continuation request the payload carries the prior
 * assistant `toolUse` message plus the tool result, so an assistant message is
 * present. The very first request of a turn carries only the human message(s),
 * so this is false. (Backend tool rounds live in LangGraph state, not in the
 * request payload, so a backend-tool request payload also has no assistant
 * message.)
 */
export function hasAssistantMessage(messages: any[]): boolean {
  if (!Array.isArray(messages)) {
    return false;
  }
  return messages.some((msg) => msg && msg.role === 'assistant');
}

/**
 * True when this is the FIRST run of the conversation's first human turn --
 * the initial request, before any assistant turn exists in the payload.
 *
 * Gates both title generation and emission. The adapter uses it on the request
 * payload to emit the title exactly once; the graph uses it together with
 * `iterations === 0` (when the graph's messages are still the request payload)
 * to ask for the title only on the first LLM call. It holds for a direct answer
 * and for a backend-tool answer (whose tool rounds are internal to the one run,
 * leaving the request payload as just the human message), and is false on the
 * frontend-tool continuation request (which carries the prior assistant
 * `toolUse` message).
 */
export function isFirstRunOfTurn(messages: any[]): boolean {
  return isFirstHumanTurn(messages) && !hasAssistantMessage(messages);
}
