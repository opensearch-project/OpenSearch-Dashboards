/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { SavedObjectsClientContract } from 'src/core/public';

/**
 * Builds a unique "<base> (copy)" / "<base> (copy N)" title for a duplicated
 * panel saved object. Shared by single-panel "Clone panel" (ClonePanelAction)
 * and whole-dashboard "Copy panels" so the naming stays consistent.
 */
export async function getUniquePanelCopyTitle(
  client: SavedObjectsClientContract,
  rawTitle: string,
  type: string
): Promise<string> {
  const clonedTag = i18n.translate('dashboard.panel.title.clonedTag', {
    defaultMessage: 'copy',
  });
  const cloneRegex = new RegExp(`\\(${clonedTag}\\)`, 'g');
  const cloneNumberRegex = new RegExp(`\\(${clonedTag} [0-9]+\\)`, 'g');
  const baseTitle = rawTitle.replace(cloneNumberRegex, '').replace(cloneRegex, '').trim();

  const similarSavedObjects = await client.find<{ title: string }>({
    type,
    perPage: 0,
    fields: ['title'],
    searchFields: ['title'],
    search: `"${baseTitle}"`,
  });
  // Subtract the source object itself from the count of existing base titles.
  const similarBaseTitlesCount = similarSavedObjects.total - 1;

  return similarBaseTitlesCount <= 0
    ? `${baseTitle} (${clonedTag})`
    : `${baseTitle} (${clonedTag} ${similarBaseTitlesCount})`;
}
