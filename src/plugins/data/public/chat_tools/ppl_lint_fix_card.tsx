/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButton,
  EuiButtonEmpty,
  EuiCodeBlock,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import React from 'react';
import {
  cleanupPPLLintFixRequest,
  getPPLLintFixOutcome,
  getPPLLintFixSession,
  markPPLLintFixDismissed,
  subscribePPLLintFixOutcome,
} from './ppl_lint_fix_session';
import type { RemovePPLLintFixContextById } from './ppl_lint_fix_session';
import type { PPLLintFixApprovalArgs } from '../../common/chat_tools/ppl_lint_fix_protocol';
import { PERFORMANCE_RULE_IDS } from './ppl_lint_fix_host';
import type { PPLLintFixHost } from './ppl_lint_fix_host';

/** Symbol used to bind the confirmed args clone back to the request the card captured. */
export const PPL_LINT_FIX_UI_BINDING = Symbol('pplLintFixUiBinding');

export interface PPLLintFixToolArgs {
  requestId?: string;
  sourceQueryHash?: string;
  fixedQuery: string;
  explanation?: string;
  confirmed?: boolean;
}

export type BoundPPLLintFixToolArgs = PPLLintFixToolArgs & {
  [PPL_LINT_FIX_UI_BINDING]?: string;
};

/**
 * The request id a confirmed apply is bound to: the in-process symbol the card's
 * Approve click sets, falling back to the explicit key an out-of-realm caller
 * passes when the symbol cannot survive serialization. Never trusts a
 * model-supplied request id.
 */
export const resolveApprovedRequestId = (args: unknown): string | undefined =>
  (args as BoundPPLLintFixToolArgs | null | undefined)?.[PPL_LINT_FIX_UI_BINDING] ??
  (args as PPLLintFixApprovalArgs | null | undefined)?.__approvedRequestId;

/**
 * Subset of the assistant framework's render props the card needs. Declared here
 * rather than imported so both hosts can pass their own framework's props without
 * the data plugin depending on either registration mechanism.
 */
export interface PPLLintFixCardProps {
  status: 'pending' | 'executing' | 'complete' | 'failed';
  /**
   * Parsed tool args, or the raw JSON string the chat layer forwards on the
   * agent-tool path. The card normalizes both to an object.
   */
  args?: PPLLintFixToolArgs | string;
  result?: { success?: boolean; message?: string };
  error?: Error;
  onApprove?: () => void;
  onReject?: () => void;
  host: PPLLintFixHost;
  removeContextById?: RemovePPLLintFixContextById;
  /** Prefix for this surface's `data-test-subj` values, so host selectors stay stable. */
  testSubjPrefix: string;
}

/**
 * The one Apply/Dismiss card for the AI lint-fix flow, shared by every host.
 *
 * Rendered as a component (not a bare function call) so it can use hooks: it
 * subscribes to the local outcome signal so the otherwise-idle card re-renders and
 * reaches its terminal state the instant the user clicks, rather than waiting on
 * the framework's tool-call status. That status only flips after the chat plugin
 * finishes the model's follow-up AG-UI turn, which is slow (60–128s observed) and
 * can hang — gating the card on it made both buttons look dead even though the
 * click was handled.
 */
export const PPLLintFixCard: React.FC<PPLLintFixCardProps> = ({
  status,
  args: rawArgs,
  result,
  error,
  onApprove,
  onReject,
  host,
  removeContextById,
  testSubjPrefix,
}) => {
  // The chat layer delivers tool args as a parsed object on the locally-executed
  // path but as the raw JSON string on the agent-tool path, where it stores
  // `toolCall.function.arguments` verbatim. Normalize once here: everything below
  // reads properties off `args` and binds a Symbol onto it, and a string would
  // both miss the properties and throw on the assignment.
  const args = React.useMemo(() => {
    if (typeof rawArgs !== 'string') {
      return rawArgs;
    }
    try {
      const parsed = JSON.parse(rawArgs);
      return parsed && typeof parsed === 'object' ? (parsed as PPLLintFixToolArgs) : undefined;
    } catch {
      return undefined;
    }
  }, [rawArgs]);

  const [, forceRender] = React.useState(0);
  const [submitted, setSubmitted] = React.useState(false);
  const submittedRef = React.useRef(false);
  React.useEffect(() => subscribePPLLintFixOutcome(() => forceRender((n) => n + 1)), []);

  // Capture the active request once for this card. The model-provided requestId
  // remains untrusted, but subsequent renders and clicks stay bound to the request
  // that produced this card even if a newer editor request replaces it.
  const candidateSession = getPPLLintFixSession();
  const activeSession =
    candidateSession?.getCurrentChatThreadId &&
    (!candidateSession.chatThreadId ||
      candidateSession.getCurrentChatThreadId() !== candidateSession.chatThreadId)
      ? undefined
      : candidateSession;
  const requestIdRef = React.useRef<string | undefined>(activeSession?.request.requestId);
  const requestId = requestIdRef.current;
  const session = requestId ? getPPLLintFixSession(requestId) : undefined;
  const diagnosticRef = React.useRef(session?.request.diagnostic);
  const diagnostic = session?.request.diagnostic ?? diagnosticRef.current;
  React.useEffect(
    () => () => {
      if (requestId) {
        cleanupPPLLintFixRequest(requestId, host.contextIdPrefix, removeContextById);
      }
    },
    [host.contextIdPrefix, removeContextById, requestId]
  );

  // Prefer the local outcome (set synchronously by the click / apply handler) over
  // the framework status, which lags the AG-UI round-trip.
  const outcome = requestId ? getPPLLintFixOutcome(requestId) : undefined;
  const applied = outcome?.kind === 'applied' || (status === 'complete' && !!result?.success);
  const dismissed = outcome?.kind === 'dismissed';
  const failed = outcome?.kind === 'failed' || (!outcome && status === 'failed');
  const failureMessage =
    (outcome?.kind === 'failed' ? outcome.message : undefined) ?? result?.message ?? error?.message;
  const terminal = applied || dismissed || failed;
  const showActions =
    !submitted &&
    !terminal &&
    (status === 'pending' || status === 'executing') &&
    !!args &&
    !!requestId &&
    !!session;
  // The card captured a request, but its session was released (TTL expiry, or the
  // Explore panel unmounting) with no outcome recorded — so the framework status
  // stays 'executing' and both showActions and terminal are false, leaving the
  // card with no button. That dead-ends the confirmation and wedges the chat
  // input. Offer a Dismiss so onReject can resolve the confirmation and recover.
  // Guards: `!!requestId` so an unbound/historical card never shows a no-op
  // Dismiss; `!getPPLLintFixSession()` so this only fires when no request is
  // active app-wide (the TTL/unmount wedge), not when a newer request has
  // superseded this card — that live sibling still carries its own controls.
  const released =
    !terminal &&
    !showActions &&
    !!args &&
    !!requestId &&
    !session &&
    !getPPLLintFixSession() &&
    (status === 'pending' || status === 'executing');

  // The performance rules carry their explanation on the diagnostic itself (it
  // names the attributed operation), so prefer it over the model's prose.
  const explanation =
    (diagnostic?.ruleId && PERFORMANCE_RULE_IDS.has(diagnostic.ruleId)
      ? diagnostic.message
      : args?.explanation) || diagnostic?.message;
  const appliedMessage =
    result?.message ||
    i18n.translate('data.pplLint.fixTool.appliedMessage', {
      defaultMessage: 'Applied the PPL lint fix to the editor.',
    });
  const failedMessage =
    failureMessage ||
    i18n.translate('data.pplLint.fixTool.failedMessage', {
      defaultMessage: 'The proposed PPL lint fix could not be applied.',
    });

  // Reject runs no handler (the tool is rejected before execution), so mark and
  // clean up this exact request before resolving the confirmation. Approval
  // carries the card-captured id into the handler without trusting model output.
  const handleApprove = () => {
    if (submittedRef.current) {
      return;
    }
    submittedRef.current = true;
    setSubmitted(true);
    if (requestId && args) {
      (args as BoundPPLLintFixToolArgs)[PPL_LINT_FIX_UI_BINDING] = requestId;
    }
    onApprove?.();
  };

  const handleReject = () => {
    if (submittedRef.current) {
      return;
    }
    submittedRef.current = true;
    setSubmitted(true);
    if (requestId) {
      markPPLLintFixDismissed(requestId);
      cleanupPPLLintFixRequest(requestId, host.contextIdPrefix, removeContextById);
    }
    onReject?.();
  };

  return (
    <EuiPanel paddingSize="s" data-test-subj={`${testSubjPrefix}ToolCall`}>
      <EuiText size="s">
        <strong>
          {i18n.translate('data.pplLint.fixTool.title', {
            defaultMessage: 'Apply suggested fix',
          })}
        </strong>
      </EuiText>

      {explanation && (
        <>
          <EuiSpacer size="xs" />
          <EuiText size="s">{explanation}</EuiText>
        </>
      )}

      {args?.fixedQuery && (
        <>
          <EuiSpacer size="s" />
          <EuiCodeBlock
            language="sql"
            fontSize="s"
            paddingSize="s"
            data-test-subj={`${testSubjPrefix}FixedQuery`}
          >
            {args.fixedQuery}
          </EuiCodeBlock>
        </>
      )}

      {showActions && (
        <>
          <EuiSpacer size="s" />
          <EuiFlexGroup gutterSize="s" responsive={false} justifyContent="flexEnd">
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                size="s"
                onClick={handleReject}
                data-test-subj={`${testSubjPrefix}DismissButton`}
              >
                {i18n.translate('data.pplLint.fixTool.dismissButton', {
                  defaultMessage: 'Dismiss',
                })}
              </EuiButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton
                size="s"
                fill
                onClick={handleApprove}
                data-test-subj={`${testSubjPrefix}ApplyButton`}
              >
                {i18n.translate('data.pplLint.fixTool.applyButton', {
                  defaultMessage: 'Apply to editor',
                })}
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </>
      )}

      {applied && (
        <>
          <EuiSpacer size="xs" />
          <EuiText size="xs" color="success">
            {appliedMessage}
          </EuiText>
        </>
      )}

      {dismissed && (
        <>
          <EuiSpacer size="xs" />
          <EuiText size="xs" color="subdued">
            {i18n.translate('data.pplLint.fixTool.dismissedMessage', {
              defaultMessage: 'Fix dismissed.',
            })}
          </EuiText>
        </>
      )}

      {failed && (
        <>
          <EuiSpacer size="xs" />
          <EuiText size="xs" color="danger">
            {failedMessage}
          </EuiText>
        </>
      )}

      {released && (
        <>
          <EuiSpacer size="s" />
          <EuiText size="xs" color="subdued" data-test-subj={`${testSubjPrefix}UnavailableMessage`}>
            {i18n.translate('data.pplLint.fixTool.unavailableMessage', {
              defaultMessage: 'This fix request is no longer available.',
            })}
          </EuiText>
          <EuiSpacer size="s" />
          <EuiFlexGroup gutterSize="s" responsive={false} justifyContent="flexEnd">
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                size="s"
                onClick={handleReject}
                data-test-subj={`${testSubjPrefix}DismissButton`}
              >
                {i18n.translate('data.pplLint.fixTool.dismissButton', {
                  defaultMessage: 'Dismiss',
                })}
              </EuiButtonEmpty>
            </EuiFlexItem>
          </EuiFlexGroup>
        </>
      )}
    </EuiPanel>
  );
};
