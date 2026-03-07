/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  clearPPLValidationContext,
  monaco,
  PPLValidationContext,
  setPPLValidationContext,
} from '@osd/monaco';

function applyValidationContext(
  model: monaco.editor.ITextModel | null | undefined,
  context: PPLValidationContext
): void {
  if (!model) {
    return;
  }
  setPPLValidationContext(model, context);
}

export function syncPPLValidationContext(
  editor: monaco.editor.IStandaloneCodeEditor | null | undefined,
  context: PPLValidationContext
): void {
  applyValidationContext(editor?.getModel(), context);
}

export function attachPPLValidationContext(
  editor: monaco.editor.IStandaloneCodeEditor,
  context: PPLValidationContext
): () => void {
  let currentModel = editor.getModel();
  applyValidationContext(currentModel, context);

  const modelChangeSubscription = editor.onDidChangeModel(() => {
    if (currentModel) {
      clearPPLValidationContext(currentModel);
    }

    currentModel = editor.getModel();
    applyValidationContext(currentModel, context);
  });

  return () => {
    if (currentModel) {
      clearPPLValidationContext(currentModel);
    }
    modelChangeSubscription.dispose();
  };
}

export function attachPPLGrammarRefresh(
  editor: monaco.editor.IStandaloneCodeEditor,
  getContext: () => PPLValidationContext,
  subscribeToGrammarUpdates: (
    listener: (event: { dataSourceId?: string; grammarHash: string }) => void
  ) => () => void,
  revalidateModel: (model: monaco.editor.ITextModel) => Promise<void> | void
): () => void {
  return subscribeToGrammarUpdates((event) => {
    const model = editor.getModel();
    const context = getContext();

    if (!model || !context.useRuntimeGrammar) {
      return;
    }

    if ((context.dataSourceId ?? undefined) !== event.dataSourceId) {
      return;
    }

    // Sync the latest context to the model before revalidating.
    // The context may have changed since it was first attached (e.g. useRuntimeGrammar
    // was false at mount time because the grammar wasn't cached yet).
    setPPLValidationContext(model, context);
    void revalidateModel(model);
  });
}
