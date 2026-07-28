/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const mockSetPPLLintEnabled = jest.fn();
const mockUnregister = jest.fn();
const mockRegisterPPLLintBridge = jest.fn(() => mockUnregister);
const mockLintRuntimePPLQuery = jest.fn();
const mockUnregisterPreparer = jest.fn();
const mockRegisterPreparer = jest.fn(() => mockUnregisterPreparer);
const mockCreatePreparer = jest.fn(() => jest.fn());

jest.mock('@osd/monaco', () => ({
  setPPLLintEnabled: (enabled: boolean) => mockSetPPLLintEnabled(enabled),
  registerPPLLintBridge: (bridge: unknown) => mockRegisterPPLLintBridge(bridge),
}));

jest.mock('../../../data/public', () => ({
  lintRuntimePPLQuery: (...args: unknown[]) => mockLintRuntimePPLQuery(...args),
  explainQueryPreparer: { register: (fn: unknown) => mockRegisterPreparer(fn) },
}));

jest.mock('./explain_query_preparer', () => ({
  createExplainQueryPreparer: (...args: unknown[]) => mockCreatePreparer(...args),
}));

import { registerPplLint } from './register_ppl_lint';

const services = {
  data: {} as any,
  uiSettings: {} as any,
  getAppId: () => 'dashboards',
};

describe('registerPplLint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('disables the engine and registers no bridge when the capability is off', () => {
    const disposer = registerPplLint(false, true, services);

    expect(mockSetPPLLintEnabled).toHaveBeenCalledWith(false);
    expect(mockRegisterPPLLintBridge).not.toHaveBeenCalled();
    expect(mockRegisterPreparer).not.toHaveBeenCalled();
    // Always a disposer: the engine flag lives on globalThis and outlives the
    // plugin, so teardown must be able to reset it even when no bridge was set.
    expect(disposer).toEqual(expect.any(Function));
  });

  it('enables the engine and registers the runtime bridge + preparer when both flags are on', () => {
    const disposer = registerPplLint(true, true, services);

    expect(mockSetPPLLintEnabled).toHaveBeenCalledWith(true);
    expect(mockRegisterPPLLintBridge).toHaveBeenCalledTimes(1);
    expect(mockRegisterPPLLintBridge).toHaveBeenCalledWith(expect.any(Function));
    expect(mockCreatePreparer).toHaveBeenCalledWith(services);
    expect(mockRegisterPreparer).toHaveBeenCalledTimes(1);
    expect(disposer).toEqual(expect.any(Function));
  });

  it('enables the engine but skips the bridge and preparer when the runtime grammar is off', () => {
    const disposer = registerPplLint(true, false, services);

    expect(mockSetPPLLintEnabled).toHaveBeenCalledWith(true);
    expect(mockRegisterPPLLintBridge).not.toHaveBeenCalled();
    expect(mockRegisterPreparer).not.toHaveBeenCalled();
    expect(disposer).toEqual(expect.any(Function));
  });

  it('returns a disposer that unregisters the bridge and preparer and disables the engine', () => {
    const disposer = registerPplLint(true, true, services);
    disposer();

    expect(mockUnregister).toHaveBeenCalledTimes(1);
    expect(mockUnregisterPreparer).toHaveBeenCalledTimes(1);
    expect(mockSetPPLLintEnabled).toHaveBeenLastCalledWith(false);
  });

  it('still disables the engine on teardown when no bridge was registered', () => {
    // The engine flag lives on globalThis and outlives the plugin, so teardown
    // must reset it even in the runtime-grammar-disabled case.
    const disposer = registerPplLint(true, false, services);
    expect(mockSetPPLLintEnabled).toHaveBeenLastCalledWith(true);

    disposer();
    expect(mockSetPPLLintEnabled).toHaveBeenLastCalledWith(false);
  });
});
