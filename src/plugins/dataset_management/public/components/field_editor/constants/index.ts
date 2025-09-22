/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { getOsdTypeNames } from '../../../../../data/public';

export const FIELD_TYPES_BY_LANG = {
  painless: ['number', 'string', 'date', 'boolean'],
  expression: ['number'],
};

export const DEFAULT_FIELD_TYPES = getOsdTypeNames();
