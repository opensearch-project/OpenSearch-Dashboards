/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { USE_CASE_PREFIX } from './constants';

// Reference https://github.com/opensearch-project/oui/blob/main/src/services/color/is_valid_hex.ts
export const validateWorkspaceColor = (color?: string) =>
  !!color && /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(color);

export const getUseCaseFeatureConfig = (useCaseId: string) => `${USE_CASE_PREFIX}${useCaseId}`;
