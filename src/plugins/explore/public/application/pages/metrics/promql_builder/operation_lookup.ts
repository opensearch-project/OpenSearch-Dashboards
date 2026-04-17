/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { OperationDef, OPERATION_CATEGORIES } from './operation_categories';

const CATEGORY_PILL_LABELS: Record<string, () => string> = {};
OPERATION_CATEGORIES.forEach((cat) => {
  cat.items.forEach((item) => {
    CATEGORY_PILL_LABELS[item.id] = cat.pillLabel;
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
