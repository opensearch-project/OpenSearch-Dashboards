/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PPLValidationResult } from './ppl_language_analyzer';
import {
  clearPPLValidationContext,
  registerPPLValidationProvider,
  resolvePPLValidationResult,
  setPPLValidationContext,
} from './validation_provider';

describe('PPL validation provider bridge', () => {
  let model: any;
  let unregisterProvider: (() => void) | undefined;
  const fallbackResult: PPLValidationResult = { isValid: true, errors: [] };

  beforeEach(() => {
    model = {};
    unregisterProvider = undefined;
  });

  afterEach(() => {
    unregisterProvider?.();
    clearPPLValidationContext(model);
  });

  it('should use the registered provider result when available', async () => {
    const fallbackValidate = jest.fn().mockResolvedValue(fallbackResult);
    const runtimeResult: PPLValidationResult = {
      isValid: false,
      errors: [{ message: 'runtime error', line: 1, column: 2 }],
    };

    setPPLValidationContext(model, {
      useRuntimeGrammar: true,
      dataSourceId: 'ds-1',
      dataSourceVersion: '3.6.0',
    });
    unregisterProvider = registerPPLValidationProvider(async ({ context, content }) => {
      expect(content).toBe('| where status = 200');
      expect(context?.dataSourceId).toBe('ds-1');
      return runtimeResult;
    });

    await expect(
      resolvePPLValidationResult(model, '| where status = 200', fallbackValidate)
    ).resolves.toEqual(runtimeResult);
    expect(fallbackValidate).not.toHaveBeenCalled();
  });

  it('should fall back when no provider is registered', async () => {
    const fallbackValidate = jest.fn().mockResolvedValue(fallbackResult);

    await expect(
      resolvePPLValidationResult(model, 'source=logs', fallbackValidate)
    ).resolves.toEqual(fallbackResult);
    expect(fallbackValidate).toHaveBeenCalledWith('source=logs');
  });

  it('should fall back when provider returns null', async () => {
    const fallbackValidate = jest.fn().mockResolvedValue(fallbackResult);

    unregisterProvider = registerPPLValidationProvider(async () => null);

    await expect(
      resolvePPLValidationResult(model, 'source=logs', fallbackValidate)
    ).resolves.toEqual(fallbackResult);
    expect(fallbackValidate).toHaveBeenCalledWith('source=logs');
  });

  it('should fall back when provider throws', async () => {
    const fallbackValidate = jest.fn().mockResolvedValue(fallbackResult);

    unregisterProvider = registerPPLValidationProvider(async () => {
      throw new Error('runtime failed');
    });

    await expect(
      resolvePPLValidationResult(model, 'source=logs', fallbackValidate)
    ).resolves.toEqual(fallbackResult);
    expect(fallbackValidate).toHaveBeenCalledWith('source=logs');
  });

  it('should clear model context', async () => {
    const fallbackValidate = jest.fn().mockResolvedValue(fallbackResult);
    const provider = jest.fn().mockResolvedValue(null);

    setPPLValidationContext(model, {
      useRuntimeGrammar: true,
      dataSourceId: 'ds-1',
    });
    clearPPLValidationContext(model);
    unregisterProvider = registerPPLValidationProvider(provider);

    await resolvePPLValidationResult(model, 'source=logs', fallbackValidate);

    expect(provider).toHaveBeenCalledWith({
      content: 'source=logs',
      model,
      context: undefined,
    });
  });

  it('should share provider state across isolated module instances', async () => {
    const fallbackValidate = jest.fn().mockResolvedValue(fallbackResult);
    const runtimeResult: PPLValidationResult = {
      isValid: false,
      errors: [{ message: 'runtime error', line: 1, column: 2 }],
    };
    const sharedModel = {};

    let unregisterFromFirstModule: (() => void) | undefined;
    let clearFromFirstModule: ((model: any) => void) | undefined;

    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const firstModule = require('./validation_provider');
      clearFromFirstModule = firstModule.clearPPLValidationContext;
      firstModule.setPPLValidationContext(sharedModel, {
        useRuntimeGrammar: true,
        dataSourceId: 'ds-1',
      });
      unregisterFromFirstModule = firstModule.registerPPLValidationProvider(
        async ({ context }: any) => {
          expect(context?.dataSourceId).toBe('ds-1');
          return runtimeResult;
        }
      );
    });

    try {
      let resolveFromSecondModule: any;
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const secondModule = require('./validation_provider');
        resolveFromSecondModule = secondModule.resolvePPLValidationResult;
      });

      await expect(
        resolveFromSecondModule(sharedModel, '| where status = 200', fallbackValidate)
      ).resolves.toEqual(runtimeResult);
      expect(fallbackValidate).not.toHaveBeenCalled();
    } finally {
      unregisterFromFirstModule?.();
      clearFromFirstModule?.(sharedModel);
    }
  });
});
