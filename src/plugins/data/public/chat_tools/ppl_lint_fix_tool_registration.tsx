/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { AssistantAction, ContextProviderStart } from '../../../context_provider/public';
import type { QueryStringContract } from '../query/query_string';
import {
  cleanupPPLLintFixRequest,
  getPPLLintFixSession,
  markPPLLintFixApplied,
  markPPLLintFixFailed,
} from './ppl_lint_fix_session';
import type { RemovePPLLintFixContextById } from './ppl_lint_fix_session';
import {
  buildApplyToolDescription,
  buildTestToolDescription,
  PPL_LINT_FIX_APPLY_PARAMETERS,
  PPL_LINT_FIX_TEST_PARAMETERS,
} from './ppl_lint_fix_host';
import type { PPLLintFixHost } from './ppl_lint_fix_host';
import {
  evaluatePPLLintFixCandidate,
  runPPLLintFixTestTool,
} from './evaluate_ppl_lint_fix_candidate';
import type { PPLLintFixTestToolResult } from './evaluate_ppl_lint_fix_candidate';
import { PPLLintFixCard, PPL_LINT_FIX_UI_BINDING } from './ppl_lint_fix_card';
import type { BoundPPLLintFixToolArgs, PPLLintFixToolArgs } from './ppl_lint_fix_card';

export type { PPLLintFixToolArgs } from './ppl_lint_fix_card';

/** The Discover / data search-bar host. */
export const PPL_LINT_FIX_DATA_HOST: PPLLintFixHost = {
  applyToolName: 'apply_ppl_lint_fix_data',
  testToolName: 'test_ppl_lint_fix_data',
  contextIdPrefix: 'ppl-lint-fix-data-',
  surfaceLabel: 'data editor',
};

export const PPL_LINT_FIX_DATA_TOOL_NAME = PPL_LINT_FIX_DATA_HOST.applyToolName;
export const PPL_LINT_FIX_TEST_DATA_TOOL_NAME = PPL_LINT_FIX_DATA_HOST.testToolName;
export const PPL_LINT_FIX_DATA_CONTEXT_ID_PREFIX = PPL_LINT_FIX_DATA_HOST.contextIdPrefix;

interface PPLLintFixToolResult {
  success: boolean;
  message: string;
  reason?:
    | 'missing-request'
    | 'hash-mismatch'
    | 'stale-query'
    | 'invalid-candidate'
    | 'empty-candidate'
    | 'performance-not-cleared';
  validationReason?: string;
  fixedQuery?: string;
}

interface PPLLintFixToolRegistrationProps {
  queryString: QueryStringContract;
  useAssistantAction?: ContextProviderStart['hooks']['useAssistantAction'];
  removeContextById?: RemovePPLLintFixContextById;
  enabled?: boolean;
}

const noopUseAssistantAction: ContextProviderStart['hooks']['useAssistantAction'] = () => {};

const failure = (
  reason: NonNullable<PPLLintFixToolResult['reason']>,
  message: string,
  extra?: Pick<PPLLintFixToolResult, 'validationReason'>
): PPLLintFixToolResult => ({
  success: false,
  reason,
  message,
  ...extra,
});

/**
 * Build the apply-tool action. Extracted from the component so it can also be registered
 * imperatively (synchronously, before a chat send) — see `onAskAiFix` — which avoids
 * depending on the search bar's post-commit registration effect.
 */
export function createPPLLintFixApplyAction({
  queryString,
  removeContextById,
}: {
  queryString: QueryStringContract;
  removeContextById?: RemovePPLLintFixContextById;
}): AssistantAction<PPLLintFixToolArgs> {
  return {
    name: PPL_LINT_FIX_DATA_HOST.applyToolName,
    description: buildApplyToolDescription(PPL_LINT_FIX_DATA_HOST),
    parameters: PPL_LINT_FIX_APPLY_PARAMETERS,
    requiresConfirmation: true,
    useCustomRenderer: true,
    handler: async (args) => {
      // Confirmation clones the model args before invoking this handler. Bind that
      // clone back to the request captured by the card's Approve click, rather
      // than trusting a model-provided request id or object identity.
      const capturedRequestId = (args as BoundPPLLintFixToolArgs)[PPL_LINT_FIX_UI_BINDING];
      if (!capturedRequestId) {
        return failure(
          'missing-request',
          'The approved PPL lint fix request is no longer available.'
        );
      }
      const session = getPPLLintFixSession(capturedRequestId);
      if (!session) {
        cleanupPPLLintFixRequest(
          capturedRequestId,
          PPL_LINT_FIX_DATA_HOST.contextIdPrefix,
          removeContextById
        );
        // Terminal: the request the card approved is gone, so record a local
        // failed outcome (mirroring Explore's fail()) rather than leaving the card
        // blank until the framework's slow tool-call status catches up.
        const missingSessionMessage = 'The active PPL lint fix request is no longer available.';
        markPPLLintFixFailed(capturedRequestId, missingSessionMessage);
        return failure('missing-request', missingSessionMessage);
      }
      const requestId = session.request.requestId;

      // Same acceptance check the silent test tool runs, so a candidate the model
      // already verified there passes here too. This stays as a backstop: it guards
      // against the model skipping the test step or the editor changing between
      // test and apply — but by the time the model reaches this tool it should
      // already hold a candidate that cleared.
      const evaluation = await evaluatePPLLintFixCandidate(
        session,
        args.fixedQuery,
        () =>
          getPPLLintFixSession(requestId) === session &&
          (session.getCurrentQuery() ?? '') === session.request.query
      );
      if (!evaluation.ok) {
        if (evaluation.reason === 'stale-query') {
          cleanupPPLLintFixRequest(
            requestId,
            PPL_LINT_FIX_DATA_HOST.contextIdPrefix,
            removeContextById
          );
          // Terminal: the editor moved on, so this request can never apply. Mark
          // it failed for immediate card feedback. The other non-ok reasons
          // (invalid-candidate / empty-candidate / performance-not-cleared) are
          // deliberately left unmarked so the model can re-propose against the
          // still-live session.
          markPPLLintFixFailed(requestId, evaluation.message);
        }
        return failure(evaluation.reason ?? 'invalid-candidate', evaluation.message, {
          validationReason: evaluation.validationReason,
        });
      }

      const fixedQuery = args.fixedQuery.trim();
      const currentQuery = session.getCurrentQueryState?.();
      queryString.setQuery(
        {
          ...currentQuery,
          query: fixedQuery,
          language: currentQuery?.language || 'PPL',
          dataset: currentQuery?.dataset,
        },
        true
      );
      markPPLLintFixApplied(requestId, fixedQuery);
      cleanupPPLLintFixRequest(
        requestId,
        PPL_LINT_FIX_DATA_HOST.contextIdPrefix,
        removeContextById
      );

      return {
        success: true,
        message: 'Applied the PPL lint fix to the data editor.',
        fixedQuery,
      };
    },
    render: (renderProps) => (
      <PPLLintFixCard
        {...renderProps}
        host={PPL_LINT_FIX_DATA_HOST}
        removeContextById={removeContextById}
        testSubjPrefix="pplLintFix"
      />
    ),
  };
}

export const PPLLintFixToolRegistration: React.FC<PPLLintFixToolRegistrationProps> = ({
  queryString,
  useAssistantAction,
  removeContextById,
  enabled = true,
}) => {
  const useAssistantActionHook = useAssistantAction || noopUseAssistantAction;

  useAssistantActionHook<PPLLintFixToolArgs>({
    ...createPPLLintFixApplyAction({ queryString, removeContextById }),
    enabled,
  });

  return null;
};

export interface PPLLintFixTestToolArgs {
  fixedQuery: string;
}

/**
 * Silent verifier the model calls BEFORE proposing a fix to the user. It runs the
 * same acceptance check as the apply tool (lint validation + `_explain`
 * re-verification for the performance rules) but renders nothing, applies nothing,
 * and never touches the fix card. The model uses the boolean verdict to pick the
 * best of several candidate fixes — and to decide, when none clear, that it should
 * tell the user it cannot fix the query rather than propose one that would be
 * summarily rejected.
 *
 * Extracted as a factory (alongside {@link createPPLLintFixApplyAction}) so it can also be
 * registered synchronously before a chat send.
 */
export function createPPLLintFixTestAction(): AssistantAction<PPLLintFixTestToolArgs> {
  return {
    name: PPL_LINT_FIX_DATA_HOST.testToolName,
    description: buildTestToolDescription(PPL_LINT_FIX_DATA_HOST),
    parameters: PPL_LINT_FIX_TEST_PARAMETERS,
    // No confirmation and no custom renderer: this tool must run silently and
    // never render a card, so the user only ever sees the eventual apply card.
    requiresConfirmation: false,
    handler: async (args): Promise<PPLLintFixTestToolResult> =>
      runPPLLintFixTestTool(args.fixedQuery),
  };
}

export const PPLLintFixTestToolRegistration: React.FC<PPLLintFixToolRegistrationProps> = ({
  useAssistantAction,
  enabled = true,
}) => {
  const useAssistantActionHook = useAssistantAction || noopUseAssistantAction;

  useAssistantActionHook<PPLLintFixTestToolArgs>({
    ...createPPLLintFixTestAction(),
    enabled,
  });

  return null;
};
