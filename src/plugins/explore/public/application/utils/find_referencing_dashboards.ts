/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { NotificationsStart, SavedObjectsClientContract } from '../../../../../core/public';
import { SimpleSavedObject } from '../../../../../core/public';

export interface ReferencingDashboard {
  id: string;
  title: string;
  description?: string;
}

/**
 * Find all dashboards that reference a given in-context editor visualization
 * @param savedObjectsClient - The saved objects client
 * @param visualizationId - The ID of the visualization (explore type) to find references to
 * @returns Array of dashboards that reference the visualization
 */
export async function findReferencingDashboards(
  savedObjectsClient: SavedObjectsClientContract,
  visualizationId: string,
  notifications: NotificationsStart
): Promise<ReferencingDashboard[]> {
  try {
    const response = await savedObjectsClient.find<{ title: string; description?: string }>({
      type: 'dashboard',
      hasReference: {
        type: 'explore',
        id: visualizationId,
      },
      perPage: 1000,
      fields: ['title', 'description'],
    });

    return response.savedObjects.map((dashboard: SimpleSavedObject<any>) => ({
      id: dashboard.id,
      title: dashboard.attributes?.title || dashboard.id,
      description: dashboard.attributes?.description,
    }));
  } catch (error) {
    notifications.toasts.addError(error, {
      title: i18n.translate('explore.inContextEditor.findReferencingDashboards.errorToastTitle', {
        defaultMessage: 'Error find referencing dashboards',
      }),
    });
    return [];
  }
}
