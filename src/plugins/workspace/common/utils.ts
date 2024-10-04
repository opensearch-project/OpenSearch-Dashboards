/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { USE_CASE_PREFIX, WORKSPACE_DATA_SOURCE_AND_CONNECTION_OBJECT_TYPES } from './constants';

// Reference https://github.com/opensearch-project/oui/blob/main/src/services/color/is_valid_hex.ts
export const validateWorkspaceColor = (color?: string) =>
  !!color && /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(color);

export const getUseCaseFeatureConfig = (useCaseId: string) => `${USE_CASE_PREFIX}${useCaseId}`;

export const validateIsWorkspaceDataSourceAndConnectionObjectType = (type: string) =>
  WORKSPACE_DATA_SOURCE_AND_CONNECTION_OBJECT_TYPES.includes(type);
