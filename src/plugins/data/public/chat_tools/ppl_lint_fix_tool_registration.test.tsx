/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { act, fireEvent, render, screen } from '@testing-library/react';
import * as osdMonaco from '@osd/monaco';
import { hasExplainOutcome } from '@osd/monaco/target/ppl/lint/explain/explain_outcomes';
import { explainCache } from '@osd/monaco/target/ppl/lint/explain/explain_cache';
import { buildPerformanceFixProbeQueries } from '../ppl_lint/performance_fix_revalidation';
import {
  createPPLLintFixApplyAction,
  createPPLLintFixTestAction,
  PPLLintFixToolArgs,
  PPLLintFixToolRegistration,
  PPLLintFixTestToolRegistration,
  PPL_LINT_FIX_DATA_CONTEXT_ID_PREFIX,
  PPL_LINT_FIX_DATA_HOST,
  PPL_LINT_FIX_DATA_TOOL_NAME,
  PPL_LINT_FIX_TEST_DATA_TOOL_NAME,
} from './ppl_lint_fix_tool_registration';
import {
  cleanupPPLLintFixRequest,
  clearPPLLintFixSession,
  createPPLLintFixApprovalNonce,
  getPPLLintFixOutcome,
  getPPLLintFixSession,
  storePPLLintFixSession,
} from './ppl_lint_fix_session';
import { PPL_LINT_FIX_UI_BINDING } from './ppl_lint_fix_card';
import { AssistantActionService } from '../../../context_provider/public/services/assistant_action_service';

jest.mock('@osd/monaco', () => ({
  validatePPLLintFixCandidate: jest.fn(),
}));
jest.mock('@osd/monaco/target/ppl/lint/explain/explain_outcomes', () => ({
  hasExplainOutcome: jest.fn(),
}));
jest.mock('@osd/monaco/target/ppl/lint/explain/explain_cache', () => ({
  explainCache: {
    resolveResult: jest.fn(),
  },
}));
jest.mock('../ppl_lint/performance_fix_revalidation', () => ({
  buildPerformanceFixProbeQueries: jest.fn(),
}));

const mockValidate = (osdMonaco as any).validatePPLLintFixCandidate as jest.Mock;
const mockHasExplainOutcome = hasExplainOutcome as jest.Mock;
const mockResolveExplain = explainCache.resolveResult as jest.Mock;
const mockBuildPerformanceProbes = buildPerformanceFixProbeQueries as jest.Mock;

describe('PPLLintFixToolRegistration', () => {
  const queryState = {
    query: 'source=logs | where status = 500',
    language: 'PPL',
    dataset: { id: 'dataset-1', type: 'INDEX_PATTERN' },
  };
  const request = {
    requestId: 'request-1',
    sourceQueryHash: 'hash-1',
    modelUri: 'file://model-1',
    query: queryState.query,
    diagnostic: { message: 'Unknown field status', ruleId: 'field-validation' },
    datasetTitle: 'logs',
    dataSourceId: 'ds-1',
    chatMessage: 'Fix this query',
    lintContext: { fields: new Set(['status_code']) },
  };

  let queryString: { getQuery: jest.Mock; setQuery: jest.Mock };
  let mockUseAssistantAction: jest.Mock;
  let removeContextById: jest.Mock;

  const renderRegistration = (enabled = true) => {
    render(
      <PPLLintFixToolRegistration
        queryString={queryString as any}
        useAssistantAction={mockUseAssistantAction as any}
        removeContextById={removeContextById}
        enabled={enabled}
      />
    );
    return mockUseAssistantAction.mock.calls[0][0];
  };

  const storeSession = (overrides: Partial<Parameters<typeof storePPLLintFixSession>[0]> = {}) => {
    storePPLLintFixSession({
      host: PPL_LINT_FIX_DATA_HOST,
      request: request as any,
      getCurrentQuery: jest.fn(() => request.query),
      getCurrentQueryState: jest.fn(() => queryState as any),
      getLintContext: jest.fn(() => ({ fields: new Set(['fallback']) }) as any),
      ...overrides,
    });
  };

  const bindApprovedArgs = (config: any, args: PPLLintFixToolArgs): PPLLintFixToolArgs => {
    const card = render(
      <>
        {config.render({
          status: 'executing',
          args,
          onApprove: jest.fn(),
          onReject: jest.fn(),
        })}
      </>
    );
    fireEvent.click(card.getByText('Apply to editor'));
    return { ...args, confirmed: true };
  };

  const executeApproved = async (config: any, args: PPLLintFixToolArgs) => {
    const approvedArgs = bindApprovedArgs(config, args);
    let result: unknown;
    await act(async () => {
      result = await config.handler(approvedArgs);
    });
    return result;
  };

  beforeEach(() => {
    queryString = {
      getQuery: jest.fn(() => queryState),
      setQuery: jest.fn(),
    };
    mockUseAssistantAction = jest.fn();
    removeContextById = jest.fn();
    mockValidate.mockReset();
    mockHasExplainOutcome.mockReset();
    mockResolveExplain.mockReset();
    mockBuildPerformanceProbes.mockReset();
    mockBuildPerformanceProbes.mockReturnValue({
      originalTreatment: 'source=logs | where status = 500',
      fixedTreatment: 'source=logs | where status = 200',
    });
    act(() => clearPPLLintFixSession());
  });

  afterEach(() => {
    act(() => clearPPLLintFixSession());
  });

  it('registers the data-host apply tool with confirmation and a custom renderer', () => {
    const config = renderRegistration();

    expect(mockUseAssistantAction).toHaveBeenCalledWith(
      expect.objectContaining({
        name: PPL_LINT_FIX_DATA_TOOL_NAME,
        requiresConfirmation: true,
        useCustomRenderer: true,
        parameters: expect.objectContaining({
          // Only fixedQuery is required: the model no longer echoes a
          // requestId/sourceQueryHash — the UI tracks the single active request.
          required: ['fixedQuery'],
        }),
        handler: expect.any(Function),
        render: expect.any(Function),
      })
    );
    expect(config.name).toBe('apply_ppl_lint_fix_data');
    expect(config.enabled).toBe(true);
  });

  it('disables the data-host tool when its query editor is hidden', () => {
    const config = renderRegistration(false);

    expect(config.enabled).toBe(false);
  });

  it('stays recoverable when cleanup clears the session while an Apply confirmation is pending', async () => {
    // Reviewer concern (CR): TTL expiry or editor unmount can fire cleanup while an Apply
    // confirmation is pending. Confirm the request still reaches a terminal, recoverable
    // outcome instead of leaving the card stuck.
    const config = renderRegistration();
    storeSession();

    const args = { fixedQuery: 'source=logs | head 10' } as PPLLintFixToolArgs;
    const card = render(
      <>{config.render({ status: 'executing', args, onApprove: jest.fn(), onReject: jest.fn() })}</>
    );
    // The user clicks Apply (binding the captured request id onto the tool args)...
    fireEvent.click(card.getByText('Apply to editor'));
    // ...but cleanup races in and clears the session before the handler runs.
    act(() =>
      cleanupPPLLintFixRequest(
        request.requestId,
        PPL_LINT_FIX_DATA_CONTEXT_ID_PREFIX,
        removeContextById
      )
    );
    expect(getPPLLintFixSession()).toBeUndefined();

    let result: unknown;
    await act(async () => {
      result = await config.handler(args);
    });

    // Recovery: a terminal missing-request failure is returned and recorded as the outcome,
    // so the card resolves rather than hanging on the vanished session.
    expect(result).toEqual(expect.objectContaining({ success: false, reason: 'missing-request' }));
    expect(getPPLLintFixOutcome(request.requestId)).toEqual(
      expect.objectContaining({ kind: 'failed' })
    );
  });

  it('rejects a missing active request', async () => {
    const config = renderRegistration();

    const result = await config.handler({
      requestId: 'request-1',
      sourceQueryHash: 'hash-1',
      fixedQuery: 'source=logs | where status_code = 500',
    });

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        reason: 'missing-request',
      })
    );
    expect(queryString.setQuery).not.toHaveBeenCalled();
  });

  it('fails closed when a confirmed call has no card approval binding', async () => {
    storeSession();
    const activeSession = getPPLLintFixSession();
    const config = renderRegistration();

    const result = await config.handler({
      fixedQuery: 'source=logs | where status_code = 500',
      confirmed: true,
    });

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        reason: 'missing-request',
      })
    );
    expect(getPPLLintFixSession()).toBe(activeSession);
    expect(queryString.setQuery).not.toHaveBeenCalled();
  });

  it('ignores a wrong model-provided sourceQueryHash and applies against the card-bound session', async () => {
    // Hash-matching was removed by design: the handler trusts the request bound
    // by the approved card, so a bogus hash from a weak model must not block a
    // valid fix.
    storeSession();
    mockValidate.mockReturnValue({ accepted: true });
    const config = renderRegistration();

    const result = await executeApproved(config, {
      requestId: 'wrong-id',
      sourceQueryHash: 'hash-2',
      fixedQuery: 'source=logs | where status_code = 500',
    });

    expect(result).toEqual(expect.objectContaining({ success: true }));
    expect(queryString.setQuery).toHaveBeenCalled();
  });

  it('rejects a stale editor query', async () => {
    storeSession({ getCurrentQuery: jest.fn(() => 'source=logs | head 10') });
    const config = renderRegistration();

    const result = await executeApproved(config, {
      requestId: 'request-1',
      sourceQueryHash: 'hash-1',
      fixedQuery: 'source=logs | where status_code = 500',
    });

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        reason: 'stale-query',
      })
    );
    expect(queryString.setQuery).not.toHaveBeenCalled();
    expect(getPPLLintFixSession()).toBeUndefined();
    expect(removeContextById).toHaveBeenCalledWith(
      PPL_LINT_FIX_DATA_CONTEXT_ID_PREFIX + request.requestId
    );
  });

  it('rejects an invalid candidate', async () => {
    storeSession();
    mockValidate.mockReturnValue({ accepted: false, reason: 'syntax-error' });
    const config = renderRegistration();

    const result = await executeApproved(config, {
      requestId: 'request-1',
      sourceQueryHash: 'hash-1',
      fixedQuery: 'source=logs | where',
    });

    expect(mockValidate).toHaveBeenCalledWith({
      originalQuery: request.query,
      fixedQuery: 'source=logs | where',
      ruleId: 'field-validation',
      lintContext: request.lintContext,
    });
    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        reason: 'invalid-candidate',
        validationReason: 'syntax-error',
      })
    );
    expect(queryString.setQuery).not.toHaveBeenCalled();
    expect(getPPLLintFixSession()).toBeDefined();
    expect(removeContextById).not.toHaveBeenCalled();
  });

  it('keeps a corrected retry card actionable after an invalid candidate', async () => {
    storeSession();
    mockValidate.mockReturnValue({ accepted: false, reason: 'syntax-error' });
    const config = renderRegistration();
    const firstArgs = { fixedQuery: 'source=logs | where' };

    render(
      <>
        {config.render({
          status: 'executing',
          args: firstArgs,
          onApprove: jest.fn(),
          onReject: jest.fn(),
        })}
      </>
    );
    fireEvent.click(screen.getByText('Apply to editor'));

    await expect(
      config.handler({
        ...firstArgs,
        confirmed: true,
      })
    ).resolves.toEqual(expect.objectContaining({ success: false, reason: 'invalid-candidate' }));

    render(
      <>
        {config.render({
          status: 'executing',
          args: { fixedQuery: 'source=logs | where status_code = 500' },
          onApprove: jest.fn(),
          onReject: jest.fn(),
        })}
      </>
    );

    expect(screen.getByText('Apply to editor')).toBeInTheDocument();
    expect(getPPLLintFixSession()).toBeDefined();
    expect(removeContextById).not.toHaveBeenCalled();
    // Guardrail: the retryable invalid-candidate path must NOT record a terminal
    // outcome, or the corrected retry card above would lose its Apply button.
    expect(getPPLLintFixOutcome(request.requestId)).toBeUndefined();
  });

  it('records a terminal failed outcome when the approved session is gone (missing-session)', async () => {
    storeSession();
    mockValidate.mockReturnValue({ accepted: true });
    const config = renderRegistration();
    // Bind the approval onto the args (sets the UI binding Symbol) while the
    // session is live, then release the session before the handler runs.
    const approvedArgs = bindApprovedArgs(config, {
      fixedQuery: 'source=logs | where status_code = 500',
    });
    act(() => clearPPLLintFixSession());

    let result: unknown;
    await act(async () => {
      result = await config.handler(approvedArgs);
    });

    expect(result).toEqual(expect.objectContaining({ success: false, reason: 'missing-request' }));
    expect(getPPLLintFixOutcome(request.requestId)).toEqual({
      kind: 'failed',
      message: 'The active PPL lint fix request is no longer available.',
    });
    // The card self-heals to its red terminal state via the outcome subscription.
    expect(
      screen.getByText('The active PPL lint fix request is no longer available.')
    ).toBeInTheDocument();
  });

  it('records a terminal failed outcome when the editor query went stale', async () => {
    storeSession({ getCurrentQuery: jest.fn(() => 'source=logs | head 10') });
    const config = renderRegistration();

    const result = await executeApproved(config, {
      requestId: 'request-1',
      sourceQueryHash: 'hash-1',
      fixedQuery: 'source=logs | where status_code = 500',
    });

    expect(result).toEqual(expect.objectContaining({ success: false, reason: 'stale-query' }));
    const outcome = getPPLLintFixOutcome(request.requestId);
    expect(outcome?.kind).toBe('failed');
  });

  it('applies a valid candidate through queryString.setQuery with force', async () => {
    storeSession();
    mockValidate.mockReturnValue({ accepted: true });
    const config = renderRegistration();

    const result = await executeApproved(config, {
      requestId: 'request-1',
      sourceQueryHash: 'hash-1',
      fixedQuery: ' source=logs | where status_code = 500 ',
      explanation: 'Use the mapped field name.',
    });

    expect(queryString.setQuery).toHaveBeenCalledWith(
      {
        ...queryState,
        query: 'source=logs | where status_code = 500',
        language: 'PPL',
        dataset: queryState.dataset,
      },
      true
    );
    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        fixedQuery: 'source=logs | where status_code = 500',
      })
    );
    expect(getPPLLintFixSession()).toBeUndefined();
    expect(removeContextById).toHaveBeenCalledWith(
      PPL_LINT_FIX_DATA_CONTEXT_ID_PREFIX + request.requestId
    );
  });

  it('applies a performance fix only after the attributed outcome clears', async () => {
    const http = {};
    const originalPlan = { id: 'original' };
    const fixedPlan = { id: 'fixed' };
    storeSession({
      request: {
        ...request,
        diagnostic: {
          message: 'Filter runs as a script',
          ruleId: 'operation-pushed-as-script',
          operation: 'filter',
          outcome: 'filter:script',
          targetText: 'status = 500',
          targetRange: { startOffset: 20, endOffset: 32 },
        },
      } as any,
      getLintContext: jest.fn(
        () => ({ http, dataSourceId: 'ds-live', fields: new Set(['status']) }) as any
      ),
    });
    mockValidate.mockReturnValue({ accepted: true });
    mockResolveExplain
      .mockResolvedValueOnce({ status: 'ok', plan: originalPlan })
      .mockResolvedValueOnce({ status: 'ok', plan: fixedPlan });
    mockHasExplainOutcome.mockImplementation((plan) => plan === originalPlan);
    const config = renderRegistration();

    const result = await executeApproved(config, {
      fixedQuery: 'source=logs | where status = 200',
    });

    // Both treatments are prepared before explaining (source-prepend + injected
    // filters); with no preparer on this lint context the fallback keys the cache
    // on the query itself. Mirrors verify_performance_fix_outcome.
    expect(mockResolveExplain).toHaveBeenNthCalledWith(
      1,
      http,
      'source=logs | where status = 500',
      'ds-live',
      { partition: 'probe', cacheKey: 'source=logs | where status = 500' }
    );
    expect(mockResolveExplain).toHaveBeenNthCalledWith(
      2,
      http,
      'source=logs | where status = 200',
      'ds-live',
      { partition: 'probe', cacheKey: 'source=logs | where status = 200' }
    );
    expect(result).toEqual(expect.objectContaining({ success: true }));
    expect(queryString.setQuery).toHaveBeenCalled();
  });

  it('rejects a performance fix when the attributed outcome is unchanged', async () => {
    const originalPlan = { id: 'original' };
    const fixedPlan = { id: 'fixed' };
    storeSession({
      request: {
        ...request,
        diagnostic: {
          message: 'Filter runs as a script',
          ruleId: 'operation-pushed-as-script',
          operation: 'filter',
          outcome: 'filter:script',
          targetText: 'status = 500',
          targetRange: { startOffset: 20, endOffset: 32 },
        },
      } as any,
      getLintContext: jest.fn(() => ({ http: {}, dataSourceId: 'ds-live' }) as any),
    });
    mockValidate.mockReturnValue({ accepted: true });
    mockResolveExplain
      .mockResolvedValueOnce({ status: 'ok', plan: originalPlan })
      .mockResolvedValueOnce({ status: 'ok', plan: fixedPlan });
    mockHasExplainOutcome.mockReturnValue(true);
    const config = renderRegistration();

    const result = await executeApproved(config, {
      fixedQuery: 'source=logs | where status = 200',
    });

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        reason: 'performance-not-cleared',
      })
    );
    expect(queryString.setQuery).not.toHaveBeenCalled();
  });

  it('rejects a performance fix when explain revalidation fails', async () => {
    storeSession({
      request: {
        ...request,
        diagnostic: {
          message: 'Filter runs as a script',
          ruleId: 'operation-pushed-as-script',
          operation: 'filter',
          outcome: 'filter:script',
          targetText: 'status = 500',
          targetRange: { startOffset: 20, endOffset: 32 },
        },
      } as any,
      getLintContext: jest.fn(() => ({ http: {}, dataSourceId: 'ds-live' }) as any),
    });
    mockValidate.mockReturnValue({ accepted: true });
    mockResolveExplain
      .mockResolvedValueOnce({ status: 'ok', plan: { id: 'original' } })
      .mockResolvedValueOnce({ status: 'error' });
    const config = renderRegistration();

    const result = await executeApproved(config, {
      fixedQuery: 'source=logs | where status = 200',
    });

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        reason: 'performance-not-cleared',
      })
    );
    expect(queryString.setQuery).not.toHaveBeenCalled();
  });

  it('rejects a performance fix when the editor changes during worker validation', async () => {
    let currentQuery = request.query;
    let resolveProbes!: (value: { originalTreatment: string; fixedTreatment: string }) => void;
    mockBuildPerformanceProbes.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveProbes = resolve;
      })
    );
    storeSession({
      request: {
        ...request,
        diagnostic: {
          message: 'Filter runs as a script',
          ruleId: 'operation-pushed-as-script',
          operation: 'filter',
          outcome: 'filter:script',
          targetText: 'status = 500',
          targetRange: { startOffset: 20, endOffset: 32 },
        },
      } as any,
      getCurrentQuery: jest.fn(() => currentQuery),
      getLintContext: jest.fn(() => ({ http: {}, dataSourceId: 'ds-live' }) as any),
    });
    mockValidate.mockReturnValue({ accepted: true });
    const config = renderRegistration();

    const resultPromise = config.handler(
      bindApprovedArgs(config, {
        fixedQuery: 'source=logs | where status = 200',
      })
    );
    currentQuery = 'source=logs | head 10';
    resolveProbes({
      originalTreatment: 'source=logs | where status = 500',
      fixedTreatment: 'source=logs | where status = 200',
    });

    let result: unknown;
    await act(async () => {
      result = await resultPromise;
    });
    expect(result).toEqual(expect.objectContaining({ success: false, reason: 'stale-query' }));
    expect(mockResolveExplain).not.toHaveBeenCalled();
    expect(queryString.setQuery).not.toHaveBeenCalled();
    expect(getPPLLintFixSession()).toBeUndefined();
    expect(removeContextById).toHaveBeenCalledWith(
      PPL_LINT_FIX_DATA_CONTEXT_ID_PREFIX + request.requestId
    );
  });

  it('rejects a performance fix when the editor changes during explain revalidation', async () => {
    let currentQuery = request.query;
    const originalPlan = { id: 'original' };
    const fixedPlan = { id: 'fixed' };
    storeSession({
      request: {
        ...request,
        diagnostic: {
          message: 'Filter runs as a script',
          ruleId: 'operation-pushed-as-script',
          operation: 'filter',
          outcome: 'filter:script',
          targetText: 'status = 500',
          targetRange: { startOffset: 20, endOffset: 32 },
        },
      } as any,
      getCurrentQuery: jest.fn(() => currentQuery),
      getLintContext: jest.fn(() => ({ http: {}, dataSourceId: 'ds-live' }) as any),
    });
    mockValidate.mockReturnValue({ accepted: true });
    mockResolveExplain
      .mockResolvedValueOnce({ status: 'ok', plan: originalPlan })
      .mockImplementationOnce(async () => {
        currentQuery = 'source=logs | head 10';
        return { status: 'ok', plan: fixedPlan };
      });
    mockHasExplainOutcome.mockImplementation((plan) => plan === originalPlan);
    const config = renderRegistration();

    const result = await executeApproved(config, {
      fixedQuery: 'source=logs | where status = 200',
    });

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        reason: 'stale-query',
      })
    );
    expect(queryString.setQuery).not.toHaveBeenCalled();
    expect(getPPLLintFixSession()).toBeUndefined();
    expect(removeContextById).toHaveBeenCalledWith(
      PPL_LINT_FIX_DATA_CONTEXT_ID_PREFIX + request.requestId
    );
  });

  it('renderer shows both actions and wires Apply', () => {
    storeSession();
    const config = renderRegistration();
    const onApprove = jest.fn();
    const onReject = jest.fn();

    render(
      <>
        {config.render({
          status: 'executing',
          args: {
            requestId: 'request-1',
            sourceQueryHash: 'hash-1',
            fixedQuery: 'source=logs | where status_code = 500',
            explanation: 'Use the mapped field name.',
          },
          onApprove,
          onReject,
        })}
      </>
    );

    expect(screen.getByText('Use the mapped field name.')).toBeInTheDocument();
    expect(screen.queryByText('Unknown field status')).not.toBeInTheDocument();
    expect(screen.getByText('source=logs | where status_code = 500')).toBeInTheDocument();
    expect(screen.getByText('Dismiss')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Apply to editor'));

    expect(onApprove).toHaveBeenCalledTimes(1);
    expect(onReject).not.toHaveBeenCalled();
  });

  it('uses the short product message for a performance fix card', () => {
    storeSession({
      request: {
        ...request,
        diagnostic: {
          message:
            'This filter may be slow because it does extra calculations. Compare the field directly instead.',
          ruleId: 'operation-pushed-as-script',
        },
      } as any,
    });
    const config = renderRegistration();

    render(
      <>
        {config.render({
          status: 'executing',
          args: {
            fixedQuery: 'source=logs | where bytes > 6000',
            explanation: 'Detailed engine-specific explanation that should not be shown.',
          },
        })}
      </>
    );

    expect(
      screen.getByText(
        'This filter may be slow because it does extra calculations. Compare the field directly instead.'
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Detailed engine-specific explanation that should not be shown.')
    ).not.toBeInTheDocument();
  });

  it('flips the card to "Fix dismissed" the moment Dismiss is clicked', () => {
    storeSession();
    const config = renderRegistration();
    const args = {
      requestId: 'request-1',
      sourceQueryHash: 'hash-1',
      fixedQuery: 'source=logs | where status_code = 500',
    };

    const card = render(
      <>
        {config.render({
          status: 'executing',
          args,
          onApprove: jest.fn(),
          onReject: jest.fn(),
        })}
      </>
    );

    // Buttons up, no terminal message yet.
    expect(screen.getByText('Apply to editor')).toBeInTheDocument();
    expect(screen.queryByText('Fix dismissed.')).not.toBeInTheDocument();

    // Clicking Dismiss records the outcome locally and the (subscribed) card
    // re-renders to its terminal state without waiting on the AG-UI round-trip.
    fireEvent.click(screen.getByText('Dismiss'));

    expect(getPPLLintFixOutcome(request.requestId)).toEqual({ kind: 'dismissed' });
    expect(getPPLLintFixSession()).toBeUndefined();
    expect(removeContextById).toHaveBeenCalledWith(
      PPL_LINT_FIX_DATA_CONTEXT_ID_PREFIX + request.requestId
    );
    expect(screen.getByText('Fix dismissed.')).toBeInTheDocument();
    expect(screen.queryByText('Apply to editor')).not.toBeInTheDocument();

    card.rerender(
      <>
        {config.render({
          status: 'failed',
          args,
          result: { success: false, message: 'User rejected the tool execution' },
        })}
      </>
    );
    expect(screen.getByText('Fix dismissed.')).toBeInTheDocument();
    expect(screen.queryByText('User rejected the tool execution')).not.toBeInTheDocument();
  });

  it('flips the card to applied the moment the handler applies the fix', async () => {
    storeSession();
    mockValidate.mockReturnValue({ accepted: true });
    const config = renderRegistration();

    const args = {
      requestId: 'request-1',
      sourceQueryHash: 'hash-1',
      fixedQuery: 'source=logs | where status_code = 500',
    };
    render(
      <>
        {config.render({
          status: 'executing',
          args,
          onApprove: jest.fn(),
          onReject: jest.fn(),
        })}
      </>
    );

    // The apply handler runs when the confirmation is approved; it records the
    // applied outcome, which the subscribed card reflects on re-render. Wrap in
    // act() so the subscriber-triggered state update flushes before asserting.
    fireEvent.click(screen.getByText('Apply to editor'));
    await act(async () => {
      await config.handler({
        ...args,
        confirmed: true,
      });
    });

    expect(getPPLLintFixOutcome(request.requestId)).toEqual({
      kind: 'applied',
      fixedQuery: args.fixedQuery,
    });
    expect(getPPLLintFixSession()).toBeUndefined();
    expect(removeContextById).toHaveBeenCalledWith(
      PPL_LINT_FIX_DATA_CONTEXT_ID_PREFIX + request.requestId
    );
    expect(screen.queryByText('Apply to editor')).not.toBeInTheDocument();
  });

  it('hides an old card after request B replaces request A', () => {
    storeSession();
    const config = renderRegistration();
    const onApprove = jest.fn();

    render(
      <>
        {config.render({
          status: 'executing',
          args: { fixedQuery: 'source=logs | where status_code = 500' },
          onApprove,
          onReject: jest.fn(),
        })}
      </>
    );

    const newerSession = {
      host: PPL_LINT_FIX_DATA_HOST,
      request: { ...request, requestId: 'request-2' } as any,
      getCurrentQuery: jest.fn(() => request.query),
      getCurrentQueryState: jest.fn(() => queryState as any),
      getLintContext: jest.fn(() => ({ fields: new Set(['fallback']) }) as any),
    };
    act(() => {
      storePPLLintFixSession(newerSession);
    });

    expect(screen.queryByText('Apply to editor')).not.toBeInTheDocument();
    expect(onApprove).not.toHaveBeenCalled();
    expect(queryString.setQuery).not.toHaveBeenCalled();
    expect(getPPLLintFixSession()).toBe(newerSession);
    expect(getPPLLintFixOutcome('request-2')).toBeUndefined();
  });

  it('does not let an unbound old card adopt a newly launched request', () => {
    const config = renderRegistration();

    render(
      <>
        {config.render({
          status: 'executing',
          args: { fixedQuery: 'source=logs | where status_code = 500' },
          onApprove: jest.fn(),
          onReject: jest.fn(),
        })}
      </>
    );

    act(() => {
      storePPLLintFixSession({
        host: PPL_LINT_FIX_DATA_HOST,
        request: { ...request, requestId: 'request-2' } as any,
        getCurrentQuery: jest.fn(() => request.query),
        getCurrentQueryState: jest.fn(() => queryState as any),
        getLintContext: jest.fn(() => ({ fields: new Set(['fallback']) }) as any),
      });
    });

    expect(screen.queryByText('Apply to editor')).not.toBeInTheDocument();
    expect(getPPLLintFixSession('request-2')).toBeDefined();
  });

  it('does not bind a historical card from another chat thread', () => {
    storeSession({
      chatThreadId: 'thread-b',
      getCurrentChatThreadId: jest.fn(() => 'thread-a'),
    });
    const config = renderRegistration();
    const card = render(
      <>
        {config.render({
          status: 'executing',
          args: { fixedQuery: 'source=logs | where status_code = 500' },
          onApprove: jest.fn(),
          onReject: jest.fn(),
        })}
      </>
    );

    expect(screen.queryByText('Apply to editor')).not.toBeInTheDocument();
    card.unmount();
    expect(getPPLLintFixSession()).toBeDefined();
  });

  it('hides actions when the captured session expires', () => {
    storeSession();
    const config = renderRegistration();
    render(
      <>
        {config.render({
          status: 'executing',
          args: { fixedQuery: 'source=logs | where status_code = 500' },
          onApprove: jest.fn(),
          onReject: jest.fn(),
        })}
      </>
    );

    expect(screen.getByText('Apply to editor')).toBeInTheDocument();
    act(() => clearPPLLintFixSession(request.requestId));
    expect(screen.queryByText('Apply to editor')).not.toBeInTheDocument();
  });

  it('offers a Dismiss for a released session so the wedged confirmation resolves', () => {
    storeSession();
    const config = renderRegistration();
    const onReject = jest.fn();
    render(
      <>
        {config.render({
          status: 'executing',
          args: { fixedQuery: 'source=logs | where status_code = 500' },
          onApprove: jest.fn(),
          onReject,
        })}
      </>
    );

    expect(screen.getByText('Apply to editor')).toBeInTheDocument();

    // Release the captured session (TTL expiry / Explore panel unmount).
    act(() => clearPPLLintFixSession(request.requestId));

    // The dead-end is now recoverable: no Apply, but an explanation + a Dismiss
    // wired to onReject so the framework confirmation resolves and chat un-wedges.
    expect(screen.queryByText('Apply to editor')).not.toBeInTheDocument();
    expect(screen.getByText('This fix request is no longer available.')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('pplLintFixDismissButton'));
    expect(onReject).toHaveBeenCalledTimes(1);
    // handleReject marks dismissed and clears the entry so the card leaves the
    // released state on re-render.
    expect(screen.queryByText('This fix request is no longer available.')).not.toBeInTheDocument();
  });

  it('does not offer the released Dismiss on a historical card that never captured a session', () => {
    // No active session at first render: the card is a replayed/historical tool
    // call, so requestId is never captured and the released branch must not fire.
    const config = renderRegistration();
    render(
      <>
        {config.render({
          status: 'executing',
          args: { fixedQuery: 'source=logs | where status_code = 500' },
          onApprove: jest.fn(),
          onReject: jest.fn(),
        })}
      </>
    );

    expect(screen.queryByText('Apply to editor')).not.toBeInTheDocument();
    expect(screen.queryByText('This fix request is no longer available.')).not.toBeInTheDocument();
    expect(screen.queryByTestId('pplLintFixDismissButton')).not.toBeInTheDocument();
  });

  it('hides request A actions without clearing replacement request B', () => {
    storeSession();
    const config = renderRegistration();

    render(
      <>
        {config.render({
          status: 'executing',
          args: { fixedQuery: 'source=logs | where status_code = 500' },
          onApprove: jest.fn(),
          onReject: jest.fn(),
        })}
      </>
    );

    const newerSession = {
      host: PPL_LINT_FIX_DATA_HOST,
      request: { ...request, requestId: 'request-2' } as any,
      getCurrentQuery: jest.fn(() => request.query),
      getCurrentQueryState: jest.fn(() => queryState as any),
      getLintContext: jest.fn(() => ({ fields: new Set(['fallback']) }) as any),
    };
    act(() => {
      storePPLLintFixSession(newerSession);
    });

    expect(screen.queryByText('Dismiss')).not.toBeInTheDocument();
    expect(getPPLLintFixOutcome('request-2')).toBeUndefined();
    expect(getPPLLintFixSession()).toBe(newerSession);
  });

  // The chat layer forwards `toolCall.function.arguments` verbatim on the
  // agent-tool path, so the card can receive the raw JSON string. It used to
  // assign the binding Symbol straight onto that value, which throws on a string
  // ("Cannot create property Symbol(pplLintFixUiBinding) on string") — the click
  // was swallowed and Apply silently did nothing.
  it('applies the fix when the chat layer delivers args as a JSON string', async () => {
    storeSession();
    mockValidate.mockReturnValue({ accepted: true });
    const config = renderRegistration();
    const fixedQuery = 'source=logs | where status_code = 500';
    const stringArgs = JSON.stringify({ fixedQuery, explanation: 'from the agent path' });

    const card = render(
      <>
        {config.render({
          status: 'executing',
          args: stringArgs,
          onApprove: jest.fn(),
          onReject: jest.fn(),
        })}
      </>
    );

    // The card must read through the string to render the actions at all.
    const applyButton = card.getByText('Apply to editor');
    fireEvent.click(applyButton);

    // The parsed object the card bound the request onto is what the framework
    // clones into the handler, so drive the handler with that exact value.
    const boundArgs = JSON.parse(stringArgs);
    (boundArgs as any)[PPL_LINT_FIX_UI_BINDING] = request.requestId;

    let result: any;
    await act(async () => {
      result = await config.handler({ ...boundArgs, confirmed: true });
    });

    expect(result?.success).toBe(true);
    expect(queryString.setQuery).toHaveBeenCalled();
  });

  it('applies a cross-window fix authorized by a valid approval nonce', async () => {
    storeSession();
    mockValidate.mockReturnValue({ accepted: true });
    const config = renderRegistration();
    const nonce = createPPLLintFixApprovalNonce(request.requestId);

    let result: any;
    await act(async () => {
      result = await config.handler({
        fixedQuery: 'source=logs | where status_code = 500',
        __approvedNonce: nonce,
        confirmed: true,
      });
    });

    expect(result?.success).toBe(true);
    expect(queryString.setQuery).toHaveBeenCalled();
  });

  it('fails closed when a cross-window apply carries an unissued nonce', async () => {
    storeSession();
    mockValidate.mockReturnValue({ accepted: true });
    const config = renderRegistration();

    let result: any;
    await act(async () => {
      result = await config.handler({
        fixedQuery: 'source=logs | where status_code = 500',
        __approvedNonce: 'nonce-the-model-invented',
        confirmed: true,
      });
    });

    expect(result?.success).toBe(false);
    expect(result?.reason).toBe('missing-request');
    expect(queryString.setQuery).not.toHaveBeenCalled();
  });

  it('cleans an abandoned request when its chat card unmounts', () => {
    storeSession();
    const config = renderRegistration();
    const card = render(
      <>
        {config.render({
          status: 'executing',
          args: { fixedQuery: 'source=logs | where status_code = 500' },
          onApprove: jest.fn(),
          onReject: jest.fn(),
        })}
      </>
    );

    card.unmount();

    expect(getPPLLintFixSession()).toBeUndefined();
    expect(removeContextById).toHaveBeenCalledWith(
      PPL_LINT_FIX_DATA_CONTEXT_ID_PREFIX + request.requestId
    );
  });

  describe('silent test tool', () => {
    const renderTestTool = (enabled = true) => {
      render(
        <PPLLintFixTestToolRegistration
          queryString={queryString as any}
          useAssistantAction={mockUseAssistantAction as any}
          enabled={enabled}
        />
      );
      return mockUseAssistantAction.mock.calls[0][0];
    };

    it('registers a silent, no-confirmation tool with no renderer', () => {
      const config = renderTestTool();

      expect(config.name).toBe(PPL_LINT_FIX_TEST_DATA_TOOL_NAME);
      // Must run silently: no confirmation prompt and no card renderer, so the
      // user never sees a candidate that is only being probed.
      expect(config.requiresConfirmation).toBe(false);
      expect(config.render).toBeUndefined();
      expect(config.useCustomRenderer).toBeUndefined();
    });

    it('returns ok:true for a candidate that clears the finding, without applying it', async () => {
      storeSession();
      mockValidate.mockReturnValue({ accepted: true });
      const config = renderTestTool();

      const result = await config.handler({
        fixedQuery: 'source=logs | where status_code = 500',
      });

      expect(result).toEqual(expect.objectContaining({ ok: true }));
      // The test tool never applies anything.
      expect(queryString.setQuery).not.toHaveBeenCalled();
    });

    it('returns ok:false with a machine-readable reason for a failing candidate', async () => {
      storeSession();
      mockValidate.mockReturnValue({ accepted: false, reason: 'syntax-error' });
      const config = renderTestTool();

      const result = await config.handler({
        fixedQuery: 'source=logs | not valid',
      });

      expect(result).toEqual(expect.objectContaining({ ok: false, reason: 'syntax-error' }));
      expect(queryString.setQuery).not.toHaveBeenCalled();
    });

    it('returns the rule-specific unsafe-prefilter reason to the model', async () => {
      const fixInstructions =
        "Insert exactly one `WHERE LIKE(body, '%logtype=%')` stage immediately before rex.";
      storeSession({
        request: {
          ...request,
          diagnostic: {
            ...request.diagnostic,
            ruleId: 'rex-scan-cost',
            fixInstructions,
          },
        } as any,
      });
      mockValidate.mockReturnValue({ accepted: false, reason: 'unsafe-prefilter' });
      const config = renderTestTool();

      const result = await config.handler({
        fixedQuery:
          "source=logs | where match_phrase(body, 'logtype') " +
          '| rex field=body "logtype=(?<logtype>.*)"',
      });

      expect(result).toEqual(
        expect.objectContaining({
          ok: false,
          reason: 'unsafe-prefilter',
          requiredRewrite: fixInstructions,
          message: expect.stringContaining('following requiredRewrite literally'),
        })
      );
      expect(result.message).toContain('do not execute the query');
      expect(queryString.setQuery).not.toHaveBeenCalled();
    });

    it('surfaces the performance-not-cleared reason so the model can try another candidate', async () => {
      storeSession({
        request: {
          ...request,
          diagnostic: {
            message: 'Filter runs as a script',
            ruleId: 'operation-pushed-as-script',
            operation: 'filter',
            outcome: 'filter:script',
            targetText: 'status = 500',
            targetRange: { startOffset: 20, endOffset: 32 },
          },
        } as any,
        getLintContext: jest.fn(() => ({ http: {}, dataSourceId: 'ds-live' }) as any),
      });
      mockValidate.mockReturnValue({ accepted: true });
      mockResolveExplain
        .mockResolvedValueOnce({ status: 'ok', plan: { id: 'original' } })
        .mockResolvedValueOnce({ status: 'ok', plan: { id: 'fixed' } });
      // Outcome still present in the fixed plan -> not cleared.
      mockHasExplainOutcome.mockReturnValue(true);
      const config = renderTestTool();

      const result = await config.handler({
        fixedQuery: 'source=logs | where status = 200',
      });

      expect(result).toEqual(
        expect.objectContaining({ ok: false, reason: 'performance-not-cleared' })
      );
      expect(queryString.setQuery).not.toHaveBeenCalled();
    });

    it('reports a missing active request rather than throwing', async () => {
      const config = renderTestTool();

      const result = await config.handler({ fixedQuery: 'source=logs' });

      expect(result).toEqual(expect.objectContaining({ ok: false, reason: 'missing-request' }));
    });
  });
});

describe('synchronous imperative registration', () => {
  // Reviewer concern (CR): arming registers the tools in a post-commit effect, which can
  // land after the chat send snapshots the tool list. onAskAiFix instead registers them
  // synchronously via the same action service; confirm they are visible immediately.
  it('exposes both fix tools in the tool list as soon as they are registered', () => {
    const service = AssistantActionService.getInstance();
    const queryString = { getQuery: jest.fn(), setQuery: jest.fn() } as any;

    service.registerAction(createPPLLintFixApplyAction({ queryString }));
    service.registerAction(createPPLLintFixTestAction());

    const toolNames = service.getToolDefinitions().map((tool) => tool.name);
    expect(toolNames).toContain(PPL_LINT_FIX_DATA_TOOL_NAME);
    expect(toolNames).toContain(PPL_LINT_FIX_TEST_DATA_TOOL_NAME);

    service.unregisterAction(PPL_LINT_FIX_DATA_TOOL_NAME);
    service.unregisterAction(PPL_LINT_FIX_TEST_DATA_TOOL_NAME);
  });
});
