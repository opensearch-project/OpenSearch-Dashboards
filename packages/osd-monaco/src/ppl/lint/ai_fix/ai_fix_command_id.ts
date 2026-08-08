/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The Monaco command id the AI ("Ask AI to fix") quick-fix dispatches.
 *
 * Isolated in its own tiny module so the code-action provider can reference the
 * id without importing `ai_fix_command.ts`, which transitively pulls in the
 * compiled grammar + analyzer (heavy, and unwanted in the provider's import
 * graph and unit tests).
 */
export const AI_FIX_COMMAND_ID = 'ppl.lint.aiFix';

/**
 * The argument shape the command handler receives — from the code-action's
 * `command.arguments[0]` and from the hover card's `command:` link query. Lives
 * here (not in `ai_fix_command.ts`) so type-only consumers like the hover
 * provider and the code-action provider can reference it without importing the
 * heavy command module.
 */
export interface AiFixCommandArgs {
  modelUri: string;
  ruleId?: string;
  message: string;
  operation?: 'filter' | 'aggregation' | 'sort';
  outcome?: string;
  targetText?: string;
  targetRange?: { startOffset: number; endOffset: number };
  relatedTexts?: string[];
  fixInstructions?: string;
}
