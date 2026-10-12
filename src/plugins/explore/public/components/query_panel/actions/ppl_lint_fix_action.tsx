/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef } from 'react';
import { useUnmount } from 'react-use';
import {
  buildApplyToolDescription,
  buildTestToolDescription,
  cleanupPPLLintFixRequest,
  evaluatePPLLintFixCandidate,
  getPPLLintFixSession,
  isPPLLintFixFlowActive,
  markPPLLintFixApplied,
  markPPLLintFixFailed,
  PPLLintFixCard,
  PPL_LINT_FIX_APPLY_PARAMETERS,
  PPL_LINT_FIX_TEST_PARAMETERS,
  resolveApprovedRequestId,
  runPPLLintFixTestTool,
  subscribePPLLintFixOutcome,
} from '../../../../../data/public';
import type { PPLLintFixCardProps, RemovePPLLintFixContextById } from '../../../../../data/public';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';
import { useSetEditorTextWithQuery } from '../../../application/hooks';
import { PPL_LINT_FIX_EXPLORE_HOST } from './ppl_lint_fix_host';

const HOST = PPL_LINT_FIX_EXPLORE_HOST;

let mountedFixActionHooks = 0;

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
// its hooks (the outcome subscription) work. `removeContextById` is a parameter
// because the remover belongs to the mounted hook, and the startup placeholder in
// plugin.ts has none. Without it the card's cleanup no-ops and the Dismiss path
// leaks the assistant-context entry.
export function renderPPLLintFixAction(
  props: Omit<PPLLintFixCardProps, 'host' | 'testSubjPrefix' | 'removeContextById'>,
  removeContextById?: RemovePPLLintFixContextById
) {
  return (
    <PPLLintFixCard
      {...props}
      host={HOST}
      removeContextById={removeContextById}
      testSubjPrefix="pplLintFixExplore"
    />
  );
}

// `context-lost` means no query panel is mounted, and `flow-inactive` means a
// panel is mounted with no fix flow active.
type DisabledPPLLintFixReason = 'context-lost' | 'flow-inactive';

// `registerAction` commits a first registration, and after that only a change
// to `description`, `parameters` or `available`. Otherwise it discards the new
// `handler` and `render`. So a handler is never refreshed in place, and only a
// flip of `available` between `undefined` and `'disabled'` swaps it. One
// disabled placeholder replacing another is dropped too, so the reason is
// resolved when the tool is called, not when it is registered.
const currentDisabledReason = (): DisabledPPLLintFixReason =>
  mountedFixActionHooks === 0 ? 'context-lost' : 'flow-inactive';

const DISABLED_APPLY_MESSAGES: Record<
  DisabledPPLLintFixReason,
  { error: string; message: string }
> = {
  'context-lost': {
    error: 'STOP: Tool not available - Explore query panel context has changed',
    message:
      'IMPORTANT: The apply_ppl_lint_fix_explore tool is no longer available because the user has navigated away from the Explore query panel. Do not attempt to use any more tools. Respond directly to the user and explain that the fix cannot be applied because the Explore query panel is no longer active.',
  },
  // Also serves the never-armed panel, so this must not assert that a fix ran.
  'flow-inactive': {
    error: 'STOP: Tool not available - no PPL lint fix is awaiting action',
    message:
      'IMPORTANT: There is no PPL lint fix awaiting action, so there is nothing to apply. Do not attempt to use any more tools for it. The user is still on the Explore query panel, so respond directly and explain that.',
  },
};

const DISABLED_TEST_MESSAGES: Record<DisabledPPLLintFixReason, string> = {
  'context-lost': 'The Explore query panel is no longer active.',
  'flow-inactive': 'No PPL lint fix is awaiting action.',
};

// Disable instead of unregistering. A disabled action is left out of the tool
// list sent to the model, but `hasAction` still finds it, so a late call is not
// routed to the agent as a backend tool.
export function registerDisabledPPLLintFixAction(
  registerAction: (action: any) => void | undefined,
  removeContextById?: RemovePPLLintFixContextById
) {
  if (!registerAction) return;

  registerAction({
    ...APPLY_PPL_LINT_FIX_EXPLORE_TOOL_DEFINITION,
    available: 'disabled',
    handler: async () => {
      const reason = currentDisabledReason();
      const disabledText = DISABLED_APPLY_MESSAGES[reason];
      return buildFailureResult(undefined, reason, disabledText.error, {
        stop_tool_execution: true,
        ...(reason === 'context-lost' ? { context_lost: true } : {}),
        message: disabledText.message,
      });
    },
    // Pass the hook's remover through when there is one. A card can still be
    // mounted after its flow ends, and dropping the prop re-fires its cleanup
    // effect.
    render: (
      renderProps: Omit<PPLLintFixCardProps, 'host' | 'testSubjPrefix' | 'removeContextById'>
    ) => renderPPLLintFixAction(renderProps, removeContextById),
  });
}

function registerDisabledPPLLintFixTestAction(registerAction: (action: any) => void | undefined) {
  registerAction({
    ...TEST_PPL_LINT_FIX_EXPLORE_TOOL_DEFINITION,
    available: 'disabled',
    handler: async () => {
      const reason = currentDisabledReason();
      return {
        ok: false,
        reason,
        message: DISABLED_TEST_MESSAGES[reason],
        stop_tool_execution: true,
      };
    },
  });
}

interface ExplorePPLLintFixApplyDeps {
  setEditorTextWithQuery: ReturnType<typeof useSetEditorTextWithQuery>;
  removeContextById: RemovePPLLintFixContextById;
}

function createExplorePPLLintFixApplyAction({
  setEditorTextWithQuery,
  removeContextById,
}: ExplorePPLLintFixApplyDeps) {
  return {
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
        const capturedRequestId = resolveApprovedRequestId(args);
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
          if (evaluation.reason === 'stale-query') {
            // The editor has moved on, so release the request and retire the tools.
            cleanupPPLLintFixRequest(requestId, HOST.contextIdPrefix, removeContextById);
          }
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
    render: (
      renderProps: Omit<PPLLintFixCardProps, 'host' | 'testSubjPrefix' | 'removeContextById'>
    ) => renderPPLLintFixAction(renderProps, removeContextById),
  };
}

function registerDisabledPPLLintFixTools(
  registerAction: (action: any) => void | undefined,
  removeContextById: RemovePPLLintFixContextById
) {
  registerDisabledPPLLintFixTestAction(registerAction);
  registerDisabledPPLLintFixAction(registerAction, removeContextById);
}

function registerEnabledPPLLintFixTools(
  registerAction: (action: any) => void | undefined,
  deps: ExplorePPLLintFixApplyDeps
) {
  registerAction({
    ...TEST_PPL_LINT_FIX_EXPLORE_TOOL_DEFINITION,
    handler: async (args: Pick<ApplyPPLLintFixArgs, 'fixedQuery'> = { fixedQuery: '' }) =>
      runPPLLintFixTestTool(args.fixedQuery),
  });
  registerAction(createExplorePPLLintFixApplyAction(deps));
}

export function usePPLLintFixAction(
  setEditorTextWithQuery: ReturnType<typeof useSetEditorTextWithQuery>
) {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const registerAction = services.contextProvider?.actions?.registerAssistantAction;

  // Drop the out-of-band fix-context entry the editor pushed for this request so
  // it does not linger in the conversation after the fix is applied/dismissed.
  const removeContextById = useCallback(
    (contextId: string) => {
      const store = services.contextProvider?.getAssistantContextStore?.();
      store?.removeContextById?.(contextId);
    },
    [services.contextProvider]
  );

  const isCountedInMountedHooks = useRef(false);
  // Undefined until the first registration.
  const lastRegisteredFlowActive = useRef<boolean | undefined>(undefined);

  // Enable the tools only while a fix flow is active, so a turn outside one is
  // not offered them. This registers from subscribePPLLintFixOutcome, which
  // also fires on arm and disarm. Arming notifies synchronously, so the tools
  // are in place before onAskAiFix's send reads the tool list.
  useEffect(() => {
    if (!registerAction) return;

    // `registerAction` may only arrive on a later render, so count once when it
    // does.
    if (!isCountedInMountedHooks.current) {
      isCountedInMountedHooks.current = true;
      mountedFixActionHooks += 1;
    }

    const registerToolsForFlowState = () => {
      // Every session mutation notifies, not just arm and disarm, so gate on
      // the transition.
      const flowActive = isPPLLintFixFlowActive();
      if (lastRegisteredFlowActive.current === flowActive) return;
      lastRegisteredFlowActive.current = flowActive;

      if (flowActive) {
        registerEnabledPPLLintFixTools(registerAction, {
          setEditorTextWithQuery,
          removeContextById,
        });
      } else {
        registerDisabledPPLLintFixTools(registerAction, removeContextById);
      }
    };

    registerToolsForFlowState();
    // A changed dependency re-runs this effect but registers nothing until the
    // flow state flips. setEditorTextWithQuery and removeContextById are stable
    // callbacks, so the registered closure stays current.
    return subscribePPLLintFixOutcome(registerToolsForFlowState);
  }, [registerAction, setEditorTextWithQuery, removeContextById]);

  useUnmount(() => {
    if (isCountedInMountedHooks.current) {
      isCountedInMountedHooks.current = false;
      mountedFixActionHooks = Math.max(0, mountedFixActionHooks - 1);
      if (mountedFixActionHooks === 0 && registerAction) {
        registerDisabledPPLLintFixTools(registerAction, removeContextById);
      }
    }
    const requestId = getPPLLintFixSession()?.request.requestId;
    if (requestId) {
      cleanupPPLLintFixRequest(requestId, HOST.contextIdPrefix, removeContextById);
    }
  });
}
