/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  clearPPLLintContext,
  monaco,
  PPLLintContext,
  PPLValidationContext,
  setPPLLintContext,
} from '@osd/monaco';
import { MutableRefObject } from 'react';
import { attachPPLGrammarRefresh, attachPPLValidationContext } from './validation_context';

function applyLintContext(
  model: monaco.editor.ITextModel | null | undefined,
  context: PPLLintContext
): void {
  if (!model) {
    return;
  }
  setPPLLintContext(model, context);
}

export function syncPPLLintContext(
  editor: monaco.editor.IStandaloneCodeEditor | null | undefined,
  context: PPLLintContext
): void {
  applyLintContext(editor?.getModel(), context);
}

export function attachPPLLintContext(
  editor: monaco.editor.IStandaloneCodeEditor,
  getContext: () => PPLLintContext
): () => void {
  let currentModel = editor.getModel();
  applyLintContext(currentModel, getContext());

  const modelChangeSubscription = editor.onDidChangeModel(() => {
    if (currentModel) {
      clearPPLLintContext(currentModel);
    }

    currentModel = editor.getModel();
    applyLintContext(currentModel, getContext());
  });

  return () => {
    if (currentModel) {
      clearPPLLintContext(currentModel);
    }
    modelChangeSubscription.dispose();
  };
}

export function attachPPLLintGrammarRefresh(
  editor: monaco.editor.IStandaloneCodeEditor,
  getContext: () => PPLLintContext,
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

    setPPLLintContext(model, context);
    void revalidateModel(model);
  });
}

type DetachRef = MutableRefObject<(() => void) | undefined>;

/** Bundled detach callbacks for the PPL validation + lint lifecycle. */
export interface PPLDetachRefs {
  validationContext: DetachRef;
  grammarRefresh: DetachRef;
  lintContext: DetachRef;
  lintGrammarRefresh: DetachRef;
}

/** Attach (or re-attach) all PPL validation + lint contexts; detaches previous ones first. */
export function attachPPLContexts(
  editor: monaco.editor.IStandaloneCodeEditor,
  refs: PPLDetachRefs,
  getValidationContext: () => PPLValidationContext,
  getLintContext: () => PPLLintContext,
  subscribeToGrammarUpdates: (
    listener: (event: { dataSourceId?: string; grammarHash: string }) => void
  ) => () => void,
  revalidateModel: (model: monaco.editor.ITextModel) => Promise<void> | void
): void {
  refs.validationContext.current?.();
  refs.grammarRefresh.current?.();
  refs.validationContext.current = attachPPLValidationContext(editor, getValidationContext);
  refs.grammarRefresh.current = attachPPLGrammarRefresh(
    editor,
    getValidationContext,
    subscribeToGrammarUpdates,
    revalidateModel
  );

  refs.lintContext.current?.();
  refs.lintGrammarRefresh.current?.();
  refs.lintContext.current = attachPPLLintContext(editor, getLintContext);
  refs.lintGrammarRefresh.current = attachPPLLintGrammarRefresh(
    editor,
    getLintContext,
    subscribeToGrammarUpdates,
    revalidateModel
  );
}

/** Detach all PPL validation + lint contexts and clear the refs. */
export function cleanupPPLContexts(refs: PPLDetachRefs): void {
  refs.validationContext.current?.();
  refs.validationContext.current = undefined;
  refs.grammarRefresh.current?.();
  refs.grammarRefresh.current = undefined;
  refs.lintContext.current?.();
  refs.lintContext.current = undefined;
  refs.lintGrammarRefresh.current?.();
  refs.lintGrammarRefresh.current = undefined;
}
