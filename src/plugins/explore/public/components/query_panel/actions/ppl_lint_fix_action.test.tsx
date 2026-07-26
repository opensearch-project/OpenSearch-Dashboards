/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { validatePPLLintFixCandidate } from '@osd/monaco';
import { verifyPerformanceFixOutcome } from '../../../../../data/public';
import {
  APPLY_PPL_LINT_FIX_EXPLORE_TOOL_DEFINITION,
  TEST_PPL_LINT_FIX_EXPLORE_TOOL_DEFINITION,
  registerDisabledPPLLintFixAction,
  renderPPLLintFixAction,
  usePPLLintFixAction,
} from './ppl_lint_fix_action';
import {
  clearActivePPLLintFixSession,
  getActivePPLLintFixSession,
  getPPLLintFixOutcome,
  setActivePPLLintFixSession,
} from './ppl_lint_fix_session';
import { PPL_LINT_FIX_UI_BINDING } from '../../../../../data/public';
import { PPL_LINT_FIX_EXPLORE_HOST } from './ppl_lint_fix_host';

const mockRegisterAssistantAction = jest.fn();
const mockSetEditorTextWithQuery = jest.fn();

// The apply handler binds the confirmed args back to the card-captured request
// via PPL_LINT_FIX_UI_BINDING (the card sets this on Approve). A confirmed call
// with no binding fails closed, so tests that exercise a real approval must
// carry the binding the same way the card does.
const withApprovalBinding = <T extends Record<string, unknown>>(args: T, requestId: string): T => {
  (args as any)[PPL_LINT_FIX_UI_BINDING] = requestId;
  return args;
};

// Spread the real barrel: a bare object here would drop `monaco` itself, which
// data/public's antlr constants dereference at module load.
jest.mock('@osd/monaco', () => ({
  ...jest.requireActual('@osd/monaco'),
  validatePPLLintFixCandidate: jest.fn(),
}));

// The shared candidate evaluator imports this module directly, so mock the module
// rather than the data/public barrel — the barrel must stay real because the
// session store, evaluator and approve card now live behind it.
jest.mock('../../../../../data/public/ppl_lint/verify_performance_fix_outcome', () => ({
  verifyPerformanceFixOutcome: jest.fn(),
}));

// Keep the real module's other exports: importing the shared fix flow from
// data/public also loads data's UI barrel, which needs withOpenSearchDashboards.
jest.mock('../../../../../opensearch_dashboards_react/public', () => ({
  ...jest.requireActual('../../../../../opensearch_dashboards_react/public'),
  useOpenSearchDashboards: () => ({
    services: {
      contextProvider: {
        actions: { registerAssistantAction: mockRegisterAssistantAction },
      },
    },
  }),
}));

jest.mock('@elastic/eui', () => ({
  EuiButton: ({ children, onClick, fill, size, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
  EuiButtonEmpty: ({ children, onClick, size, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
  EuiCallOut: ({ title }: any) => <div>{title}</div>,
  EuiCodeBlock: ({ children }: any) => <pre>{children}</pre>,
  EuiFlexGroup: ({ children }: any) => <div>{children}</div>,
  EuiFlexItem: ({ children }: any) => <div>{children}</div>,
  EuiPanel: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  EuiSpacer: () => <div />,
  EuiText: ({ children }: any) => <div>{children}</div>,
}));

const mockValidatePPLLintFixCandidate = jest.mocked(validatePPLLintFixCandidate);
const mockVerifyPerformanceFixOutcome = jest.mocked(verifyPerformanceFixOutcome);

const request = {
  requestId: 'req-1',
  sourceQueryHash: 'hash-1',
  toolName: 'apply_ppl_lint_fix_explore',
  modelUri: 'file://model',
  query: 'source=logs | where status = 500',
  diagnostic: {
    message: 'status is not a known field',
    ruleId: 'unknown-field',
  },
  chatMessage: 'Please fix this query',
  lintContext: {
    fields: new Set(['response_status']),
  } as any,
};

describe('usePPLLintFixAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearActivePPLLintFixSession();
    mockValidatePPLLintFixCandidate.mockReturnValue({ accepted: true });
    mockVerifyPerformanceFixOutcome.mockResolvedValue(true);
  });

  const renderAndGetAction = () => {
    act(() => {
      renderHook(() => usePPLLintFixAction(mockSetEditorTextWithQuery));
    });
    expect(mockRegisterAssistantAction).toHaveBeenCalled();
    return mockRegisterAssistantAction.mock.calls[
      mockRegisterAssistantAction.mock.calls.length - 1
    ][0];
  };

  const setSession = (currentQuery = request.query) => {
    setActivePPLLintFixSession({
      host: PPL_LINT_FIX_EXPLORE_HOST,
      request,
      getCurrentQuery: () => currentQuery,
      getLintContext: () =>
        ({
          fields: new Set(['response_status']),
        }) as any,
    });
  };

  it('registers the Explore-specific fix action with confirmation and custom rendering', () => {
    const action = renderAndGetAction();

    expect(action.name).toBe('apply_ppl_lint_fix_explore');
    expect(action.requiresConfirmation).toBe(true);
    expect(action.useCustomRenderer).toBe(true);
    // The schema requires only fixedQuery: the model no longer echoes a
    // requestId/sourceQueryHash (weak models filled them wrong and tripped a
    // false mismatch loop). The UI tracks the single active request instead.
    expect(action.parameters.required).toEqual(['fixedQuery']);
    expect(action.render).toBe(renderPPLLintFixAction);
  });

  it('registers a silent test action that validates without updating the editor', async () => {
    setSession();
    act(() => {
      renderHook(() => usePPLLintFixAction(mockSetEditorTextWithQuery));
    });
    const testAction = mockRegisterAssistantAction.mock.calls
      .map(([action]) => action)
      .find((action) => action.name === 'test_ppl_lint_fix_explore');

    expect(testAction.requiresConfirmation).toBe(false);
    expect(testAction.render).toBeUndefined();
    const result = await testAction.handler({
      fixedQuery: 'source=logs | where response_status = 500',
    });
    expect(result).toEqual(expect.objectContaining({ ok: true }));
    expect(mockSetEditorTextWithQuery).not.toHaveBeenCalled();
  });

  it('returns the exact rewrite contract after a rejected silent candidate', async () => {
    const fixInstructions =
      "Insert exactly one `WHERE LIKE(body, '%logtype=%')` stage immediately before rex.";
    setActivePPLLintFixSession({
      host: PPL_LINT_FIX_EXPLORE_HOST,
      request: {
        ...request,
        diagnostic: {
          ...request.diagnostic,
          ruleId: 'rex-scan-cost',
          fixInstructions,
        },
      },
      getCurrentQuery: () => request.query,
      getLintContext: () => request.lintContext,
    });
    mockValidatePPLLintFixCandidate.mockReturnValue({
      accepted: false,
      reason: 'prefilter-not-exact-substring',
    });
    act(() => {
      renderHook(() => usePPLLintFixAction(mockSetEditorTextWithQuery));
    });
    const testAction = mockRegisterAssistantAction.mock.calls
      .map(([action]) => action)
      .find((action) => action.name === 'test_ppl_lint_fix_explore');

    const result = await testAction.handler({
      fixedQuery: "source=logs | where LIKE(body, '%logtype=ws:access%')",
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        reason: 'prefilter-not-exact-substring',
        requiredRewrite: fixInstructions,
        message: expect.stringContaining('following requiredRewrite literally'),
      })
    );
    expect(result.message).toContain('do not execute the query');
    expect(mockSetEditorTextWithQuery).not.toHaveBeenCalled();
  });

  it('applies a valid candidate through setEditorTextWithQuery', async () => {
    setSession();
    const action = renderAndGetAction();

    const result = await action.handler(
      withApprovalBinding(
        {
          requestId: 'req-1',
          sourceQueryHash: 'hash-1',
          fixedQuery: 'source=logs | where response_status = 500',
          explanation: 'Use the mapped status field.',
        },
        request.requestId
      )
    );

    expect(mockValidatePPLLintFixCandidate).toHaveBeenCalledWith({
      originalQuery: request.query,
      fixedQuery: 'source=logs | where response_status = 500',
      ruleId: 'unknown-field',
      lintContext: request.lintContext,
    });
    expect(mockSetEditorTextWithQuery).toHaveBeenCalledWith(
      'source=logs | where response_status = 500',
      { preserveUndo: true }
    );
    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        applied: true,
        requestId: 'req-1',
      })
    );
  });

  it('rejects when there is no active request', async () => {
    const action = renderAndGetAction();

    const result = await action.handler(
      withApprovalBinding(
        {
          requestId: 'req-1',
          sourceQueryHash: 'hash-1',
          fixedQuery: 'source=logs',
        },
        request.requestId
      )
    );

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        applied: false,
        reason: 'missing-request',
      })
    );
    expect(mockSetEditorTextWithQuery).not.toHaveBeenCalled();
  });

  it('fails closed when a confirmed call has no card approval binding', async () => {
    // A live session exists, but the confirmed args carry no
    // PPL_LINT_FIX_UI_BINDING. getPPLLintFixSession(undefined) would return the
    // active session, so without the guard the handler would apply the fix
    // against whatever request happens to be active. It must refuse instead.
    setSession();
    const activeSession = getActivePPLLintFixSession();
    const action = renderAndGetAction();

    const result = await action.handler({
      fixedQuery: 'source=logs | where response_status = 500',
    });

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        applied: false,
        reason: 'missing-request',
      })
    );
    expect(mockSetEditorTextWithQuery).not.toHaveBeenCalled();
    // The active session is untouched — the guard fires before any lookup.
    expect(getActivePPLLintFixSession()).toBe(activeSession);
  });

  it('ignores a wrong model-provided sourceQueryHash and applies against the active session', async () => {
    // Hash-matching was removed by design: the handler trusts the single active
    // session (staleness is checked by comparing the live editor query, below),
    // so a bogus hash from a weak model must NOT block a valid fix.
    setSession();
    const action = renderAndGetAction();

    const result = await action.handler(
      withApprovalBinding(
        {
          requestId: 'wrong-id',
          sourceQueryHash: 'old-hash',
          fixedQuery: 'source=logs | where response_status = 500',
        },
        request.requestId
      )
    );

    expect(result).toEqual(
      expect.objectContaining({ success: true, applied: true, requestId: 'req-1' })
    );
    expect(mockSetEditorTextWithQuery).toHaveBeenCalledWith(
      'source=logs | where response_status = 500',
      { preserveUndo: true }
    );
  });

  it('rejects when the editor text changed after the request opened', async () => {
    setSession('source=logs | head 10');
    const action = renderAndGetAction();

    const result = await action.handler(
      withApprovalBinding(
        {
          requestId: 'req-1',
          sourceQueryHash: 'hash-1',
          fixedQuery: 'source=logs',
        },
        request.requestId
      )
    );

    expect(result.reason).toBe('stale-query');
    expect(mockValidatePPLLintFixCandidate).not.toHaveBeenCalled();
    expect(mockSetEditorTextWithQuery).not.toHaveBeenCalled();
  });

  it('rejects invalid candidates without changing the editor', async () => {
    setSession();
    mockValidatePPLLintFixCandidate.mockReturnValue({
      accepted: false,
      reason: 'syntax-error',
    });
    const action = renderAndGetAction();

    const result = await action.handler(
      withApprovalBinding(
        {
          requestId: 'req-1',
          sourceQueryHash: 'hash-1',
          fixedQuery: 'source=logs | where',
        },
        request.requestId
      )
    );

    // The shared evaluator reports a stable `reason` and carries the validator's
    // own string in `validationReason`, so the model still sees the specific cause.
    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        applied: false,
        reason: 'invalid-candidate',
        validationReason: 'syntax-error',
      })
    );
    expect(mockVerifyPerformanceFixOutcome).not.toHaveBeenCalled();
    expect(mockSetEditorTextWithQuery).not.toHaveBeenCalled();
  });

  it('revalidates a 3.5 performance fix before applying only the attributed edit', async () => {
    const originalQuery =
      'source=logs* | where droppedAttributesCount + 10 > 20 | ' + 'where severityNumber - 10 > 20';
    const fixedQuery =
      'source=logs* | where droppedAttributesCount > 10 | ' + 'where severityNumber - 10 > 20';
    const targetText = 'droppedAttributesCount + 10 > 20';
    const startOffset = originalQuery.indexOf(targetText);
    const lintContext = {
      useRuntimeGrammar: false,
      dataSourceVersion: '3.5.0',
      dataSourceId: 'fidelity-test-cluster-os35',
      http: { post: jest.fn() },
    } as any;
    const performanceRequest = {
      ...request,
      query: originalQuery,
      lintContext,
      diagnostic: {
        message: 'This filter runs as a script.',
        ruleId: 'operation-pushed-as-script',
        operation: 'filter',
        outcome: 'filter:script',
        targetText,
        targetRange: {
          startOffset,
          endOffset: startOffset + targetText.length,
        },
      },
    } as any;
    const session = {
      host: PPL_LINT_FIX_EXPLORE_HOST,
      request: performanceRequest,
      getCurrentQuery: () => originalQuery,
      getLintContext: () => lintContext,
    };
    let currentDuringValidation = false;
    mockVerifyPerformanceFixOutcome.mockImplementationOnce(
      async (_original, _fixed, _diagnostic, _context, isCurrent) => {
        currentDuringValidation = isCurrent();
        return true;
      }
    );
    setActivePPLLintFixSession(session);
    const action = renderAndGetAction();

    const result = await action.handler(
      withApprovalBinding({ fixedQuery }, performanceRequest.requestId)
    );

    expect(mockVerifyPerformanceFixOutcome).toHaveBeenCalledWith(
      originalQuery,
      fixedQuery,
      performanceRequest.diagnostic,
      lintContext,
      expect.any(Function)
    );
    expect(currentDuringValidation).toBe(true);
    expect(mockSetEditorTextWithQuery).toHaveBeenCalledWith(fixedQuery, {
      preserveUndo: true,
    });
    expect(result).toEqual(expect.objectContaining({ success: true, applied: true }));
  });

  it('rejects a performance fix that does not clear the attributed outcome', async () => {
    setSession();
    mockVerifyPerformanceFixOutcome.mockResolvedValue(false);
    const action = renderAndGetAction();

    const result = await action.handler(
      withApprovalBinding(
        {
          fixedQuery: 'source=logs | where response_status = 500',
        },
        request.requestId
      )
    );

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        applied: false,
        reason: 'performance-not-cleared',
      })
    );
    expect(mockSetEditorTextWithQuery).not.toHaveBeenCalled();
  });

  it('rejects when the editor changes during performance revalidation', async () => {
    let currentQuery = request.query;
    let finishValidation!: (value: boolean) => void;
    mockVerifyPerformanceFixOutcome.mockReturnValueOnce(
      new Promise((resolve) => {
        finishValidation = resolve;
      })
    );
    setActivePPLLintFixSession({
      host: PPL_LINT_FIX_EXPLORE_HOST,
      request,
      getCurrentQuery: () => currentQuery,
      getLintContext: () => request.lintContext as any,
    });
    const action = renderAndGetAction();

    const resultPromise = action.handler(
      withApprovalBinding(
        {
          fixedQuery: 'source=logs | where response_status = 500',
        },
        request.requestId
      )
    );
    currentQuery = 'source=logs | head 10';
    finishValidation(true);

    await expect(resultPromise).resolves.toEqual(
      expect.objectContaining({
        success: false,
        applied: false,
        reason: 'stale-query',
      })
    );
    expect(mockSetEditorTextWithQuery).not.toHaveBeenCalled();
  });

  it('registers a disabled placeholder and clears the session on unmount', () => {
    setSession();
    const { unmount } = renderHook(() => usePPLLintFixAction(mockSetEditorTextWithQuery));

    unmount();

    expect(mockRegisterAssistantAction).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'apply_ppl_lint_fix_explore',
        available: 'disabled',
      })
    );
    expect(getActivePPLLintFixSession()).toBeUndefined();
  });
});

describe('APPLY_PPL_LINT_FIX_EXPLORE_TOOL_DEFINITION', () => {
  it('uses the Explore-specific action name', () => {
    expect(APPLY_PPL_LINT_FIX_EXPLORE_TOOL_DEFINITION.name).toBe('apply_ppl_lint_fix_explore');
  });

  it('pairs the apply action with the derived silent test name', () => {
    expect(TEST_PPL_LINT_FIX_EXPLORE_TOOL_DEFINITION.name).toBe('test_ppl_lint_fix_explore');
    expect(TEST_PPL_LINT_FIX_EXPLORE_TOOL_DEFINITION.requiresConfirmation).toBe(false);
  });
});

describe('registerDisabledPPLLintFixAction', () => {
  it('registers a disabled action whose handler tells the AI to stop tool calls', async () => {
    const registerAction = jest.fn();

    registerDisabledPPLLintFixAction(registerAction);

    const disabledAction = registerAction.mock.calls[0][0];
    const result = await disabledAction.handler({});

    expect(disabledAction.name).toBe('apply_ppl_lint_fix_explore');
    expect(disabledAction.available).toBe('disabled');
    expect(result.success).toBe(false);
    expect(result.stop_tool_execution).toBe(true);
    expect(result.context_lost).toBe(true);
    expect(result.message).toContain('Do not attempt to use any more tools');
  });
});

describe('renderPPLLintFixAction', () => {
  it('renders the proposed query and wires apply/dismiss callbacks', () => {
    const onApprove = jest.fn();
    const onReject = jest.fn();

    // The card only offers the actions while a session is live — otherwise
    // approving would fail with missing-request.
    setActivePPLLintFixSession({
      host: PPL_LINT_FIX_EXPLORE_HOST,
      request,
      getCurrentQuery: () => request.query,
      getLintContext: () => request.lintContext as any,
    });

    render(
      <>
        {renderPPLLintFixAction({
          status: 'pending',
          args: {
            requestId: 'req-1',
            sourceQueryHash: 'hash-1',
            fixedQuery: 'source=logs | where response_status = 500',
            explanation: 'Use the mapped status field.',
          },
          onApprove,
          onReject,
        })}
      </>
    );

    expect(screen.getByText('Apply suggested fix')).toBeInTheDocument();
    expect(screen.getByText('Use the mapped status field.')).toBeInTheDocument();
    expect(screen.getByText('source=logs | where response_status = 500')).toBeInTheDocument();

    // Clicking either action retires both: the card is single-shot, so a fast
    // second click cannot fire a second confirmation.
    fireEvent.click(screen.getByTestId('pplLintFixExploreApplyButton'));

    expect(onApprove).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('pplLintFixExploreApplyButton')).not.toBeInTheDocument();
    expect(screen.queryByTestId('pplLintFixExploreDismissButton')).not.toBeInTheDocument();
    expect(onReject).not.toHaveBeenCalled();
  });

  it('marks a dismissal and retires the actions on Dismiss', () => {
    const onApprove = jest.fn();
    const onReject = jest.fn();

    setActivePPLLintFixSession({
      host: PPL_LINT_FIX_EXPLORE_HOST,
      request,
      getCurrentQuery: () => request.query,
      getLintContext: () => request.lintContext as any,
    });

    render(
      <>
        {renderPPLLintFixAction({
          status: 'pending',
          args: {
            requestId: 'req-1',
            sourceQueryHash: 'hash-1',
            fixedQuery: 'source=logs | where response_status = 500',
          },
          onApprove,
          onReject,
        })}
      </>
    );

    fireEvent.click(screen.getByTestId('pplLintFixExploreDismissButton'));

    expect(onReject).toHaveBeenCalledTimes(1);
    expect(onApprove).not.toHaveBeenCalled();
    expect(getPPLLintFixOutcome(request.requestId)).toEqual({ kind: 'dismissed' });
  });

  it('uses the short product message for a performance fix card', () => {
    setActivePPLLintFixSession({
      host: PPL_LINT_FIX_EXPLORE_HOST,
      request: {
        ...request,
        diagnostic: {
          message:
            'This filter may be slow because it does extra calculations. Compare the field directly instead.',
          ruleId: 'operation-pushed-as-script',
        },
      },
      getCurrentQuery: () => request.query,
      getLintContext: () => request.lintContext,
    });

    const props = {
      status: 'pending' as const,
      args: {
        requestId: 'wrong-id',
        fixedQuery: 'source=logs | where bytes > 6000',
        explanation: 'Detailed engine-specific explanation that should not be shown.',
      },
    };
    const rendered = render(<>{renderPPLLintFixAction(props)}</>);

    expect(
      screen.getByText(
        'This filter may be slow because it does extra calculations. Compare the field directly instead.'
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Detailed engine-specific explanation that should not be shown.')
    ).not.toBeInTheDocument();

    clearActivePPLLintFixSession();
    rendered.rerender(<>{renderPPLLintFixAction({ ...props, status: 'complete' as const })}</>);

    expect(
      screen.getByText(
        'This filter may be slow because it does extra calculations. Compare the field directly instead.'
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Detailed engine-specific explanation that should not be shown.')
    ).not.toBeInTheDocument();
  });
});
