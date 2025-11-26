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

import { SavedObjectsClientContract } from '../../../../../core/public';
import {
  DashboardAnnotation,
  DashboardAnnotationsSavedObject,
} from '../types/dashboard_annotations';

export class DashboardAnnotationsService {
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
      return savedObject.attributes.annotations || [];
    } catch (error: any) {
      if (
        error?.body?.statusCode === 404 ||
        error?.status === 404 ||
        error?.message?.includes('Not Found')
      ) {
        return [];
      }
      return [];
    }
  }

  async saveAnnotations(dashboardId: string, annotations: DashboardAnnotation[]): Promise<void> {
    try {
      const savedObjectId = this.getSavedObjectId(dashboardId);
      const now = new Date().toISOString();

      const attributes: DashboardAnnotationsSavedObject = {
        dashboardId,
        title: `Annotations for Dashboard ${dashboardId}`,
        annotations,
        createdAt: now,
        updatedAt: now,
      };

      try {
        // Try to update existing saved object
        await this.savedObjectsClient.update('dashboard_annotations', savedObjectId, {
          ...attributes,
          createdAt: undefined,
        });
      } catch (error: any) {
        // Check if it's a 404 error (not found)
        if (
          error?.body?.statusCode === 404 ||
          error?.status === 404 ||
          error?.message?.includes('Not Found')
        ) {
          // Create new saved object if it doesn't exist
          await this.savedObjectsClient.create('dashboard_annotations', attributes, {
            id: savedObjectId,
          });
        } else {
          throw error;
        }
      }
    } catch (error) {
      throw error;
    }
  }

  async deleteAnnotation(dashboardId: string, annotationId: string): Promise<void> {
    const annotations = await this.getAnnotations(dashboardId);
    const filteredAnnotations = annotations.filter((annotation) => annotation.id !== annotationId);
    await this.saveAnnotations(dashboardId, filteredAnnotations);
  }

  async updateAnnotation(
    dashboardId: string,
    updatedAnnotation: DashboardAnnotation
  ): Promise<void> {
    const annotations = await this.getAnnotations(dashboardId);
    const updatedAnnotations = annotations.map((annotation) =>
      annotation.id === updatedAnnotation.id ? updatedAnnotation : annotation
    );
    await this.saveAnnotations(dashboardId, updatedAnnotations);
  }

  async addAnnotation(dashboardId: string, newAnnotation: DashboardAnnotation): Promise<void> {
    const annotations = await this.getAnnotations(dashboardId);
    annotations.push(newAnnotation);
    await this.saveAnnotations(dashboardId, annotations);
  }

  async deleteAllAnnotations(dashboardId: string): Promise<void> {
    try {
      const savedObjectId = this.getSavedObjectId(dashboardId);
      await this.savedObjectsClient.delete('dashboard_annotations', savedObjectId);
    } catch (error: any) {
      if (
        !(
          error?.body?.statusCode === 404 ||
          error?.status === 404 ||
          error?.message?.includes('Not Found')
        )
      ) {
        throw error;
      }
    }
  }
}
