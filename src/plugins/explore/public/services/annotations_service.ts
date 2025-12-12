/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { DashboardAnnotation } from '../../../dashboard/public';
import { SavedObjectsClientContract } from '../../../../core/public';

interface DashboardAnnotationsSavedObject {
  annotations: DashboardAnnotation[];
}

export class ExploreAnnotationsService {
  private savedObjectsClient: SavedObjectsClientContract;

  constructor(savedObjectsClient: SavedObjectsClientContract) {
    this.savedObjectsClient = savedObjectsClient;
  }

  private getSavedObjectId(dashboardId: string): string {
    // Convert potentially long dashboard IDs to a shorter, consistent format
    const cleanDashboardId = dashboardId.replace(/[^a-zA-Z0-9\-_]/g, '-');
    return `dashboard_annotations_${cleanDashboardId}`;
  }

  async getAnnotations(dashboardId: string): Promise<DashboardAnnotation[]> {
    try {
      const savedObjectId = this.getSavedObjectId(dashboardId);

      const savedObject = await this.savedObjectsClient.get<DashboardAnnotationsSavedObject>(
        'dashboard_annotations',
        savedObjectId
      );

      const annotations = savedObject.attributes.annotations || [];
      return annotations;
    } catch (error) {
      // If the saved object doesn't exist, return empty array
      if (error.status === 404) {
        return [];
      }
      return [];
    }
  }
}
