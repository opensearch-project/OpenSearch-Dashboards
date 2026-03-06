/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { clearPPLValidationContext, setPPLValidationContext } from '@osd/monaco';
import { attachPPLValidationContext, syncPPLValidationContext } from './validation_context';

jest.mock('@osd/monaco', () => ({
  setPPLValidationContext: jest.fn(),
  clearPPLValidationContext: jest.fn(),
}));

describe('query editor validation context', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('syncs runtime validation context to the current model', () => {
    const model = {} as any;
    const editor = {
      getModel: jest.fn().mockReturnValue(model),
    } as any;

    syncPPLValidationContext(editor, {
      useRuntimeGrammar: true,
      dataSourceId: 'ds-1',
      dataSourceVersion: '3.6.0',
    });

    expect(setPPLValidationContext).toHaveBeenCalledWith(model, {
      useRuntimeGrammar: true,
      dataSourceId: 'ds-1',
      dataSourceVersion: '3.6.0',
    });
  });

  it('reattaches runtime validation context when the editor model changes', () => {
    const firstModel = {} as any;
    const secondModel = {} as any;
    let currentModel = firstModel;
    let onDidChangeModelHandler: (() => void) | undefined;
    const dispose = jest.fn();
    const editor = {
      getModel: jest.fn(() => currentModel),
      onDidChangeModel: jest.fn((handler: () => void) => {
        onDidChangeModelHandler = handler;
        return { dispose };
      }),
    } as any;

    const detach = attachPPLValidationContext(editor, {
      useRuntimeGrammar: true,
      dataSourceId: 'ds-1',
      dataSourceVersion: '3.6.0',
    });

    currentModel = secondModel;
    onDidChangeModelHandler?.();

    expect(setPPLValidationContext).toHaveBeenNthCalledWith(1, firstModel, {
      useRuntimeGrammar: true,
      dataSourceId: 'ds-1',
      dataSourceVersion: '3.6.0',
    });
    expect(clearPPLValidationContext).toHaveBeenCalledWith(firstModel);
    expect(setPPLValidationContext).toHaveBeenNthCalledWith(2, secondModel, {
      useRuntimeGrammar: true,
      dataSourceId: 'ds-1',
      dataSourceVersion: '3.6.0',
    });

    detach();

    expect(clearPPLValidationContext).toHaveBeenCalledWith(secondModel);
    expect(dispose).toHaveBeenCalled();
  });
});
