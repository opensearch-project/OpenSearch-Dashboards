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
