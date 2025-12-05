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

import { BehaviorSubject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { SavedObjectsClientContract } from '../../../../../core/public';
import {
  DashboardAnnotation,
  DashboardAnnotationsSavedObject,
} from '../types/dashboard_annotations';

interface AnnotationChangeEvent {
  dashboardId: string;
  annotations: DashboardAnnotation[];
  changeType: 'save' | 'delete' | 'update' | 'add';
}

export class DashboardAnnotationsService {
  private static instance: DashboardAnnotationsService | null = null;
  private savedObjectsClient: SavedObjectsClientContract;
  private annotationChanges$ = new BehaviorSubject<AnnotationChangeEvent | null>(null);

  private constructor(savedObjectsClient: SavedObjectsClientContract) {
    this.savedObjectsClient = savedObjectsClient;
  }

  public static getInstance(
    savedObjectsClient: SavedObjectsClientContract
  ): DashboardAnnotationsService {
    if (!DashboardAnnotationsService.instance) {
      DashboardAnnotationsService.instance = new DashboardAnnotationsService(savedObjectsClient);
    } else {
      // Update the savedObjectsClient in case it changed
      DashboardAnnotationsService.instance.savedObjectsClient = savedObjectsClient;
    }
    return DashboardAnnotationsService.instance;
  }

  public static resetInstance() {
    DashboardAnnotationsService.instance = null;
  }

  subscribeToAnnotationChanges(dashboardId: string): Observable<DashboardAnnotation[]> {
    return this.annotationChanges$.pipe(
      filter((event) => event !== null && event.dashboardId === dashboardId),
      map((event) => event!.annotations)
    );
  }

  subscribeToAllAnnotationChanges(): Observable<AnnotationChangeEvent> {
    return this.annotationChanges$.pipe(filter((event) => event !== null)) as Observable<
      AnnotationChangeEvent
    >;
  }

  private emitAnnotationChange(
    dashboardId: string,
    annotations: DashboardAnnotation[],
    changeType: AnnotationChangeEvent['changeType']
  ) {
    this.annotationChanges$.next({
      dashboardId,
      annotations,
      changeType,
    });
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

      // Emit annotation change event
      this.emitAnnotationChange(dashboardId, annotations, 'save');
    } catch (error) {
      throw error;
    }
  }

  async deleteAnnotation(dashboardId: string, annotationId: string): Promise<void> {
    const annotations = await this.getAnnotations(dashboardId);
    const filteredAnnotations = annotations.filter((annotation) => annotation.id !== annotationId);

    // Use internal save without emitting duplicate event
    await this.saveAnnotationsInternal(dashboardId, filteredAnnotations);

    // Emit specific delete event
    this.emitAnnotationChange(dashboardId, filteredAnnotations, 'delete');
  }

  async updateAnnotation(
    dashboardId: string,
    updatedAnnotation: DashboardAnnotation
  ): Promise<void> {
    const annotations = await this.getAnnotations(dashboardId);
    const updatedAnnotations = annotations.map((annotation) =>
      annotation.id === updatedAnnotation.id ? updatedAnnotation : annotation
    );

    // Use internal save without emitting duplicate event
    await this.saveAnnotationsInternal(dashboardId, updatedAnnotations);

    // Emit specific update event
    this.emitAnnotationChange(dashboardId, updatedAnnotations, 'update');
  }

  async addAnnotation(dashboardId: string, newAnnotation: DashboardAnnotation): Promise<void> {
    const annotations = await this.getAnnotations(dashboardId);
    const newAnnotations = [...annotations, newAnnotation];

    // Use internal save without emitting duplicate event
    await this.saveAnnotationsInternal(dashboardId, newAnnotations);

    // Emit specific add event
    this.emitAnnotationChange(dashboardId, newAnnotations, 'add');
  }

  async deleteAllAnnotations(dashboardId: string): Promise<void> {
    try {
      const savedObjectId = this.getSavedObjectId(dashboardId);
      await this.savedObjectsClient.delete('dashboard_annotations', savedObjectId);

      // Emit delete event with empty annotations
      this.emitAnnotationChange(dashboardId, [], 'delete');
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

  private async saveAnnotationsInternal(
    dashboardId: string,
    annotations: DashboardAnnotation[]
  ): Promise<void> {
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
      if (
        error?.body?.statusCode === 404 ||
        error?.status === 404 ||
        error?.message?.includes('Not Found')
      ) {
        await this.savedObjectsClient.create('dashboard_annotations', attributes, {
          id: savedObjectId,
        });
      } else {
        throw error;
      }
    }
  }
}
