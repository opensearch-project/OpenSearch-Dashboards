/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const mockSetPPLLintEnabled = jest.fn();
const mockUnregister = jest.fn();
const mockRegisterPPLLintBridge = jest.fn(() => mockUnregister);
const mockLintRuntimePPLQuery = jest.fn();

jest.mock('@osd/monaco', () => ({
  setPPLLintEnabled: (enabled: boolean) => mockSetPPLLintEnabled(enabled),
  registerPPLLintBridge: (bridge: unknown) => mockRegisterPPLLintBridge(bridge),
}));

jest.mock('../../../data/public', () => ({
  lintRuntimePPLQuery: (...args: unknown[]) => mockLintRuntimePPLQuery(...args),
}));

import { registerPplLint } from './register_ppl_lint';

describe('registerPplLint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('disables the engine and registers no bridge when the capability is off', () => {
    const disposer = registerPplLint(false, true);

    expect(mockSetPPLLintEnabled).toHaveBeenCalledWith(false);
    expect(mockRegisterPPLLintBridge).not.toHaveBeenCalled();
    expect(disposer).toBeUndefined();
  });

  it('enables the engine and registers the runtime bridge when both flags are on', () => {
    const disposer = registerPplLint(true, true);

    expect(mockSetPPLLintEnabled).toHaveBeenCalledWith(true);
    expect(mockRegisterPPLLintBridge).toHaveBeenCalledTimes(1);
    expect(mockRegisterPPLLintBridge).toHaveBeenCalledWith(expect.any(Function));
    expect(disposer).toBe(mockUnregister);
  });

  it('enables the engine but skips the bridge when the runtime grammar is off', () => {
    const disposer = registerPplLint(true, false);

    expect(mockSetPPLLintEnabled).toHaveBeenCalledWith(true);
    expect(mockRegisterPPLLintBridge).not.toHaveBeenCalled();
    expect(disposer).toBeUndefined();
  });

  it('returns a disposer that unregisters the bridge', () => {
    const disposer = registerPplLint(true, true);
    disposer?.();
    expect(mockUnregister).toHaveBeenCalledTimes(1);
  });
});
