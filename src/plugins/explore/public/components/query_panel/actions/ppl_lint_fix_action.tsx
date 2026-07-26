/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMount, useUnmount } from 'react-use';
import {
  buildApplyToolDescription,
  buildTestToolDescription,
  cleanupPPLLintFixRequest,
  evaluatePPLLintFixCandidate,
  getPPLLintFixSession,
  markPPLLintFixApplied,
  markPPLLintFixFailed,
  PPLLintFixCard,
  PPL_LINT_FIX_APPLY_PARAMETERS,
  PPL_LINT_FIX_TEST_PARAMETERS,
  PPL_LINT_FIX_UI_BINDING,
  runPPLLintFixTestTool,
} from '../../../../../data/public';
import type { BoundPPLLintFixToolArgs, PPLLintFixCardProps } from '../../../../../data/public';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';
import { useSetEditorTextWithQuery } from '../../../application/hooks';
import { PPL_LINT_FIX_EXPLORE_HOST } from './ppl_lint_fix_host';

const HOST = PPL_LINT_FIX_EXPLORE_HOST;

interface ApplyPPLLintFixArgs {
  requestId?: string;
  sourceQueryHash?: string;
  fixedQuery: string;
  explanation?: string;
}

const buildFailureResult = (
  requestId: string | undefined,
  reason: string,
  message: string,
  extra?: Record<string, unknown>
) => ({
  success: false,
  applied: false,
  requestId,
  reason,
  message,
  error: message,
  ...extra,
});

export const APPLY_PPL_LINT_FIX_EXPLORE_TOOL_DEFINITION = {
  name: HOST.applyToolName,
  description: buildApplyToolDescription(HOST),
  parameters: PPL_LINT_FIX_APPLY_PARAMETERS,
  requiresConfirmation: true,
  useCustomRenderer: true,
};

export const TEST_PPL_LINT_FIX_EXPLORE_TOOL_DEFINITION = {
  name: HOST.testToolName,
  description: buildTestToolDescription(HOST),
  parameters: PPL_LINT_FIX_TEST_PARAMETERS,
  requiresConfirmation: false,
};

// The assistant-action framework calls the registered `render` as a plain
// function; return the card as an element so React mounts it as a component and
// its hooks (the outcome subscription) work.
export function renderPPLLintFixAction(
  props: Omit<PPLLintFixCardProps, 'host' | 'testSubjPrefix'>
) {
  return <PPLLintFixCard {...props} host={HOST} testSubjPrefix="pplLintFixExplore" />;
}

export function registerDisabledPPLLintFixAction(
  registerAction: (action: any) => void | undefined
) {
  if (!registerAction) return;

  registerAction({
    ...APPLY_PPL_LINT_FIX_EXPLORE_TOOL_DEFINITION,
    available: 'disabled',
    handler: async () =>
      buildFailureResult(
        undefined,
        'context-lost',
        'STOP: Tool not available - Explore query panel context has changed',
        {
          stop_tool_execution: true,
          context_lost: true,
          message:
            'IMPORTANT: The apply_ppl_lint_fix_explore tool is no longer available because the user has navigated away from the Explore query panel. Do not attempt to use any more tools. Respond directly to the user and explain that the fix cannot be applied because the Explore query panel is no longer active.',
        }
      ),
    render: renderPPLLintFixAction,
  });
}

function registerDisabledPPLLintFixTestAction(registerAction: (action: any) => void | undefined) {
  registerAction({
    ...TEST_PPL_LINT_FIX_EXPLORE_TOOL_DEFINITION,
    available: 'disabled',
    handler: async () => ({
      ok: false,
      reason: 'context-lost',
      message: 'The Explore query panel is no longer active.',
      stop_tool_execution: true,
    }),
  });
}

export function usePPLLintFixAction(
  setEditorTextWithQuery: ReturnType<typeof useSetEditorTextWithQuery>
) {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const registerAction = services.contextProvider?.actions?.registerAssistantAction;

  // Drop the out-of-band fix-context entry the editor pushed for this request so
  // it does not linger in the conversation after the fix is applied/dismissed.
  const removeContextById = (contextId: string) => {
    const store = services.contextProvider?.getAssistantContextStore?.();
    store?.removeContextById?.(contextId);
  };

  useMount(() => {
    if (!registerAction) return;

    registerAction({
      ...TEST_PPL_LINT_FIX_EXPLORE_TOOL_DEFINITION,
      handler: async (args: Pick<ApplyPPLLintFixArgs, 'fixedQuery'> = { fixedQuery: '' }) =>
        runPPLLintFixTestTool(args.fixedQuery),
    });

    registerAction({
      ...APPLY_PPL_LINT_FIX_EXPLORE_TOOL_DEFINITION,
      handler: async (args: ApplyPPLLintFixArgs = {} as ApplyPPLLintFixArgs) => {
        // Flip the card to its terminal failure state immediately (rather than
        // waiting on the framework's tool-call status, which lags the AG-UI
        // round-trip) while still returning the machine-readable result the model
        // needs.
        const fail = (
          requestId: string | undefined,
          reason: string,
          message: string,
          extra?: Record<string, unknown>
        ) => {
          if (requestId) {
            markPPLLintFixFailed(requestId, message);
          }
          return buildFailureResult(requestId, reason, message, extra);
        };

        try {
          // Confirmation clones the model args before invoking this handler. Bind
          // that clone back to the request the card captured on Approve, rather
          // than trusting model-provided requestId/sourceQueryHash — weaker models
          // frequently filled those with the wrong values (e.g. the rule name or
          // the query text), which tripped a false stale-request and, because a
          // failure result prompts a retry, sent the model into a tool-call loop.
          const capturedRequestId = (args as BoundPPLLintFixToolArgs)[PPL_LINT_FIX_UI_BINDING];
          // Fail closed: a confirmed call with no card-approval binding must
          // refuse rather than apply against whatever session happens to be
          // active. getPPLLintFixSession(undefined) returns the active session,
          // so without this guard a binding-less call would apply blindly.
          if (!capturedRequestId) {
            return fail(
              undefined,
              'missing-request',
              'The approved Explore PPL lint fix request is no longer available.'
            );
          }
          const session = getPPLLintFixSession(capturedRequestId);
          if (!session) {
            return fail(
              capturedRequestId,
              'missing-request',
              'No active Explore PPL lint fix request was found.'
            );
          }
          const requestId = session.request.requestId;

          const evaluation = await evaluatePPLLintFixCandidate(
            session,
            args.fixedQuery,
            () =>
              getPPLLintFixSession(requestId) === session &&
              (session.getCurrentQuery() ?? '') === session.request.query
          );
          if (!evaluation.ok) {
            return fail(
              requestId,
              evaluation.reason ?? 'invalid-candidate',
              evaluation.message,
              evaluation.validationReason
                ? { validationReason: evaluation.validationReason }
                : undefined
            );
          }

          const fixedQuery = args.fixedQuery.trim();
          setEditorTextWithQuery(fixedQuery, { preserveUndo: true });
          markPPLLintFixApplied(requestId, fixedQuery);
          cleanupPPLLintFixRequest(requestId, HOST.contextIdPrefix, removeContextById);

          return {
            success: true,
            applied: true,
            requestId,
            query: fixedQuery,
            message: 'Applied the PPL lint fix to the Explore query editor.',
          };
        } catch (handlerError) {
          return fail(
            getPPLLintFixSession()?.request.requestId,
            'unexpected-error',
            handlerError instanceof Error ? handlerError.message : 'Unknown error'
          );
        }
      },
      render: renderPPLLintFixAction,
    });
  });

  useUnmount(() => {
    if (registerAction) {
      registerDisabledPPLLintFixTestAction(registerAction);
      registerDisabledPPLLintFixAction(registerAction);
    }
    const requestId = getPPLLintFixSession()?.request.requestId;
    if (requestId) {
      cleanupPPLLintFixRequest(requestId, HOST.contextIdPrefix, removeContextById);
    }
  });
}
