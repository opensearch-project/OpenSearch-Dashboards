/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IUiSettingsClient } from 'opensearch-dashboards/public';
import { PPLLintContext } from '@osd/monaco';
import { HttpSetup } from '../../../../core/public';
import {
  deriveIsCalcite,
  shouldUseRuntimeGrammar,
} from '../antlr/opensearch_ppl/ppl_grammar_cache';
import { buildOverridesFromSettings } from './lint_overrides';

/** Subset of dataset fields needed for lint context construction. */
interface LintContextDataset {
  id?: string;
  dataSource?: { id?: string; version?: string };
}

/** Build the {@link PPLLintContext} for the active dataset and per-rule overrides. */
export function buildPPLLintContext(
  dataset: LintContextDataset | undefined,
  services: { uiSettings: IUiSettingsClient; http: HttpSetup }
): PPLLintContext {
  const dsId = dataset?.dataSource?.id;
  const dsVersion = dataset?.dataSource?.version;
  return {
    useRuntimeGrammar: shouldUseRuntimeGrammar(dsId, dsVersion),
    dataSourceId: dsId,
    dataSourceVersion: dsVersion,
    isCalcite: deriveIsCalcite(dsVersion),
    overrides: buildOverridesFromSettings(services.uiSettings),
    http: services.http,
  };
}
