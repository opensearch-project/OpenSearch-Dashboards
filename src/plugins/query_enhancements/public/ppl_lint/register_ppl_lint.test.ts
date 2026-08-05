/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const mockSetPPLLintEnabled = jest.fn();
const mockUnregisterBridge = jest.fn();
const mockRegisterPPLLintBridge = jest.fn(() => mockUnregisterBridge);
const mockUnregisterTelemetry = jest.fn();
const mockRegisterPPLLintTelemetry = jest.fn(() => mockUnregisterTelemetry);
const mockLintRuntimePPLQuery = jest.fn();
const mockUnregisterPreparer = jest.fn();
const mockRegisterPreparer = jest.fn(() => mockUnregisterPreparer);
const mockCreatePreparer = jest.fn(() => jest.fn());

jest.mock('@osd/monaco', () => ({
  setPPLLintEnabled: (enabled: boolean) => mockSetPPLLintEnabled(enabled),
  registerPPLLintBridge: (bridge: unknown) => mockRegisterPPLLintBridge(bridge),
  registerPPLLintTelemetry: (sink: unknown) => mockRegisterPPLLintTelemetry(sink),
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

const servicesWithSink = (sink: (event: unknown) => void) => ({
  ...services,
  telemetrySink: sink,
});

describe('registerPplLint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('disables the engine and registers no bridge or telemetry when the capability is off', () => {
    const sink = jest.fn();
    const disposer = registerPplLint(false, true, servicesWithSink(sink));

    expect(mockSetPPLLintEnabled).toHaveBeenCalledWith(false);
    expect(mockRegisterPPLLintBridge).not.toHaveBeenCalled();
    expect(mockRegisterPreparer).not.toHaveBeenCalled();
    expect(mockRegisterPPLLintTelemetry).not.toHaveBeenCalled();
    // Always a disposer: the engine flag lives on globalThis and outlives the
    // plugin, so teardown must be able to reset it even when nothing was set.
    expect(disposer).toEqual(expect.any(Function));
  });

  it('enables the engine and registers the runtime bridge + preparer + telemetry when everything is on', () => {
    const sink = jest.fn();
    const disposer = registerPplLint(true, true, servicesWithSink(sink));

    expect(mockSetPPLLintEnabled).toHaveBeenCalledWith(true);
    expect(mockRegisterPPLLintBridge).toHaveBeenCalledTimes(1);
    expect(mockRegisterPPLLintBridge).toHaveBeenCalledWith(expect.any(Function));
    expect(mockCreatePreparer).toHaveBeenCalledWith(
      expect.objectContaining({ getAppId: expect.any(Function) })
    );
    expect(mockRegisterPreparer).toHaveBeenCalledTimes(1);
    expect(mockRegisterPPLLintTelemetry).toHaveBeenCalledWith(sink);
    expect(disposer).toEqual(expect.any(Function));
  });

  it('wires telemetry even when the runtime grammar is off (worker fallback still emits)', () => {
    // With no runtime grammar the bridge is not registered — the editor's worker
    // lints against the compiled grammar — but that path still produces markers,
    // hovers, and quick-fixes, so telemetry must still be wired.
    const sink = jest.fn();
    const disposer = registerPplLint(true, false, servicesWithSink(sink));

    expect(mockSetPPLLintEnabled).toHaveBeenCalledWith(true);
    expect(mockRegisterPPLLintBridge).not.toHaveBeenCalled();
    expect(mockRegisterPreparer).not.toHaveBeenCalled();
    expect(mockRegisterPPLLintTelemetry).toHaveBeenCalledWith(sink);
    expect(disposer).toEqual(expect.any(Function));
  });

  it('registers no telemetry when enabled but no sink is provided', () => {
    const disposer = registerPplLint(true, true, services);

    expect(mockRegisterPPLLintTelemetry).not.toHaveBeenCalled();
    // Still registers the bridge and returns a disposer.
    expect(mockRegisterPPLLintBridge).toHaveBeenCalledTimes(1);
    expect(disposer).toEqual(expect.any(Function));
  });

  it('returns a disposer that unregisters the bridge, preparer, and telemetry and disables the engine', () => {
    const sink = jest.fn();
    const disposer = registerPplLint(true, true, servicesWithSink(sink));
    disposer();

    expect(mockUnregisterBridge).toHaveBeenCalledTimes(1);
    expect(mockUnregisterPreparer).toHaveBeenCalledTimes(1);
    expect(mockUnregisterTelemetry).toHaveBeenCalledTimes(1);
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
