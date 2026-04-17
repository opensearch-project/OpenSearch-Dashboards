/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { OperationDef, OPERATION_CATEGORIES } from './operation_categories';

// Map each operation ID to its pill label based on which category it belongs to
const CATEGORY_PILL_LABELS: Record<string, () => string> = {};

const PILL_LABEL_FACTORIES: Record<number, () => string> = {
  0: () =>
    i18n.translate('explore.promqlBuilder.pillLabel.function', { defaultMessage: 'Function' }),
  1: () =>
    i18n.translate('explore.promqlBuilder.pillLabel.aggregation', {
      defaultMessage: 'Aggregation',
    }),
  2: () =>
    i18n.translate('explore.promqlBuilder.pillLabel.binaryOperation', {
      defaultMessage: 'Binary operation',
    }),
  3: () => i18n.translate('explore.promqlBuilder.pillLabel.literal', { defaultMessage: 'Literal' }),
};

OPERATION_CATEGORIES.forEach((cat, catIdx) => {
  cat.items.forEach((item) => {
    CATEGORY_PILL_LABELS[item.id] = PILL_LABEL_FACTORIES[catIdx] || PILL_LABEL_FACTORIES[0];
  });
});

export function getCategoryLabel(opId: string): string {
  const factory = CATEGORY_PILL_LABELS[opId];
  return factory
    ? factory()
    : i18n.translate('explore.promqlBuilder.pillLabel.operation', {
        defaultMessage: 'Operation',
      });
}

export const OP_DEF_MAP: Record<string, OperationDef> = {};
OPERATION_CATEGORIES.forEach((cat) => {
  cat.items.forEach((item) => {
    OP_DEF_MAP[item.id] = item;
  });
});

export function getOperationSiblings(opId: string): OperationDef[] {
  for (const cat of OPERATION_CATEGORIES) {
    if (cat.items.find((item) => item.id === opId)) return cat.items;
  }
  return [];
}
