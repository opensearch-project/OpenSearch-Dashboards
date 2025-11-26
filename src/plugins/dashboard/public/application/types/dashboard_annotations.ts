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

export interface DashboardAnnotationConfig {
  id: string; // `${dashboardId}-annotation-config`
  type: 'dashboard-annotation-config';
  attributes: {
    dashboardId: string;
    annotations: DashboardAnnotation[];
  };
  references: Array<
    | { id: string; type: 'dashboard'; name: 'dashboard' }
    | { id: string; type: 'data-source'; name: string }
  >;
}

export interface DashboardAnnotation {
  // Common fields shared by all annotation rules
  id: string; // rule id (unique in this dashboard)
  name: string; // rule display name
  type: 'builtInRule' | 'fromQuery';
  enabled: boolean; // rule enabled/disabled
  showAnnotations: boolean; // rule toggle
  defaultColor: string;

  // Show in options
  showIn: 'all' | 'selected' | 'except';
  selectedVisualizations: string[];

  // Query configuration
  query: {
    queryType: 'time-regions';
    fromType: 'everyday' | 'weekdays';
    fromWeekdays: string[];
    fromTime: string;
    toType: 'everyday' | 'weekdays';
    toWeekdays: string[];
    toTime: string;

    recurrence?: {
      schedule: string;
      duration: number;
    };
  };

  // Metadata
  createdAt: string;
  updatedAt?: string;
}

export interface DashboardAnnotationsSavedObject {
  dashboardId: string;
  title?: string;
  annotations: DashboardAnnotation[];
  createdAt: string;
  updatedAt: string;
}
