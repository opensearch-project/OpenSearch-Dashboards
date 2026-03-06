/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * This import registers the PPL monaco language contribution
 */
import './language';
import { ID } from './constants';
export {
  clearPPLValidationContext,
  registerPPLValidationProvider,
  resolvePPLValidationResult,
  setPPLValidationContext,
} from './validation_provider';
export type {
  PPLValidationContext,
  PPLValidationProvider,
  PPLValidationProviderRequest,
} from './validation_provider';
export type { PPLValidationResult } from './ppl_language_analyzer';

export const PPLLang = { ID };
