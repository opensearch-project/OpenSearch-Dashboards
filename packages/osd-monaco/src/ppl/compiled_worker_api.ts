/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CompiledPPLLintAnalysis } from './lint/explain/attribution/snapshot';
import { LintRunContext, SerializableLintContext } from './lint/types';
import { PPLWorkerProxyService } from './worker_proxy_service';

// The AI lint-fix revalidation path (in the data plugin) re-analyzes the
// original and candidate queries on the compiled grammar surface. It runs
// outside the Monaco lint lifecycle, so it gets its own worker proxy rather
// than reaching into language.ts's instance; the worker is created lazily on
// first use and shared across calls.
const service = new PPLWorkerProxyService();

/**
 * Flatten a run context to the structured-clone-safe shape the worker accepts.
 * Mirrors the conversion language.ts performs inline for its own lint pass:
 * Sets/Maps become arrays/objects and the non-cloneable http client is dropped.
 */
function toSerializableLintContext(context?: LintRunContext): SerializableLintContext | undefined {
  if (!context) {
    return undefined;
  }
  return {
    isCalcite: context.isCalcite,
    fields: context.fields ? Array.from(context.fields) : undefined,
    typeMap: context.typeMap ? Object.fromEntries(context.typeMap) : undefined,
    disabledObjectFields: context.disabledObjectFields
      ? Array.from(context.disabledObjectFields)
      : undefined,
    visibleIndices: context.visibleIndices,
    settings: context.settings,
    overrides: context.overrides,
    dataSourceId: context.dataSourceId,
    dataSourceVersion: context.dataSourceVersion,
    selectedSourcePattern: context.selectedSourcePattern,
    engineType: context.engineType,
  };
}

/** Parse + lint on the compiled surface in the worker, returning the attribution snapshot. */
export async function analyzeCompiledPPLLint(
  content: string,
  context?: LintRunContext
): Promise<CompiledPPLLintAnalysis> {
  service.setup();
  return service.analyzeLint(content, toSerializableLintContext(context));
}

/** Batch syntax-validate probe queries on the compiled surface in the worker. */
export async function validateCompiledPPLLintQueries(queries: string[]): Promise<boolean[]> {
  service.setup();
  return service.validateLintQueries(queries);
}
