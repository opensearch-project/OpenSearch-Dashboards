/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { clearPPLValidationContext, setPPLValidationContext } from '@osd/monaco';
import {
  attachPPLGrammarRefresh,
  attachPPLValidationContext,
  syncPPLValidationContext,
} from './validation_context';

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

  it('revalidates the current model when the matching datasource grammar becomes available', () => {
    const model = {} as any;
    const editor = {
      getModel: jest.fn().mockReturnValue(model),
    } as any;
    const revalidate = jest.fn();
    let listener: ((event: { dataSourceId?: string; grammarHash: string }) => void) | undefined;
    const unsubscribe = jest.fn();
    const subscribeToGrammarUpdates = jest.fn((cb) => {
      listener = cb;
      return unsubscribe;
    });

    const detach = attachPPLGrammarRefresh(
      editor,
      () => ({
        useRuntimeGrammar: true,
        dataSourceId: 'ds-1',
        dataSourceVersion: '3.6.0',
      }),
      subscribeToGrammarUpdates,
      revalidate
    );

    listener?.({ dataSourceId: 'ds-2', grammarHash: 'sha256:other' });
    expect(revalidate).not.toHaveBeenCalled();

    listener?.({ dataSourceId: 'ds-1', grammarHash: 'sha256:match' });
    expect(revalidate).toHaveBeenCalledWith(model);

    detach();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
