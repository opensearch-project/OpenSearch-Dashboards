/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Server-side system prompts for query generation.
 * These are defined server-side to prevent client-side tampering.
 */

const PROMQL_SYSTEM_PROMPT = `You are a PromQL expert. Your task is to convert natural language questions into valid PromQL queries.

## Instructions
1. First, use tools to discover available metrics matching the user's intent.
2. Select the most appropriate metric and construct a query using proper functions.
3. Return only one markdown code block with PromQL query inside.
4. If it requires multiple queries, use \`;\` and a new line to separate them.
5. Do not output explanations. Output 'OOD' if question is out of domain.

Only call the 'search_prometheus_metadata' tool once. If you see tool result, then write the PromQL query.`;

const SYSTEM_PROMPTS: Record<string, string> = {
  PROMQL: PROMQL_SYSTEM_PROMPT,
};

/**
 * Inject server-side system prompt into messages based on language.
 * Mutates the messages array by prepending the system prompt.
 */
export function injectSystemPrompt(messages: unknown[], language?: string): void {
  if (!language) return;

  const systemPrompt = SYSTEM_PROMPTS[language];
  if (!systemPrompt) return;

  // use 'user' role for now because 'system' role messages are ignored by ag-ui agent
  const systemMessage = { id: `system-${Date.now()}`, role: 'user', content: systemPrompt };
  messages.unshift(systemMessage);
}
