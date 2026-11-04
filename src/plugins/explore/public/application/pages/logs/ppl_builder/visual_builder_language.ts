/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createContext, useContext } from 'react';
import type { SourceTypeVisualBuilder } from '../../../../services/source_type_registry';
import { getSourceTypeRegistry } from '../../../../services/source_type_registry';
import { buildPPL, compileAggregation, compileWhereFilter } from './build_ppl';
import { parsePPL } from './parse_ppl';
import { AGG_FUNCTIONS, AggDef, SCALAR_FN_CATEGORIES } from './operations';
import { OPERATOR_DEFS, OperatorDef } from './where_operators';

/** The builder's PPL translation: what the builder uses unless a source brings its own. */
export const pplVisualBuilder: SourceTypeVisualBuilder = {
  build: buildPPL,
  parse: parsePPL,
  aggregationColumn: compileAggregation,
  filterText: (filter, getFieldType) => {
    const predicate = compileWhereFilter(filter, getFieldType);
    return predicate ? `where ${predicate}` : null;
  },
  functions: SCALAR_FN_CATEGORIES,
};

/**
 * The visual builder translation for a language on a dataset, or undefined when the builder isn't
 * offered for it (the editor is code-only).
 */
export const resolveVisualBuilder = (
  languageId?: string,
  dataset?: { type?: string }
): SourceTypeVisualBuilder | undefined => {
  const registry = getSourceTypeRegistry();
  if (!registry.supportsVisualBuilder(languageId, dataset)) return undefined;
  return registry.getVisualBuilder(languageId, dataset) ?? pplVisualBuilder;
};

/** The translation the builder's controls read their options from. PPL outside a builder. */
export const VisualBuilderContext = createContext<SourceTypeVisualBuilder>(pplVisualBuilder);

export const useVisualBuilder = (): SourceTypeVisualBuilder => useContext(VisualBuilderContext);

/** The aggregations a translation offers, in Explore's menu order. */
export const aggregationsFor = (language: SourceTypeVisualBuilder): AggDef[] =>
  language.aggregations
    ? AGG_FUNCTIONS.filter((def) => language.aggregations?.includes(def.id))
    : AGG_FUNCTIONS;

/** The filter operators a translation offers, in Explore's menu order. */
export const filterOperatorsFor = (language: SourceTypeVisualBuilder): OperatorDef[] =>
  language.filterOperators
    ? OPERATOR_DEFS.filter((def) => language.filterOperators?.includes(def.value))
    : OPERATOR_DEFS;
